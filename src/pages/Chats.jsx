import { useState, useEffect, useCallback } from 'react';
import { ShieldAlert, Loader2 } from 'lucide-react';
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
import { getOrGenerateUserKeyPair, rotateUserKeyPair, decryptMessage } from '../services/crypto';

export default function Chats({ user }) {
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [userKeyPair, setUserKeyPair] = useState(null);
  const [showKeyMismatchModal, setShowKeyMismatchModal] = useState(false);
  const [isRotatingKeys, setIsRotatingKeys] = useState(false);

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

    // Load or retrieve persistent ECC keypair
    getOrGenerateUserKeyPair(user.uid).then((keys) => {
      setUserKeyPair(keys);
    });
  }, [user]);

  // Check for key mismatch between local keys and Firestore public key
  useEffect(() => {
    if (
      currentUserProfile?.publicKey &&
      userKeyPair?.publicKeyHex &&
      currentUserProfile.publicKey !== userKeyPair.publicKeyHex
    ) {
      setShowKeyMismatchModal(true);
    }
  }, [currentUserProfile, userKeyPair]);

  const handleConfirmKeyRotate = async () => {
    if (!user || isRotatingKeys) return;
    setIsRotatingKeys(true);
    try {
      const newKeys = await rotateUserKeyPair(user.uid);
      setUserKeyPair(newKeys);
      setCurrentUserProfile((prev) => ({
        ...prev,
        publicKey: newKeys.publicKey,
        keyFingerprint: newKeys.fingerprint,
      }));
      setShowKeyMismatchModal(false);
    } catch (err) {
      console.error('Failed to rotate keys on mismatch:', err);
    } finally {
      setIsRotatingKeys(false);
    }
  };

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
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#F6F8FC] pb-16 md:pb-0">
      <Navbar currentUserProfile={currentUserProfile} />

      <main className="flex-1 flex overflow-hidden relative min-h-0">
        {/* Sidebar: Full width on mobile when no conversation active, fixed width on md+ */}
        <div className={`h-full w-full md:w-80 lg:w-96 shrink-0 ${activeConvId ? 'hidden md:block' : 'block'}`}>
          <Sidebar
            conversations={conversations}
            activeConvId={activeConvId}
            onSelectConversation={(id) => setActiveConvId(id)}
            currentUserId={user?.uid}
            onStartNewChat={handleStartNewChat}
            usersMap={usersMap}
          />
        </div>

        {/* ChatWindow: Full width on mobile when conversation active, flex-1 on md+ */}
        <div className={`h-full flex-1 min-w-0 ${activeConvId ? 'block' : 'hidden md:block'}`}>
          <ChatWindow
            activeConv={activeConv}
            messages={messages}
            currentUserId={user?.uid}
            partnerUser={partnerUser}
            onSendMessage={handleSendMessage}
            onMarkRead={markMessageAsRead}
            onBackToList={() => setActiveConvId(null)}
          />
        </div>
      </main>

      {/* Key Mismatch Dialog */}
      {showKeyMismatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md glass-card rounded-[32px] p-6 shadow-2xl space-y-4 border border-white/80">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Encryption Key Mismatch</h3>
                <p className="text-xs text-slate-500">Security Notification</p>
              </div>
            </div>

            <p className="text-sm text-slate-700 leading-relaxed font-medium">
              Your encryption keys were generated on another device or browser. Generate a new key pair for this browser?
            </p>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                onClick={handleConfirmKeyRotate}
                disabled={isRotatingKeys}
                className="w-full py-3 px-5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
              >
                {isRotatingKeys ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating Keys...</span>
                  </>
                ) : (
                  <span>Generate New Key Pair</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
