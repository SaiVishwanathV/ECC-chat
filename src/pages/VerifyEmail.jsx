import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Mail, ArrowLeft, RefreshCw, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import { maskEmail, verifyFirestoreOTP, createAndSendOTP } from '../services/otp';
import { auth } from '../services/firebase';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [setupError, setSetupError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const [shake, setShake] = useState(false);

  const inputRefs = useRef([]);

  // Retrieve target email & UID from sessionStorage pending state or auth currentUser
  const storedPending = JSON.parse(sessionStorage.getItem('schat_pending_verify') || '{}');
  const targetUid = storedPending.uid || auth.currentUser?.uid;
  const targetEmail = storedPending.email || auth.currentUser?.email || '';
  const targetName = storedPending.name || 'User';

  // 60-second countdown timer
  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Handle single digit input change
  const handleChange = (index, value) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-advance to next input box
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle keyboard navigation & backspace
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle paste 6-digit string
  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasted)) {
      const digits = pasted.split('');
      setOtp(digits);
      inputRefs.current[5]?.focus();
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleVerify = async (e) => {
    e?.preventDefault();
    setError('');
    setSuccess('');

    if (!targetUid) {
      setError('Missing session details. Please sign up or log in again.');
      return;
    }

    const enteredCode = otp.join('');
    if (enteredCode.length !== 6) {
      setError('Please enter all 6 digits of the OTP code.');
      triggerShake();
      return;
    }

    setLoading(true);
    try {
      const result = await verifyFirestoreOTP(targetUid, enteredCode);
      if (!result.success) {
        setError(result.error);
        triggerShake();
        setLoading(false);
        return;
      }

      setSuccess('OTP verified successfully!');
      sessionStorage.removeItem('schat_pending_verify');

      setTimeout(() => {
        navigate('/login', {
          state: { message: 'Email verified successfully! Please sign in.' },
        });
      }, 1000);
    } catch {
      setError('Verification error. Please try again.');
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0 || resending || !targetUid) return;
    setResending(true);
    setError('');
    setSuccess('');
    setSetupError('');

    try {
      const result = await createAndSendOTP({
        uid: targetUid,
        email: targetEmail,
        recipientName: targetName,
      });

      if (result.emailJSMissing) {
        setSetupError('EmailJS credentials missing in .env.local (VITE_EMAILJS_SERVICE_ID).');
      }

      setSuccess('A new 6-digit OTP code has been dispatched to your email.');
      setTimer(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch {
      setError('Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen w-screen overflow-hidden bg-[#F6F8FC] flex items-center justify-center p-4 relative selection:bg-blue-500/20">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <GlassCard className="w-full max-w-md py-9 px-6 sm:px-8 text-center space-y-6 relative z-10 shadow-2xl">
        {/* Verification Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="w-16 h-16 rounded-3xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20"
        >
          <ShieldCheck className="w-8 h-8" />
        </motion.div>

        <div className="space-y-1.5">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Verify your email</h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Enter the 6-digit code sent to{' '}
            <span className="font-semibold text-slate-800">{maskEmail(targetEmail)}</span>
          </p>
        </div>

        {/* Setup Warning if EmailJS missing */}
        {setupError && (
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{setupError}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium animate-fade-in">
            {error}
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center justify-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4" /> {success}
          </div>
        )}

        {/* 6-Digit OTP Box Grid */}
        <form onSubmit={handleVerify} className="space-y-6">
          <motion.div
            animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="flex items-center justify-center gap-2 sm:gap-2.5"
            onPaste={handlePaste}
          >
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold text-slate-800 glass-input rounded-2xl outline-none transition-all duration-200 focus:ring-4 focus:ring-blue-500/20"
                autoFocus={index === 0}
              />
            ))}
          </motion.div>

          <button
            type="submit"
            disabled={loading || otp.join('').length !== 6}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-full bg-blue-600 text-white font-semibold text-xs shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all duration-200 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify Code'}
          </button>
        </form>

        {/* Resend & Timer */}
        <div className="space-y-3 pt-1 border-t border-slate-200/60">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              {timer > 0 ? (
                <>Resend available in <span className="font-mono font-semibold text-slate-700">00:{timer < 10 ? `0${timer}` : timer}</span></>
              ) : (
                'Code expired?'
              )}
            </span>
            <button
              onClick={handleResend}
              disabled={timer > 0 || resending}
              className="font-semibold text-blue-600 hover:underline disabled:opacity-40 disabled:no-underline flex items-center gap-1"
            >
              {resending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              Resend Code
            </button>
          </div>

          <button
            onClick={() => navigate('/login')}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-full text-slate-600 hover:text-slate-900 text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </button>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <Mail className="w-3.5 h-3.5" />
          <span>SChat Security Team</span>
        </div>
      </GlassCard>
    </div>
  );
}
