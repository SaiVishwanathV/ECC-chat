import {
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  deleteUser,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from './firebase';

/**
 * Sign in or sign up using Google Auth provider.
 */
export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/**
 * Register user with Email & Password.
 */
export async function registerWithEmail(email, password, displayName) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) {
    await updateProfile(userCredential.user, { displayName });
  }
  return userCredential.user;
}

/**
 * Log in user with Email & Password.
 */
export async function loginWithEmail(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

/**
 * Send email verification link to current user.
 */
export async function sendUserEmailVerification(user = auth.currentUser) {
  if (user) {
    await sendEmailVerification(user);
  }
}

/**
 * Send password reset email.
 */
export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

/**
 * Log out current user.
 */
export async function logoutUser() {
  await signOut(auth);
}

/**
 * Permanently delete user authentication account.
 */
export async function deleteUserAccount() {
  const user = auth.currentUser;
  if (user) {
    await deleteUser(user);
  }
}
