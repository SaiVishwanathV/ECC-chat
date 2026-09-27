import { useState, useEffect, useRef } from 'react';
import {
  Send,
  Paperclip,
  Smile,
  ShieldCheck,
  Info,
  X,
  FileText,
  Lock,
  Loader2,
  Copy,
  Check,
  BellOff,
  UserX,
  Trash2,
} from 'lucide-react';
import MessageBubble from './MessageBubble';
import { formatFingerprint } from '../utils/fingerprint';
import { generateFingerprint } from '../services/crypto';
import { getAvatar } from '../utils/getAvatar';

const POPULAR_EMOJIS = ['😊', '😂', '🔥', '❤️', '👍', '🎉', '🔒', '✨', '🙌', '💯', '🚀', '😎'];

export default function ChatWindow({
  activeConv,
  messages,
  currentUserId,
  partnerUser,
  onSendMessage,
  onMarkRead,
}) {
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [partnerFingerprint, setPartnerFingerprint] = useState('');
  const [copiedFingerprint, setCopiedFingerprint] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark unread messages as read
  useEffect(() => {
    if (!activeConv || !messages) return;
    messages.forEach((msg) => {
      if (msg.senderId !== currentUserId && !msg.read) {
        onMarkRead(activeConv.id, msg.id);
      }
    });
  }, [messages, activeConv, currentUserId, onMarkRead]);

  // Generate fingerprint for partner's public key
  useEffect(() => {
    if (partnerUser?.publicKey) {
      generateFingerprint(partnerUser.publicKey).then((fp) => setPartnerFingerprint(fp));
    }
  }, [partnerUser]);

  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if ((!inputText.trim() && !selectedFile) || isUploading) return;

    let attachment = null;
    if (selectedFile) {
      setIsUploading(true);
      try {
        const fileUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });

        attachment = {
          url: fileUrl,
          name: selectedFile.name,
          type: selectedFile.type || 'application/octet-stream',
        };
      } catch {
        setIsUploading(false);
        return;
      }
    }

    const textToSend = inputText.trim();
    setInputText('');
    setSelectedFile(null);
    setIsUploading(false);
    setShowEmojiPicker(false);

    await onSendMessage(textToSend, attachment);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopyFingerprint = () => {
    if (!partnerFingerprint) return;
    navigator.clipboard.writeText(partnerFingerprint);
    setCopiedFingerprint(true);
    setTimeout(() => setCopiedFingerprint(false), 2000);
  };

  if (!activeConv || !partnerUser) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center glass-panel">
        <div className="w-20 h-20 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4 shadow-inner">
          <ShieldCheck className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-bold text-slate-800">Your Encrypted Messages</h3>
        <p className="text-sm text-slate-500 max-w-sm mt-1">
          Select a conversation or start a new chat to begin E2E encrypted messaging with Elliptic Curve Cryptography.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex h-full relative">
      <div className="flex-1 flex flex-col h-full bg-[#F6F8FC] relative overflow-hidden">
        {/* Header */}
        <div className="h-16 px-6 glass-panel border-b border-white/60 flex items-center justify-between z-10">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <img
                src={getAvatar(partnerUser.avatar || partnerUser.photoURL)}
                alt={partnerUser.displayName}
                className="w-10 h-10 rounded-full object-cover shadow-sm ring-2 ring-white/80"
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">{partnerUser.displayName}</h3>
                <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <Lock className="w-3 h-3" /> E2EE
                </span>
              </div>
              <p className="text-xs text-slate-500">@{partnerUser.username || 'user'}</p>
            </div>
          </div>

          <button
            onClick={() => setShowProfileDrawer(!showProfileDrawer)}
            className="p-2 rounded-full text-slate-500 hover:text-slate-800 hover:bg-white/80 transition-colors"
            title="Profile & Security Info"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>

        {/* Message Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-8 space-y-2">
              <Lock className="w-8 h-8 text-blue-500/60" />
              <p className="text-xs font-medium max-w-xs">
                Messages are end-to-end encrypted. No one outside of this chat can read them.
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOutgoing={msg.senderId === currentUserId}
                senderProfile={msg.senderId === currentUserId ? null : partnerUser}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Selected Attachment Preview */}
        {selectedFile && (
          <div className="px-6 py-2 glass-panel border-t border-white/60 flex items-center justify-between text-xs text-slate-700">
            <div className="flex items-center gap-2 truncate">
              <FileText className="w-4 h-4 text-blue-600" />
              <span className="font-medium truncate">{selectedFile.name}</span>
              <span className="text-slate-400">({Math.round(selectedFile.size / 1024)} KB)</span>
            </div>
            <button
              onClick={() => setSelectedFile(null)}
              className="p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Composer Form */}
        <div className="p-4 glass-panel border-t border-white/60 relative z-20">
          {/* Emoji Picker Popup */}
          {showEmojiPicker && (
            <div className="absolute bottom-20 left-6 p-3 glass-card rounded-2xl shadow-xl border border-white/80 grid grid-cols-6 gap-2 z-30 animate-fade-in">
              {POPULAR_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    setInputText((prev) => prev + emoji);
                    setShowEmojiPicker(false);
                  }}
                  className="w-8 h-8 flex items-center justify-center text-lg hover:bg-slate-100 rounded-lg transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSend} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2.5 rounded-full text-slate-500 hover:text-blue-600 hover:bg-white/80 transition-colors"
              title="Add Emoji"
            >
              <Smile className="w-5 h-5" />
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-full text-slate-500 hover:text-blue-600 hover:bg-white/80 transition-colors"
              title="Attach File"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            <input
              type="text"
              placeholder="iMessage (End-to-End Encrypted)..."
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="flex-1 glass-input rounded-full py-3 px-5 text-sm text-slate-800 placeholder-slate-400 outline-none"
            />

            <button
              type="submit"
              disabled={(!inputText.trim() && !selectedFile) || isUploading}
              className="p-3 rounded-full bg-blue-600 text-white disabled:opacity-40 hover:bg-blue-700 transition-all duration-200 shadow-md shadow-blue-500/20 active:scale-95 flex items-center justify-center"
            >
              {isUploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Profile Drawer */}
      {showProfileDrawer && (
        <div className="w-80 glass-panel border-l border-white/60 h-full overflow-y-auto p-6 flex flex-col z-20 animate-slide-left">
          <div className="flex items-center justify-between pb-4 border-b border-white/50">
            <h3 className="font-bold text-slate-800 text-base">Contact Info</h3>
            <button
              onClick={() => setShowProfileDrawer(false)}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="py-6 text-center space-y-3">
            <img
              src={getAvatar(partnerUser.avatar || partnerUser.photoURL)}
              alt={partnerUser.displayName}
              className="w-24 h-24 rounded-full object-cover mx-auto shadow-md ring-4 ring-white/90"
            />
            <div>
              <h4 className="font-bold text-slate-900 text-lg">{partnerUser.displayName}</h4>
              <p className="text-xs text-slate-500">@{partnerUser.username || 'user'}</p>
              <p className="text-xs text-slate-400">{partnerUser.email}</p>
            </div>
          </div>

          {/* E2EE Security Section */}
          <div className="glass-card rounded-2xl p-4 space-y-2 mb-4">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider">
              <Lock className="w-4 h-4" /> SHA-256 Key Fingerprint
            </div>
            <p className="text-[11px] font-mono text-slate-600 bg-slate-100/80 p-2.5 rounded-xl break-all">
              {formatFingerprint(partnerFingerprint) || 'No key loaded'}
            </p>
            <button
              onClick={handleCopyFingerprint}
              className="w-full flex items-center justify-center gap-2 py-1.5 text-xs font-medium text-slate-600 hover:text-blue-600 transition-colors"
            >
              {copiedFingerprint ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copy Fingerprint
                </>
              )}
            </button>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2 mt-auto">
            <button className="w-full flex items-center gap-3 p-3 rounded-2xl glass-input text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors">
              <BellOff className="w-4 h-4 text-slate-500" /> Mute Notifications
            </button>
            <button className="w-full flex items-center gap-3 p-3 rounded-2xl glass-input text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors">
              <UserX className="w-4 h-4 text-slate-500" /> Block User
            </button>
            <button className="w-full flex items-center gap-3 p-3 rounded-2xl glass-input text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors">
              <Trash2 className="w-4 h-4 text-red-500" /> Clear Chat History
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
