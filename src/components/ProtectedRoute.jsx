import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ user, userProfile, loading, children }) {
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F8FC]">
        <div className="glass-card rounded-3xl p-8 flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Securing session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If email is not verified in Firebase Auth or Firestore profile, redirect to verify-email
  const isVerified = user.emailVerified || userProfile?.emailVerified || userProfile?.status === 'active';
  if (!isVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  return children;
}
