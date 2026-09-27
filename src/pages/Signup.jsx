import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  AtSign,
  Mail,
  Lock,
  ShieldCheck,
  Loader2,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import InputField from '../components/InputField';
import AvatarPicker from '../components/AvatarPicker';
import { registerWithEmail, signInWithGoogle, logoutUser, deleteUserAccount } from '../services/auth';
import { syncUserProfile, checkUsernameExists, deleteUserData } from '../services/firestore';
import { createAndSendOTP } from '../services/otp';

export default function Signup() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Predefined Avatar Selection (Default avatar01)
  const [selectedAvatar, setSelectedAvatar] = useState('avatar01');

  const [usernameError, setUsernameError] = useState('');
  const [usernameSuccess, setUsernameSuccess] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUsernameChange = async (e) => {
    const val = e.target.value;
    setUsername(val);
    setUsernameSuccess(false);

    if (!val) {
      setUsernameError('');
      return;
    }

    const clean = val.trim();
    if (clean.length < 4 || clean.length > 20) {
      setUsernameError('Username must be 4 to 20 characters.');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(clean)) {
      setUsernameError('Letters, numbers, and underscores only.');
      return;
    }

    setCheckingUsername(true);
    try {
      const exists = await checkUsernameExists(clean);
      if (exists) {
        setUsernameError('Username already taken.');
        setUsernameSuccess(false);
      } else {
        setUsernameError('');
        setUsernameSuccess(true);
      }
    } catch {
      setUsernameError('');
    } finally {
      setCheckingUsername(false);
    }
  };

  const validateForm = () => {
    if (!fullName.trim()) return 'Full Name is required.';
    if (!username.trim() || username.trim().length < 4 || username.trim().length > 20) {
      return 'Username must be 4 to 20 characters long.';
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      return 'Username can only contain letters, numbers, and underscores.';
    }
    if (usernameError) return usernameError;
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) return 'Please enter a valid email address.';
    if (!password || password.length < 6) return 'Password must be at least 6 characters long.';
    if (password !== confirmPassword) return 'Passwords do not match.';
    if (!selectedAvatar) return 'Please select an avatar.';
    return null;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    let createdUser = null;
    try {
      // Re-check username uniqueness
      const exists = await checkUsernameExists(username.trim());
      if (exists) {
        setError('Username already taken.');
        setUsernameError('Username already taken.');
        setLoading(false);
        return;
      }

      // 1. Create Firebase Auth account
      createdUser = await registerWithEmail(email, password, fullName);

      // 2. Create Firestore user document with selected predefined avatar
      await syncUserProfile(createdUser, {
        displayName: fullName,
        username: username.trim().toLowerCase(),
        avatar: selectedAvatar,
        status: 'pending_verification',
        emailVerified: false,
        privateKeyStored: true,
      });

      // 3. Generate & Store SHA-256 OTP Hash in Firestore `email_otps` & Send via EmailJS
      try {
        await createAndSendOTP({
          uid: createdUser.uid,
          email: email.trim(),
          recipientName: fullName,
        });
      } catch (otpError) {
        // Rollback created user data and auth user if EmailJS fails
        await deleteUserData(createdUser.uid).catch(() => {});
        await deleteUserAccount().catch(() => {});
        setError(`Email service unavailable: ${otpError.message || 'Failed to send OTP email.'}`);
        setLoading(false);
        return;
      }

      // Store pending verification details in sessionStorage for VerifyEmail page
      sessionStorage.setItem(
        'schat_pending_verify',
        JSON.stringify({
          uid: createdUser.uid,
          email: email.trim(),
          name: fullName,
        })
      );

      // 4. Sign user out until OTP verification succeeds
      await logoutUser();

      // 5. Navigate to /verify-email
      navigate('/verify-email');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('This email address is already in use.');
      } else {
        setError(err.message || 'Failed to create account.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError('');
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      await syncUserProfile(user, {
        status: 'active',
        emailVerified: true,
        avatar: selectedAvatar || 'avatar01',
      });
      navigate('/chats');
    } catch (err) {
      setError(err.message || 'Google sign-up failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen overflow-y-auto bg-[#F6F8FC] flex items-center justify-center p-4 relative selection:bg-blue-500/20">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <GlassCard className="w-full max-w-md py-8 px-6 sm:px-8 space-y-5 relative z-10 shadow-2xl my-6">
        {/* Header */}
        <div className="text-center space-y-1.5">
          <Link to="/" className="inline-flex items-center gap-2 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </Link>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Create your SChat Account
          </h2>
          <p className="text-xs text-slate-500">
            ECC P-256 E2E Encrypted Messaging System
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-red-50/90 border border-red-200 text-red-600 text-xs font-medium animate-fade-in">
            {error}
          </div>
        )}

        {/* Google Signup Button */}
        <button
          type="button"
          onClick={handleGoogleSignup}
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

        {/* Signup Form */}
        <form onSubmit={handleSignup} className="space-y-3.5">
          <InputField
            id="fullName"
            label="Full Name"
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            icon={User}
            required
          />

          <InputField
            id="username"
            label="Username"
            placeholder="johndoe"
            value={username}
            onChange={handleUsernameChange}
            icon={AtSign}
            error={usernameError}
            required
            rightElement={
              checkingUsername ? (
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              ) : usernameSuccess ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              ) : null
            }
          />

          <InputField
            id="email"
            type="email"
            label="Email Address"
            placeholder="name@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={Mail}
            required
          />

          <InputField
            id="password"
            type="password"
            label="Password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={Lock}
            required
          />

          <InputField
            id="confirmPassword"
            type="password"
            label="Confirm Password"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            icon={Lock}
            required
          />

          {/* Avatar Picker Component */}
          <AvatarPicker
            selectedAvatar={selectedAvatar}
            onSelectAvatar={(id) => setSelectedAvatar(id)}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition-all duration-200 disabled:opacity-60 pt-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Create Account
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-1">
          <p className="text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-blue-600 hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </GlassCard>
    </div>
  );
}
