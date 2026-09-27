import { doc, getDoc, setDoc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import emailjs from '@emailjs/browser';
import { db } from './firebase';

/**
 * Generate cryptographically secure 6-digit numeric OTP using Web Crypto API.
 */
export function generateSecureOTP() {
  const array = new Uint32Array(1);
  window.crypto.getRandomValues(array);
  const otpNumber = 100000 + (array[0] % 900000);
  return otpNumber.toString();
}

/**
 * Compute SHA-256 hash of an OTP string.
 */
export async function hashOTP(otpString) {
  const encoder = new TextEncoder();
  const data = encoder.encode(otpString.trim());
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const byteArray = new Uint8Array(hashBuffer);
  return Array.from(byteArray)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Mask email for privacy display (e.g. v********h@gmail.com).
 */
export function maskEmail(email) {
  if (!email || !email.includes('@')) return email || '';
  const [name, domain] = email.split('@');
  if (name.length <= 2) {
    return `${name[0]}*@${domain}`;
  }
  const maskedName = name[0] + '*'.repeat(Math.max(name.length - 2, 6)) + name[name.length - 1];
  return `${maskedName}@${domain}`;
}

/**
 * Store SHA-256 OTP Hash in Firestore `email_otps/{uid}` and dispatch EmailJS email.
 */
export async function createAndSendOTP({ uid, email, recipientName = 'User' }) {
  if (!uid || !email) throw new Error('UID and Email are required for OTP generation.');

  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey) {
    throw new Error('Email service configuration missing. Please check VITE_EMAILJS_* keys in .env.local.');
  }

  const otp = generateSecureOTP();
  const otpHash = await hashOTP(otp);
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity

  // Store SHA-256 hash in Firestore email_otps collection
  const otpRef = doc(db, 'email_otps', uid);
  await setDoc(otpRef, {
    uid,
    email: email.trim().toLowerCase(),
    otpHash,
    expiresAt,
    attempts: 0,
    createdAt: serverTimestamp(),
  });

  console.log("SERVICE:", serviceId);
  console.log("TEMPLATE:", templateId);
  console.log("PUBLIC KEY:", publicKey);

  try {
    await emailjs.send(
      serviceId,
      templateId,
      {
        email: email.trim(),
        recipient_name: recipientName,
        passcode: otp,
        expiry: '5 minutes',
      },
      publicKey
    );
    return { success: true };
  } catch (err) {
    // Delete created OTP document if EmailJS send fails
    await deleteDoc(otpRef).catch(() => {});
    const errorMsg = err?.text || err?.message || 'OTP sending failed due to network or service error.';
    throw new Error(errorMsg);
  }
}

/**
 * Verify entered 6-digit OTP against Firestore stored SHA-256 hash.
 */
export async function verifyFirestoreOTP(uid, enteredOTP) {
  if (!uid || !enteredOTP) {
    return { success: false, error: 'Invalid verification details.' };
  }

  const otpRef = doc(db, 'email_otps', uid);
  const otpSnap = await getDoc(otpRef);

  if (!otpSnap.exists()) {
    return { success: false, error: 'No active OTP request found. Please click Resend Code.' };
  }

  const data = otpSnap.data();

  // Check max attempts (5)
  if (data.attempts >= 5) {
    await deleteDoc(otpRef);
    return {
      success: false,
      maxAttemptsReached: true,
      error: 'Maximum verification attempts (5/5) exceeded. Please click Resend Code.',
    };
  }

  // Check 5-minute expiry
  if (Date.now() > data.expiresAt) {
    return {
      success: false,
      expired: true,
      error: 'OTP code has expired (5 minute limit). Please click Resend Code.',
    };
  }

  const enteredHash = await hashOTP(enteredOTP);

  if (data.otpHash !== enteredHash) {
    const newAttempts = (data.attempts || 0) + 1;
    if (newAttempts >= 5) {
      await deleteDoc(otpRef);
      return {
        success: false,
        maxAttemptsReached: true,
        error: 'Maximum verification attempts (5/5) exceeded. Please click Resend Code.',
      };
    } else {
      await updateDoc(otpRef, { attempts: newAttempts });
      const remaining = 5 - newAttempts;
      return {
        success: false,
        error: `Invalid OTP code. ${remaining} attempt(s) remaining.`,
      };
    }
  }

  // Success: Delete OTP document and mark user active and email verified in Firestore
  await deleteDoc(otpRef);
  await updateDoc(doc(db, 'users', uid), {
    emailVerified: true,
    status: 'active',
    updatedAt: serverTimestamp(),
  });

  return { success: true };
}
