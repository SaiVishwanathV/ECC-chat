import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, MessageSquare, Settings } from 'lucide-react';
import { getAvatar } from '../utils/getAvatar';

export default function Navbar({ currentUserProfile }) {
  const location = useLocation();

  const navItems = [
    { name: 'Chats', path: '/chats', icon: MessageSquare },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/chats" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                SChat
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-blue-100 text-blue-700 rounded-full border border-blue-200">
                ECC E2EE
              </span>
            </div>
          </div>
        </Link>

        {/* Center Nav Links */}
        <nav className="flex items-center gap-1 bg-slate-200/50 p-1 rounded-full border border-white/60 shadow-inner">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile Avatar */}
        {currentUserProfile && (
          <Link to="/settings" className="flex items-center gap-3 group">
            <div className="relative">
              <img
                src={getAvatar(currentUserProfile.avatar || currentUserProfile.photoURL)}
                alt={currentUserProfile.displayName}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-white/80 group-hover:ring-blue-500 transition-all duration-200"
              />
            </div>
          </Link>
        )}
      </div>
    </header>
  );
}
