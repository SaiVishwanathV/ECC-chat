import { motion } from 'framer-motion';
import { Check, CheckCheck, Lock, FileText, Download } from 'lucide-react';
import { formatMessageTime } from '../utils/date';
import { getAvatar } from '../utils/getAvatar';

export default function MessageBubble({ message, isOutgoing, senderProfile }) {
  const isImage = message.attachmentType?.startsWith('image/');

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className={`flex items-end gap-2.5 my-2 max-w-[85%] sm:max-w-[75%] ${
        isOutgoing ? 'ml-auto flex-row-reverse' : 'mr-auto flex-row'
      }`}
    >
      {/* Avatar for incoming messages */}
      {!isOutgoing && (
        <img
          src={getAvatar(senderProfile?.avatar || senderProfile?.photoURL)}
          alt="Sender avatar"
          className="w-7 h-7 rounded-full object-cover mb-1 flex-shrink-0 shadow-sm"
        />
      )}

      {/* Bubble container */}
      <div
        className={`relative px-4 py-3 rounded-[24px] text-sm font-normal transition-all ${
          isOutgoing
            ? 'glass-bubble-outgoing rounded-br-md text-white'
            : 'glass-bubble-incoming rounded-bl-md text-slate-800'
        }`}
      >
        {/* Attachment preview if present */}
        {message.attachmentUrl && (
          <div className="mb-2 overflow-hidden rounded-2xl border border-white/20">
            {isImage ? (
              <a href={message.attachmentUrl} target="_blank" rel="noopener noreferrer">
                <img
                  src={message.attachmentUrl}
                  alt={message.attachmentName || 'Attachment'}
                  className="max-h-60 w-full object-cover hover:opacity-95 transition-opacity"
                />
              </a>
            ) : (
              <a
                href={message.attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                download={message.attachmentName}
                className={`flex items-center gap-3 p-3 text-xs font-medium rounded-xl transition-colors ${
                  isOutgoing
                    ? 'bg-white/15 hover:bg-white/25 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 truncate">
                  <p className="font-semibold truncate">{message.attachmentName || 'Download File'}</p>
                  <p className="text-[10px] opacity-75">{message.attachmentType || 'File'}</p>
                </div>
                <Download className="w-4 h-4 opacity-80" />
              </a>
            )}
          </div>
        )}

        {/* Text Content */}
        {message.decryptedText && (
          <p className="whitespace-pre-wrap break-words leading-relaxed">
            {message.decryptedText}
          </p>
        )}

        {/* Meta Info: Timestamp, Lock & Read Receipts */}
        <div
          className={`flex items-center justify-end gap-1.5 mt-1.5 text-[10px] select-none ${
            isOutgoing ? 'text-blue-100/90' : 'text-slate-400'
          }`}
        >
          <Lock className="w-2.5 h-2.5 opacity-70" title="End-to-End Encrypted" />
          <span>{formatMessageTime(message.timestamp)}</span>
          {isOutgoing && (
            <span className="ml-0.5">
              {message.read ? (
                <CheckCheck className="w-3.5 h-3.5 text-blue-200" title="Seen" />
              ) : (
                <Check className="w-3.5 h-3.5 text-white/80" title="Sent" />
              )}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
