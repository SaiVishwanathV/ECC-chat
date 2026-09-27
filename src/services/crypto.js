import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Utility functions for ArrayBuffer <-> Base64 / Hex conversions.
 */
export function bufToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export function base64ToBuf(base64) {
  if (!base64) return new Uint8Array(0).buffer;
  const clean = base64.replace(/\s+/g, '');
  const binary = window.atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function bufToHex(buffer) {
  const byteArray = new Uint8Array(buffer);
  return Array.from(byteArray)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function hexToBuf(hexString) {
  if (!hexString) return new Uint8Array(0).buffer;
  const cleanHex = hexString.replace(/\s+/g, '');
  const bytes = new Uint8Array(Math.ceil(cleanHex.length / 2));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleanHex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes.buffer;
}

/**
 * Convert string (Base64 or Hex) to ArrayBuffer.
 */
export function toBuffer(dataStr) {
  if (!dataStr) return new Uint8Array(0).buffer;
  // If it's valid hex (only 0-9a-fA-F and even length >= 24)
  if (/^[0-9a-fA-F]+$/.test(dataStr) && dataStr.length % 2 === 0 && dataStr.length > 20) {
    try {
      return hexToBuf(dataStr);
    } catch {
      // Fall through to Base64
    }
  }
  try {
    return base64ToBuf(dataStr);
  } catch {
    return hexToBuf(dataStr);
  }
}

/**
 * Generate ECC P-256 (secp256r1) key pair for ECDH.
 */
export async function generateKeyPair() {
  return await window.crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true,
    ['deriveKey', 'deriveBits']
  );
}

/**
 * Export ECDH Public Key to SPKI Hex string.
 */
export async function exportPublicKey(publicKey) {
  const exported = await window.crypto.subtle.exportKey('spki', publicKey);
  return bufToHex(exported);
}

/**
 * Import ECDH Public Key from SPKI (supports Hex or Base64).
 */
export async function importPublicKey(publicKeyData) {
  if (!publicKeyData) throw new Error('Public key missing');
  const buffer = toBuffer(publicKeyData);
  return await window.crypto.subtle.importKey(
    'spki',
    buffer,
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true,
    []
  );
}

/**
 * Export ECDH Private Key to PKCS8 Hex string.
 */
export async function exportPrivateKey(privateKey) {
  const exported = await window.crypto.subtle.exportKey('pkcs8', privateKey);
  return bufToHex(exported);
}

/**
 * Import ECDH Private Key from PKCS8 (supports Hex or Base64).
 */
export async function importPrivateKey(privateKeyData) {
  if (!privateKeyData) throw new Error('Private key missing');
  const buffer = toBuffer(privateKeyData);
  return await window.crypto.subtle.importKey(
    'pkcs8',
    buffer,
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true,
    ['deriveKey', 'deriveBits']
  );
}

/**
 * Derive 256-bit raw shared secret using ECDH.
 */
export async function deriveSharedSecret(privateKey, peerPublicKey) {
  return await window.crypto.subtle.deriveBits(
    {
      name: 'ECDH',
      public: peerPublicKey,
    },
    privateKey,
    256
  );
}

/**
 * Derive 256-bit AES-GCM key from ECDH shared secret using HKDF SHA-256.
 */
export async function deriveAESKey(sharedSecretBits) {
  const hkdfBaseKey = await window.crypto.subtle.importKey(
    'raw',
    sharedSecretBits,
    { name: 'HKDF' },
    false,
    ['deriveKey']
  );

  return await window.crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new Uint8Array(16),
      info: new TextEncoder().encode('SChat-v1.0-E2EE'),
    },
    hkdfBaseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a text message using AES-256-GCM & ECDH key derivation.
 * Returns { ciphertext, iv }.
 */
export async function encryptMessage({
  text,
  senderId,
  receiverId,
  senderPrivateKey,
  senderPublicKey,
  receiverPublicKey,
}) {
  if (!text) return { ciphertext: '', iv: '' };

  const senderPrivKey = await importPrivateKey(senderPrivateKey);
  const recPubKey = await importPublicKey(receiverPublicKey);

  // Derive shared secret between sender private key and receiver public key
  const sharedSecret = await deriveSharedSecret(senderPrivKey, recPubKey);
  const aesKey = await deriveAESKey(sharedSecret);

  // Generate random 12-byte IV for AES-256-GCM
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const ivBase64 = bufToBase64(iv);
  const encodedText = new TextEncoder().encode(text);

  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    encodedText
  );

  const ciphertext = bufToBase64(ciphertextBuffer);

  // Required Debug Logs
  console.log("Encrypt -> sender", senderId);
  console.log("Encrypt -> receiver", receiverId);
  console.log("Sender public key", senderPublicKey);
  console.log("Receiver public key", receiverPublicKey);
  console.log("IV", ivBase64);
  console.log("Cipher length", ciphertext.length);

  return {
    ciphertext,
    iv: ivBase64,
  };
}

/**
 * Decrypt an AES-256-GCM message.
 */
export async function decryptMessage({
  message,
  currentUser,
  userPrivateKey,
  senderPublicKey,
}) {
  const ciphertext = message.ciphertext || message.encryptedMessage;
  const iv = message.iv;

  if (!ciphertext || !iv || !userPrivateKey || !senderPublicKey) {
    return '';
  }

  const privateKeyExists = !!userPrivateKey;

  // Required Debug Logs
  console.log("Decrypt -> receiver", currentUser?.uid || currentUser);
  console.log("Decrypt -> sender", message.senderId);
  console.log("Using sender public key", senderPublicKey);
  console.log("Using receiver private key", privateKeyExists);
  console.log("IV", message.iv || iv);
  console.log("Ciphertext", message.ciphertext || ciphertext);

  try {
    const receiverPrivKey = await importPrivateKey(userPrivateKey);
    const senderPubKey = await importPublicKey(senderPublicKey);

    const sharedSecret = await deriveSharedSecret(receiverPrivKey, senderPubKey);
    const aesKey = await deriveAESKey(sharedSecret);

    const ivBuf = toBuffer(iv);
    const cipherBuf = toBuffer(ciphertext);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBuf },
      aesKey,
      cipherBuf
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (error) {
    // Attempt decryption with historical private keys if key was rotated
    const historyKeys = getHistoricalPrivateKeys(currentUser?.uid || currentUser);
    for (const oldKey of historyKeys) {
      try {
        const histPrivKey = await importPrivateKey(oldKey);
        const senderPubKey = await importPublicKey(senderPublicKey);
        const sharedSecret = await deriveSharedSecret(histPrivKey, senderPubKey);
        const aesKey = await deriveAESKey(sharedSecret);
        const ivBuf = toBuffer(iv);
        const cipherBuf = toBuffer(ciphertext);
        const decryptedBuffer = await window.crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: ivBuf },
          aesKey,
          cipherBuf
        );
        return new TextDecoder().decode(decryptedBuffer);
      } catch {
        // try next historical key
      }
    }

    console.error("ECC Decryption Failed:", error);
    console.error("Message ID:", message.id);
    return '[Encrypted message]';
  }
}

/**
 * Retrieve past private keys stored for a user to keep historical messages decryptable.
 */
export function getHistoricalPrivateKeys(userId) {
  if (!userId) return [];
  try {
    const history = JSON.parse(localStorage.getItem(`schat_priv_history_${userId}`) || '[]');
    return history.map((item) => item.privateKey).filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Perform ECC P-256 Key Rotation:
 * 1. Generates a brand-new ECDH P-256 key pair via Web Crypto API.
 * 2. Exports public key as Base64/SPKI.
 * 3. Exports private key as PKCS8 Base64.
 * 4. Archives old private key into localStorage and user_keys history to keep old chats decryptable.
 * 5. Replaces active keys in localStorage.
 * 6. Computes new SHA-256 fingerprint.
 * 7. Updates Firestore /users/{uid} with:
 *    - publicKey
 *    - keyFingerprint
 *    - keyUpdatedAt (serverTimestamp)
 * 8. Returns { publicKey, privateKey, fingerprint }.
 */
export async function rotateUserKeyPair(userId) {
  if (!userId) throw new Error('User ID is required for key rotation');

  // 1. Generate brand-new ECDH P-256 key pair
  const keyPair = await generateKeyPair();

  // 2. Export public key as Base64 SPKI
  const exportedPub = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
  const newPublicKeyBase64 = bufToBase64(exportedPub);

  // 3. Export private key as PKCS8 Base64
  const exportedPriv = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
  const newPrivateKeyBase64 = bufToBase64(exportedPriv);

  // 4. Archive old private key to local history
  const privKeyKey = `schat_priv_${userId}`;
  const pubKeyKey = `schat_pub_${userId}`;
  const historyKey = `schat_priv_history_${userId}`;

  const oldPriv = localStorage.getItem(privKeyKey);
  const oldPub = localStorage.getItem(pubKeyKey);

  if (oldPriv) {
    try {
      const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
      history.push({ privateKey: oldPriv, publicKey: oldPub, rotatedAt: Date.now() });
      localStorage.setItem(historyKey, JSON.stringify(history));
    } catch {
      // ignore
    }
  }

  // Replace active keys in localStorage
  localStorage.setItem(privKeyKey, newPrivateKeyBase64);
  localStorage.setItem(pubKeyKey, newPublicKeyBase64);

  // 5. Compute new SHA-256 fingerprint
  const newFingerprint = await generateFingerprint(newPublicKeyBase64);

  // 6. Persist in Firestore user_keys with history
  try {
    const userKeyRef = doc(db, 'user_keys', userId);
    const userKeySnap = await getDoc(userKeyRef);
    const existingPrev =
      userKeySnap.exists() && Array.isArray(userKeySnap.data().previousKeys)
        ? userKeySnap.data().previousKeys
        : [];
    if (oldPriv) {
      existingPrev.push({ privateKey: oldPriv, publicKey: oldPub, rotatedAt: Date.now() });
    }
    await setDoc(userKeyRef, {
      publicKey: newPublicKeyBase64,
      privateKey: newPrivateKeyBase64,
      previousKeys: existingPrev,
      userId,
      keyUpdatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Could not persist key backup to user_keys:', err);
  }

  // 7. Update Firestore /users/{uid}
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    publicKey: newPublicKeyBase64,
    keyFingerprint: newFingerprint,
    keyUpdatedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return {
    publicKey: newPublicKeyBase64,
    privateKey: newPrivateKeyBase64,
    fingerprint: newFingerprint,
  };
}

/**
 * Generate SHA-256 fingerprint for a public key.
 */
export async function generateFingerprint(publicKeyHex) {
  if (!publicKeyHex) return '';
  const encoder = new TextEncoder();
  const data = encoder.encode(publicKeyHex);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  return bufToHex(hashBuffer).toUpperCase();
}

/**
 * Ensures user has an ECC keypair in localStorage, or restores from Firestore user_keys,
 * or creates a new one once and persists it. Never regenerates after signup/login.
 * Returns { publicKeyHex, privateKeyHex, publicKey, privateKey }.
 */
export async function getOrGenerateUserKeyPair(userId, forceRegenerate = false) {
  if (!userId) return null;
  const privKeyKey = `schat_priv_${userId}`;
  const pubKeyKey = `schat_pub_${userId}`;

  // 1. Check browser localStorage
  if (!forceRegenerate) {
    const existingPriv = localStorage.getItem(privKeyKey);
    const existingPub = localStorage.getItem(pubKeyKey);
    if (existingPriv && existingPub) {
      return {
        publicKeyHex: existingPub,
        privateKeyHex: existingPriv,
        publicKey: existingPub,
        privateKey: existingPriv,
      };
    }
  }

  // 2. Check Firestore persistent user_keys collection for this user
  try {
    const keyDocRef = doc(db, 'user_keys', userId);
    const keySnap = await getDoc(keyDocRef);
    if (keySnap.exists()) {
      const data = keySnap.data();
      if (data.privateKey && data.publicKey) {
        localStorage.setItem(privKeyKey, data.privateKey);
        localStorage.setItem(pubKeyKey, data.publicKey);
        return {
          publicKeyHex: data.publicKey,
          privateKeyHex: data.privateKey,
          publicKey: data.publicKey,
          privateKey: data.privateKey,
        };
      }
    }
  } catch {
    // If offline or rule error, proceed to generate
  }

  // 3. Generate keypair once
  const keyPair = await generateKeyPair();
  const publicKeyHex = await exportPublicKey(keyPair.publicKey);
  const privateKeyHex = await exportPrivateKey(keyPair.privateKey);

  // Store in localStorage
  localStorage.setItem(privKeyKey, privateKeyHex);
  localStorage.setItem(pubKeyKey, publicKeyHex);

  // Persist in Firestore user_keys (so private key is never lost on login/incognito)
  try {
    const keyDocRef = doc(db, 'user_keys', userId);
    await setDoc(keyDocRef, {
      publicKey: publicKeyHex,
      privateKey: privateKeyHex,
      userId,
    });
  } catch {
    // Non-blocking
  }

  return {
    publicKeyHex,
    privateKeyHex,
    publicKey: publicKeyHex,
    privateKey: privateKeyHex,
  };
}
