import { useState } from 'react';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import { Mail, Lock, ShieldCheck, Loader2, ArrowRight, X } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import InputField from '../components/InputField';
import { logoutUser, loginWithEmail, signInWithGoogle, resetPassword } from '../services/auth';
import { syncUserProfile, findUserByUsername, getUserProfile } from '../services/firestore';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showUnverifiedBtn, setShowUnverifiedBtn] = useState(false);
  const [successMessage] = useState(location.state?.message || '');
  const [loading, setLoading] = useState(false);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const mapAuthError = (err) => {
    const code = err.code || '';
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
      return 'Invalid username/email or password.';
    } else if (code === 'auth/invalid-email') {
      return 'Invalid email address or format.';
    } else if (code === 'auth/popup-closed-by-user') {
      return 'Google sign-in popup was cancelled.';
    } else if (code === 'auth/network-request-failed') {
      return 'Network unavailable. Please check your internet connection.';
    }
    return err.message || 'Authentication failed. Please try again.';
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setShowUnverifiedBtn(false);

    const inputVal = loginInput.trim();
    if (!inputVal || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      let targetEmail = inputVal;

      if (!inputVal.includes('@')) {
        const userDoc = await findUserByUsername(inputVal);
        if (!userDoc || !userDoc.email) {
          setError('Invalid username/email or password.');
          setLoading(false);
          return;
        }
        targetEmail = userDoc.email;
      }

      const user = await loginWithEmail(targetEmail, password);
      const userProfile = await getUserProfile(user.uid);

      const isVerified = userProfile?.emailVerified || userProfile?.status === 'active' || user.emailVerified;

      if (!isVerified) {
        sessionStorage.setItem(
          'schat_pending_verify',
          JSON.stringify({
            uid: user.uid,
            email: user.email,
            name: user.displayName || user.email.split('@')[0],
          })
        );
        await logoutUser();
        setError('Verify your email before signing in.');
        setShowUnverifiedBtn(true);
        setLoading(false);
        return;
      }

      await syncUserProfile(user, { emailVerified: true, status: 'active' });
      navigate('/chats');
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setShowUnverifiedBtn(false);
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      await syncUserProfile(user, { status: 'active', emailVerified: true });
      navigate('/chats');
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetEmail = async (e) => {
    e.preventDefault();
    setForgotMessage('');
    if (!forgotEmail.trim()) return;

    setForgotLoading(true);
    try {
      await resetPassword(forgotEmail);
      setForgotMessage('Password reset link sent! Check your inbox.');
    } catch (err) {
      setForgotMessage(mapAuthError(err));
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen overflow-y-auto bg-[#F6F8FC] flex items-center justify-center p-4 relative selection:bg-blue-500/20">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <GlassCard className="w-full max-w-md py-8 px-6 sm:px-8 space-y-6 relative z-10 shadow-2xl">
        {/* Header */}
        <div className="text-center space-y-2">
          <RouterLink to="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </RouterLink>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Welcome back to SChat
          </h2>
          <p className="text-xs text-slate-500">
            Sign in to access your E2E encrypted messages
          </p>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-emerald-700 text-xs font-medium animate-fade-in">
            {successMessage}
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-red-50/90 border border-red-200 text-red-600 text-xs font-medium animate-fade-in space-y-2">
            <p>{error}</p>
            {showUnverifiedBtn && (
              <button
                type="button"
                onClick={() => navigate('/verify-email')}
                className="w-full py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-[11px] transition-colors shadow-sm"
              >
                Enter Verification Code Again
              </button>
            )}
          </div>
        )}

        {/* Google Auth Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs transition-all duration-200 shadow-sm disabled:opacity-60"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Continue with Google
        </button>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-200/80 w-full"></div>
          <span className="bg-[#F6F8FC] px-3 text-[10px] font-bold tracking-wider uppercase text-slate-400 absolute">
            or credentials
          </span>
        </div>

        {/* Email/Username Login Form */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <InputField
            id="loginInput"
            type="text"
            label="Email or Username"
            placeholder="Email or Username"
            value={loginInput}
            onChange={(e) => setLoginInput(e.target.value)}
            icon={Mail}
            required
          />

          <InputField
            id="password"
            type="password"
            label="Password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={Lock}
            required
            rightElement={
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Forgot?
              </button>
            }
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition-all duration-200 disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Sign In
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Link to Signup */}
        <div className="text-center pt-2">
          <p className="text-xs text-slate-500">
            Don’t have an account?{' '}
            <RouterLink to="/signup" className="font-semibold text-blue-600 hover:underline">
              Create Account
            </RouterLink>
          </p>
        </div>
      </GlassCard>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm glass-card rounded-[32px] p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
              <h3 className="text-sm font-bold text-slate-800">Reset Password</h3>
              <button
                onClick={() => setShowForgotModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {forgotMessage && (
              <p className="text-xs font-medium text-blue-600 bg-blue-50 p-2.5 rounded-xl">
                {forgotMessage}
              </p>
            )}

            <form onSubmit={handleSendResetEmail} className="space-y-4">
              <InputField
                id="forgotEmail"
                type="email"
                label="Email Address"
                placeholder="name@domain.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                icon={Mail}
                required
              />

              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full py-3 rounded-full bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20"
              >
                {forgotLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Send Reset Link'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
