import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Lock } from 'lucide-react';
import GlassCard from '../components/GlassCard';

export default function Landing() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#F6F8FC] flex flex-col justify-between relative selection:bg-blue-500/20">
      {/* Subtle blue radial glow background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Navbar */}
      <header className="w-full px-6 py-5 flex items-center justify-between relative z-10">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900">
            SChat
          </span>
        </Link>
      </header>

      {/* Hero Center */}
      <main className="flex-1 flex items-center justify-center px-4 relative z-10">
        <GlassCard className="max-w-2xl w-full text-center space-y-6 py-12 px-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200 shadow-sm mx-auto">
            <Lock className="w-3.5 h-3.5" />
            ECC-Based Secure Messaging
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Secure conversations,<br />
            protected by Elliptic Curve Cryptography.
          </h1>

          {/* Description */}
          <p className="text-sm sm:text-base text-slate-600 max-w-lg mx-auto leading-relaxed">
            Private messaging built with modern cryptography and Firebase.<br />
            Simple, fast, secure communication.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/80 shadow-sm transition-all duration-200"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all duration-200 group"
            >
              Create Account
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </GlassCard>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center relative z-10">
        <p className="text-xs font-medium text-slate-400">© 2027 SChat</p>
      </footer>
    </div>
  );
}
