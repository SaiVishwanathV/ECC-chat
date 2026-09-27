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
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/chats" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200 shrink-0">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base sm:text-lg tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  SChat
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold bg-blue-100 text-blue-700 rounded-full border border-blue-200">
                  ECC E2EE
                </span>
              </div>
            </div>
          </Link>

          {/* Center Nav Links for Tablet & Desktop */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-200/50 p-1 rounded-full border border-white/60 shadow-inner">
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
            <Link to="/settings" className="flex items-center gap-3 group shrink-0">
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

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-lg border-t border-slate-200/80 px-6 py-2 flex items-center justify-around shadow-lg pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 py-1 px-4 rounded-2xl transition-all duration-200 ${
                isActive
                  ? 'text-blue-600 font-bold scale-105'
                  : 'text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[11px]">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
