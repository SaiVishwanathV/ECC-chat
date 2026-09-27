import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  onSnapshot,
  orderBy,
  serverTimestamp,
  deleteDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { encryptMessage, getOrGenerateUserKeyPair } from './crypto';

/**
 * Ensures user document exists in Firestore and attaches ECC public key.
 */
export async function syncUserProfile(user, additionalData = {}) {
  if (!user) return null;

  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  // Retrieve or generate ECC keypair locally
  const { publicKeyHex } = await getOrGenerateUserKeyPair(user.uid);

  const baseData = {
    uid: user.uid,
    displayName: user.displayName || additionalData.displayName || user.email.split('@')[0],
    username: additionalData.username || (user.email ? user.email.split('@')[0].toLowerCase() : `user_${user.uid.slice(0, 6)}`),
    email: user.email || '',
    avatar: additionalData.avatar || 'avatar01',
    provider: user.providerData && user.providerData[0] ? user.providerData[0].providerId : 'password',
    status: additionalData.status || 'pending_verification',
    emailVerified: user.emailVerified || false,
    publicKey: publicKeyHex,
    updatedAt: serverTimestamp(),
  };

  if (!userSnap.exists()) {
    baseData.createdAt = serverTimestamp();
    await setDoc(userRef, baseData);
  } else {
    // Update missing public key or updated fields
    const currentData = userSnap.data();
    const updatePayload = {
      updatedAt: serverTimestamp(),
    };
    if (additionalData.avatar) {
      updatePayload.avatar = additionalData.avatar;
    }
    if (user.emailVerified || additionalData.emailVerified || currentData?.emailVerified) {
      updatePayload.emailVerified = true;
      updatePayload.status = 'active';
    }
    // Keep persistent identity public key (never overwrite if exists)
    if (!currentData.publicKey) {
      updatePayload.publicKey = publicKeyHex;
    }
    await updateDoc(userRef, updatePayload);
  }

  return (await getDoc(userRef)).data();
}

/**
 * Update current user profile.
 */
export async function updateUserProfile(uid, data) {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Get single user profile by UID.
 */
export async function getUserProfile(uid) {
  if (!uid) return null;
  const userSnap = await getDoc(doc(db, 'users', uid));
  return userSnap.exists() ? userSnap.data() : null;
}

/**
 * Find user document by username.
 */
export async function findUserByUsername(username) {
  if (!username) return null;
  const cleanUser = username.trim().toLowerCase();
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('username', '==', cleanUser));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return snapshot.docs[0].data();
}

/**
 * Check if username is already registered.
 */
export async function checkUsernameExists(username) {
  const user = await findUserByUsername(username);
  return !!user;
}

/**
 * Search users in Firestore by username, email or displayName.
 */
export async function searchUsers(searchTerm, currentUserId) {
  if (!searchTerm || !searchTerm.trim()) return [];

  const term = searchTerm.trim().toLowerCase();
  const usersRef = collection(db, 'users');
  const q = query(usersRef);
  const snapshot = await getDocs(q);

  const results = [];
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    if (data.uid !== currentUserId) {
      const matchName = data.displayName && data.displayName.toLowerCase().includes(term);
      const matchUser = data.username && data.username.toLowerCase().includes(term);
      const matchEmail = data.email && data.email.toLowerCase().includes(term);
      if (matchName || matchUser || matchEmail) {
        results.push(data);
      }
    }
  });

  return results;
}

/**
 * Get or create a 1-on-1 conversation between two users.
 */
export async function getOrCreateConversation(currentUserId, targetUserId) {
  const convsRef = collection(db, 'conversations');
  const q = query(convsRef, where('participants', 'array-contains', currentUserId));
  const snapshot = await getDocs(q);

  let existingId = null;
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    if (data.participants && data.participants.includes(targetUserId)) {
      existingId = docSnap.id;
    }
  });

  if (existingId) {
    return existingId;
  }

  // Create new conversation document
  const newConv = await addDoc(convsRef, {
    participants: [currentUserId, targetUserId],
    lastMessage: 'Conversation started',
    lastMessageTime: serverTimestamp(),
    createdAt: serverTimestamp(),
  });

  return newConv.id;
}

/**
 * Listen to real-time conversations for a user.
 */
export function listenUserConversations(userId, callback) {
  const convsRef = collection(db, 'conversations');
  const q = query(convsRef, where('participants', 'array-contains', userId));

  return onSnapshot(q, (snapshot) => {
    const convs = [];
    snapshot.forEach((docSnap) => {
      convs.push({ id: docSnap.id, ...docSnap.data() });
    });
    // Sort in memory by lastMessageTime descending
    convs.sort((a, b) => {
      const tA = a.lastMessageTime ? a.lastMessageTime.toMillis() : 0;
      const tB = b.lastMessageTime ? b.lastMessageTime.toMillis() : 0;
      return tB - tA;
    });
    callback(convs);
  });
}

/**
 * Listen to real-time messages in a conversation.
 */
export function listenMessages(conversationId, callback) {
  if (!conversationId) return () => {};
  const msgsRef = collection(db, 'conversations', conversationId, 'messages');
  const q = query(msgsRef, orderBy('timestamp', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const msgs = [];
    snapshot.forEach((docSnap) => {
      msgs.push({ id: docSnap.id, ...docSnap.data() });
    });
    callback(msgs);
  });
}

/**
 * Send an E2E encrypted message to a conversation.
 */
export async function sendEncryptedChatMessage({
  conversationId,
  senderId,
  receiverId,
  recipientPublicKeyHex,
  senderPrivateKeyHex,
  senderPublicKeyHex,
  text = '',
  attachment = null,
}) {
  const { ciphertext, iv } = await encryptMessage({
    text,
    senderId,
    receiverId,
    senderPrivateKey: senderPrivateKeyHex,
    senderPublicKey: senderPublicKeyHex,
    receiverPublicKey: recipientPublicKeyHex,
  });

  const msgsRef = collection(db, 'conversations', conversationId, 'messages');
  const messageData = {
    senderId,
    receiverId,
    iv,
    ciphertext,
    authTag: 'AES-GCM-256',
    encryptedMessage: ciphertext,
    senderPublicKey: senderPublicKeyHex,
    receiverPublicKey: recipientPublicKeyHex,
    ephemeralKey: senderPublicKeyHex,
    timestamp: serverTimestamp(),
    read: false,
  };

  if (attachment) {
    messageData.attachmentUrl = attachment.url;
    messageData.attachmentName = attachment.name;
    messageData.attachmentType = attachment.type;
  }

  await addDoc(msgsRef, messageData);

  // Update conversation lastMessage summary
  const convRef = doc(db, 'conversations', conversationId);
  await updateDoc(convRef, {
    lastMessage: attachment ? `[Attachment] ${attachment.name}` : '[Encrypted Message]',
    lastMessageTime: serverTimestamp(),
  });
}

/**
 * Mark message as read.
 */
export async function markMessageAsRead(conversationId, messageId) {
  if (!conversationId || !messageId) return;
  const msgRef = doc(db, 'conversations', conversationId, 'messages', messageId);
  await updateDoc(msgRef, { read: true });
}

/**
 * Delete a user profile and clean up data.
 */
export async function deleteUserData(uid) {
  if (!uid) return;
  await deleteDoc(doc(db, 'users', uid));
}
