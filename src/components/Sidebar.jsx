import { useState } from 'react';
import { Search, Plus, UserPlus, X, Shield } from 'lucide-react';
import { formatMessageTime } from '../utils/date';
import { searchUsers } from '../services/firestore';
import { getAvatar } from '../utils/getAvatar';

export default function Sidebar({
  conversations,
  activeConvId,
  onSelectConversation,
  currentUserId,
  onStartNewChat,
  usersMap,
}) {
  const [filterText, setFilterText] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Filter existing conversations locally by partner display name or username
  const filteredConversations = conversations.filter((conv) => {
    const partnerId = conv.participants.find((id) => id !== currentUserId);
    const partner = usersMap[partnerId];
    if (!filterText.trim()) return true;
    if (!partner) return true;
    const name = (partner.displayName || '').toLowerCase();
    const user = (partner.username || '').toLowerCase();
    const q = filterText.toLowerCase();
    return name.includes(q) || user.includes(q);
  });

  const handleSearchUsers = async (e) => {
    const term = e.target.value;
    setUserSearchQuery(term);
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const results = await searchUsers(term, currentUserId);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectNewUser = (targetUserId) => {
    setShowSearchModal(false);
    setUserSearchQuery('');
    setSearchResults([]);
    onStartNewChat(targetUserId);
  };

  return (
    <aside className="w-full md:w-80 lg:w-96 flex flex-col h-full border-r border-white/60 glass-panel">
      {/* Header & Controls */}
      <div className="p-4 border-b border-white/50 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            Messages
          </h2>
          <button
            onClick={() => setShowSearchModal(true)}
            className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200 shadow-md shadow-blue-500/20 active:scale-95"
            title="Start New Chat"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full glass-input rounded-2xl py-2 pl-10 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mx-auto">
              <Shield className="w-6 h-6" />
            </div>
            <p className="text-xs font-medium text-slate-500">
              No conversations found. Click + to start a new encrypted chat.
            </p>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const partnerId = conv.participants.find((id) => id !== currentUserId);
            const partner = usersMap[partnerId] || {};
            const isActive = conv.id === activeConvId;

            return (
              <button
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`w-full flex items-center gap-3.5 p-3 rounded-2xl transition-all duration-200 text-left ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'hover:bg-white/70 text-slate-800'
                }`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <img
                    src={getAvatar(partner.avatar || partner.photoURL)}
                    alt={partner.displayName || 'User'}
                    className="w-12 h-12 rounded-full object-cover shadow-sm ring-2 ring-white/80"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-sm font-semibold truncate ${isActive ? 'text-white' : 'text-slate-900'}`}>
                      {partner.displayName || 'Loading...'}
                    </h3>
                    <span className={`text-[10px] font-medium ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                      {formatMessageTime(conv.lastMessageTime)}
                    </span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* New Chat Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md glass-card rounded-[32px] p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                Start New Chat
              </h3>
              <button
                onClick={() => setShowSearchModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search users by name, username or email..."
                value={userSearchQuery}
                onChange={handleSearchUsers}
                className="w-full glass-input rounded-[20px] py-2.5 pl-10 pr-4 text-sm outline-none"
                autoFocus
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 py-1">
              {isSearching ? (
                <p className="text-xs text-center text-slate-400 py-4">Searching users...</p>
              ) : searchResults.length > 0 ? (
                searchResults.map((user) => (
                  <button
                    key={user.uid}
                    onClick={() => handleSelectNewUser(user.uid)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-blue-50/80 text-left transition-colors"
                  >
                    <img
                      src={getAvatar(user.avatar || user.photoURL)}
                      alt={user.displayName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{user.displayName}</p>
                      <p className="text-xs text-slate-400 truncate">@{user.username || 'user'}</p>
                    </div>
                  </button>
                ))
              ) : userSearchQuery.trim() ? (
                <p className="text-xs text-center text-slate-400 py-4">No users found.</p>
              ) : (
                <p className="text-xs text-center text-slate-400 py-4">Type a username or email to search</p>
              )}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
