import { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import {
  getUserProfile,
  getOrCreateConversation,
  listenUserConversations,
  listenMessages,
  sendEncryptedChatMessage,
  markMessageAsRead,
} from '../services/firestore';
import { getOrGenerateUserKeyPair, decryptMessage } from '../services/crypto';

export default function Chats({ user }) {
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [userKeyPair, setUserKeyPair] = useState(null);

  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);

  // Map of partner profiles: userId -> profile
  const [usersMap, setUsersMap] = useState({});

  // 1. Initial user setup
  useEffect(() => {
    if (!user) return;

    // Load profile
    getUserProfile(user.uid).then((prof) => {
      if (prof) setCurrentUserProfile(prof);
    });

    // Load or retrieve persistent ECC keypair (never regenerates after signup/login)
    getOrGenerateUserKeyPair(user.uid).then((keys) => {
      setUserKeyPair(keys);
    });
  }, [user]);

  // 2. Listen to user conversations
  useEffect(() => {
    if (!user) return;

    const unsubscribe = listenUserConversations(user.uid, (convs) => {
      setConversations(convs);

      // Fetch profiles for all partner participants
      convs.forEach(async (conv) => {
        const partnerId = conv.participants.find((id) => id !== user.uid);
        if (partnerId) {
          const profile = await getUserProfile(partnerId);
          if (profile) {
            setUsersMap((prev) => ({ ...prev, [partnerId]: profile }));
          }
        }
      });
    });

    return () => unsubscribe();
  }, [user]);

  // Active conversation partner profile
  const activeConv = conversations.find((c) => c.id === activeConvId);
  const partnerId = activeConv?.participants.find((id) => id !== user.uid);
  const partnerUser = partnerId ? usersMap[partnerId] : null;


  // 4. Decrypt & listen to messages in active conversation
  useEffect(() => {
    if (!activeConvId || !userKeyPair || !user) {
      setMessages([]);
      return;
    }

    const unsubscribe = listenMessages(activeConvId, async (rawMsgs) => {
      const decryptedMsgs = await Promise.all(
        rawMsgs.map(async (msg) => {
          const cipher = msg.ciphertext || msg.encryptedMessage;
          if (!cipher) {
            return { ...msg, decryptedText: '' };
          }

          // Determine peer public key:
          // Outgoing: peer is the receiver (partnerUser or msg.receiverPublicKey)
          // Incoming: peer is the sender (msg.senderPublicKey or partnerUser or msg.ephemeralKey)
          const isOutgoing = msg.senderId === user.uid;
          const peerPubKey = isOutgoing
            ? (msg.receiverPublicKey || msg.recipientPublicKey || partnerUser?.publicKey)
            : (msg.senderPublicKey || partnerUser?.publicKey || msg.ephemeralKey);

          const decryptedText = await decryptMessage({
            message: msg,
            currentUser: user,
            userPrivateKey: userKeyPair.privateKeyHex,
            senderPublicKey: peerPubKey,
          });

          return { ...msg, decryptedText };
        })
      );
      setMessages(decryptedMsgs);
    });

    return () => unsubscribe();
  }, [activeConvId, userKeyPair, partnerUser, user]);

  // Handle starting new chat with a user ID
  const handleStartNewChat = async (targetUserId) => {
    const targetProfile = await getUserProfile(targetUserId);
    if (targetProfile) {
      setUsersMap((prev) => ({ ...prev, [targetUserId]: targetProfile }));
    }
    const convId = await getOrCreateConversation(user.uid, targetUserId);
    setActiveConvId(convId);
  };

  // Send message handler
  const handleSendMessage = useCallback(
    async (text, attachment) => {
      if (!activeConvId || !userKeyPair || !partnerId) return;

      // Always fetch fresh partner profile to get latest public key
      const latestPartner = await getUserProfile(partnerId);
      const recipientPubKey = latestPartner?.publicKey || partnerUser?.publicKey;
      if (!recipientPubKey) {
        console.error("Partner public key missing");
        return;
      }

      await sendEncryptedChatMessage({
        conversationId: activeConvId,
        senderId: user.uid,
        receiverId: partnerId,
        recipientPublicKeyHex: recipientPubKey,
        senderPrivateKeyHex: userKeyPair.privateKeyHex,
        senderPublicKeyHex: userKeyPair.publicKeyHex,
        text,
        attachment,
      });
    },
    [activeConvId, partnerId, partnerUser, userKeyPair, user]
  );

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#F6F8FC]">
      <Navbar currentUserProfile={currentUserProfile} />

      <main className="flex-1 flex overflow-hidden relative">
        <Sidebar
          conversations={conversations}
          activeConvId={activeConvId}
          onSelectConversation={(id) => setActiveConvId(id)}
          currentUserId={user?.uid}
          onStartNewChat={handleStartNewChat}
          usersMap={usersMap}
        />

        <ChatWindow
          activeConv={activeConv}
          messages={messages}
          currentUserId={user?.uid}
          partnerUser={partnerUser}
          onSendMessage={handleSendMessage}
          onMarkRead={markMessageAsRead}
        />
      </main>
    </div>
  );
}
