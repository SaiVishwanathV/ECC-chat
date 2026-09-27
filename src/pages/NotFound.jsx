import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import GlassCard from '../components/GlassCard';

export default function NotFound() {
  return (
    <div className="min-h-screen w-screen bg-[#F6F8FC] flex items-center justify-center p-4 relative selection:bg-blue-500/20">
      <GlassCard className="w-full max-w-md py-10 px-8 text-center space-y-6 shadow-2xl">
        <div className="w-20 h-20 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner border border-blue-200">
          <ShieldAlert className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold text-slate-900">404</h1>
          <h2 className="text-lg font-bold text-slate-800">Page Not Found</h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            The page you are looking for does not exist or has been moved.
          </p>
        </div>

        <Link
          to="/chats"
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-blue-600 text-white font-semibold text-xs shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Chats
        </Link>
      </GlassCard>
    </div>
  );
}
