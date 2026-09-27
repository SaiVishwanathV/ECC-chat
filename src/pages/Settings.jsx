import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  ShieldCheck,
  Key,
  Bell,
  Lock,
  Eye,
  EyeOff,
  LogOut,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Shield,
  Loader2,
  Terminal,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import GlassCard from '../components/GlassCard';
import InputField from '../components/InputField';
import AvatarPicker from '../components/AvatarPicker';
import { getUserProfile, updateUserProfile, deleteUserData } from '../services/firestore';
import { getOrGenerateUserKeyPair, generateFingerprint, rotateUserKeyPair } from '../services/crypto';
import { logoutUser, deleteUserAccount } from '../services/auth';
import { formatFingerprint } from '../utils/fingerprint';
import { getAvatar } from '../utils/getAvatar';

export default function Settings({ user }) {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [keyPair, setKeyPair] = useState(null);
  const [fingerprint, setFingerprint] = useState('');
  const [copied, setCopied] = useState(false);

  // Developer Mode states
  const [devMode, setDevMode] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [copiedPubKey, setCopiedPubKey] = useState(false);
  const [copiedPrivKey, setCopiedPrivKey] = useState(false);
  const [copiedDevFp, setCopiedDevFp] = useState(false);

  // Form states
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Key rotation state
  const [isRotating, setIsRotating] = useState(false);
  const [rotateSuccess, setRotateSuccess] = useState('');
  const [rotateError, setRotateError] = useState('');

  // Toggles
  const [notifications, setNotifications] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [allowSearch, setAllowSearch] = useState(true);

  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (!user) return;
    getUserProfile(user.uid).then((prof) => {
      if (prof) {
        setProfile(prof);
        setDisplayName(prof.displayName || '');
        setUsername(prof.username || '');
      }
    });

    getOrGenerateUserKeyPair(user.uid).then((keys) => {
      setKeyPair(keys);
      if (keys.publicKeyHex) {
        generateFingerprint(keys.publicKeyHex).then((fp) => setFingerprint(fp));
      }
    });
  }, [user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!user || isSaving) return;
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await updateUserProfile(user.uid, {
        displayName: displayName.trim(),
        username: username.trim().toLowerCase(),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      // ignore
    } finally {
      setIsSaving(false);
    }
  };

  const handleRotateKeys = async () => {
    if (!user || isRotating) return;
    setIsRotating(true);
    setRotateSuccess('');
    setRotateError('');

    try {
      const result = await rotateUserKeyPair(user.uid);
      setKeyPair({ publicKey: result.publicKey, privateKey: result.privateKey });
      setFingerprint(result.fingerprint);
      setProfile((prev) => ({
        ...prev,
        publicKey: result.publicKey,
        keyFingerprint: result.fingerprint,
        keyUpdatedAt: new Date(),
      }));
      setRotateSuccess('ECC P-256 key pair rotated successfully! New public key fingerprint generated.');
      setTimeout(() => setRotateSuccess(''), 4000);
    } catch (err) {
      console.error('Failed to rotate keys:', err);
      setRotateError(err.message || 'Failed to rotate key pair. Please try again.');
      setTimeout(() => setRotateError(''), 4000);
    } finally {
      setIsRotating(false);
    }
  };

  const handleCopyFingerprint = () => {
    if (!fingerprint) return;
    navigator.clipboard.writeText(fingerprint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyPublicKey = () => {
    const pub = keyPair?.publicKey || keyPair?.publicKeyHex;
    if (!pub) return;
    navigator.clipboard.writeText(pub);
    setCopiedPubKey(true);
    setTimeout(() => setCopiedPubKey(false), 2000);
  };

  const handleCopyPrivateKey = () => {
    const priv = keyPair?.privateKey || keyPair?.privateKeyHex;
    if (!priv) return;
    navigator.clipboard.writeText(priv);
    setCopiedPrivKey(true);
    setTimeout(() => setCopiedPrivKey(false), 2000);
  };

  const handleCopyDevFingerprint = () => {
    if (!fingerprint) return;
    navigator.clipboard.writeText(fingerprint);
    setCopiedDevFp(true);
    setTimeout(() => setCopiedDevFp(false), 2000);
  };

  const handleLogout = async () => {
    await logoutUser();
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to permanently delete your SChat account? This cannot be undone.')) {
      try {
        await deleteUserData(user.uid);
        await deleteUserAccount();
        navigate('/');
      } catch {
        alert('Please log in again before deleting your account for security reasons.');
      }
    }
  };

  const handleAvatarChange = async (newAvatarId) => {
    if (!user) return;
    try {
      await updateUserProfile(user.uid, { avatar: newAvatarId });
      setProfile((prev) => ({ ...prev, avatar: newAvatarId }));
    } catch {
      // ignore
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Eye },
    { id: 'security', label: 'Security & Keys', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen w-screen flex flex-col bg-[#F6F8FC] selection:bg-blue-500/20 pb-16 md:pb-0">
      <Navbar currentUserProfile={profile} />

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Settings</h1>
          <p className="text-xs text-slate-500">Manage your profile, security keys, and app preferences</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Navigation Sidebar */}
          <div className="flex flex-row md:flex-col overflow-x-auto gap-2 md:gap-0 pb-2 md:pb-0 md:space-y-1 no-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 px-4 py-2.5 sm:py-3 rounded-2xl text-xs font-semibold transition-all duration-200 text-left shrink-0 whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'glass-panel text-slate-600 hover:text-slate-900 hover:bg-white/80'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content Panel */}
          <div className="md:col-span-3 space-y-6 min-w-0">
            {/* 1. Security & Keys Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <GlassCard className="space-y-5">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-200/60">
                    <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Cryptographic Security Status</h3>
                      <p className="text-xs text-slate-500">End-to-End Encryption Specifications</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Algorithm</span>
                      <p className="text-xs font-bold text-slate-800">ECC (P-256 / secp256r1)</p>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                        <CheckCircle className="w-3 h-3" /> Active
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cipher</span>
                      <p className="text-xs font-bold text-slate-800">AES-256-GCM</p>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                        <CheckCircle className="w-3 h-3" /> Active
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Digest & HKDF</span>
                      <p className="text-xs font-bold text-slate-800">SHA-256 Key Derivation</p>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                        <CheckCircle className="w-3 h-3" /> Active
                      </span>
                    </div>
                  </div>

                  {/* Fingerprint Display */}
                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Public Key SHA-256 Fingerprint
                    </label>
                    <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 font-mono text-xs break-all tracking-wider shadow-inner flex items-center justify-between gap-4">
                      <span>{formatFingerprint(fingerprint) || 'Generating key fingerprint...'}</span>
                      <button
                        onClick={handleCopyFingerprint}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors"
                        title="Copy Fingerprint"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Key Management */}
                  <div className="space-y-3 pt-4 border-t border-slate-200/60">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold text-slate-800">Key Pair Rotation</p>
                        <p className="text-[11px] text-slate-500">
                          Generate a new ECDH keypair to update your public key in Firestore.
                        </p>
                      </div>
                      <button
                        onClick={handleRotateKeys}
                        disabled={isRotating}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-xs font-semibold shadow-sm transition-all"
                      >
                        {isRotating ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3.5 h-3.5" />
                        )}
                        {isRotating ? 'Rotating Keys...' : 'Rotate Key Pair'}
                      </button>
                    </div>

                    {rotateSuccess && (
                      <div className="p-3 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center gap-2 animate-fade-in">
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{rotateSuccess}</span>
                      </div>
                    )}

                    {rotateError && (
                      <div className="p-3 rounded-2xl bg-red-50/90 border border-red-200 text-red-600 text-xs font-medium flex items-center gap-2 animate-fade-in">
                        <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                        <span>{rotateError}</span>
                      </div>
                    )}
                  </div>

                  {/* Developer Mode Card */}
                  <div className="space-y-4 pt-4 border-t border-slate-200/60">
                    <div className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                          <Terminal className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">
                            Developer Mode
                          </p>
                          <p className="text-[11px] text-slate-500">
                            View cryptographic keys for educational demonstration.
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={devMode}
                          onChange={(e) => setDevMode(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>

                    {devMode && (
                      <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-200/80 space-y-4 animate-fade-in">
                        {/* Warning Banner */}
                        <div className="p-3 rounded-xl bg-purple-100/80 border border-purple-200 text-purple-900 text-xs font-medium flex items-center gap-2.5">
                          <AlertCircle className="w-4 h-4 text-purple-600 shrink-0" />
                          <span>Academic Demonstration Only — Production messaging apps never expose private keys.</span>
                        </div>

                        {/* Public Key */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                              Public Key (ECC P-256 SPKI Base64)
                            </label>
                            <button
                              onClick={handleCopyPublicKey}
                              className="flex items-center gap-1 text-[11px] font-semibold text-purple-700 hover:text-purple-900 transition-colors"
                            >
                              {copiedPubKey ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="text-emerald-600">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy Public Key</span>
                                </>
                              )}
                            </button>
                          </div>
                          <div className="p-3 bg-slate-900 text-purple-300 font-mono text-xs rounded-xl break-all max-h-28 overflow-y-auto shadow-inner select-all">
                            {keyPair?.publicKey || keyPair?.publicKeyHex || 'Loading public key...'}
                          </div>
                        </div>

                        {/* Private Key */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                              Private Key (ECC P-256 PKCS8 Base64)
                            </label>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => setShowPrivateKey(!showPrivateKey)}
                                className="flex items-center gap-1 text-[11px] font-semibold text-purple-700 hover:text-purple-900 transition-colors"
                              >
                                {showPrivateKey ? (
                                  <>
                                    <EyeOff className="w-3.5 h-3.5" />
                                    <span>Hide Full</span>
                                  </>
                                ) : (
                                  <>
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Show Full</span>
                                  </>
                                )}
                              </button>
                              <button
                                onClick={handleCopyPrivateKey}
                                className="flex items-center gap-1 text-[11px] font-semibold text-purple-700 hover:text-purple-900 transition-colors"
                              >
                                {copiedPrivKey ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    <span className="text-emerald-600">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Copy Private Key</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                          <div className="p-3 bg-slate-900 text-purple-300 font-mono text-xs rounded-xl break-all max-h-28 overflow-y-auto shadow-inner select-all">
                            {showPrivateKey
                              ? keyPair?.privateKey || keyPair?.privateKeyHex || 'Loading private key...'
                              : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'}
                          </div>
                        </div>

                        {/* Fingerprint */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                              SHA-256 Fingerprint
                            </label>
                            <button
                              onClick={handleCopyDevFingerprint}
                              className="flex items-center gap-1 text-[11px] font-semibold text-purple-700 hover:text-purple-900 transition-colors"
                            >
                              {copiedDevFp ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="text-emerald-600">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy Fingerprint</span>
                                </>
                              )}
                            </button>
                          </div>
                          <div className="p-3 bg-slate-900 text-purple-300 font-mono text-xs rounded-xl break-all shadow-inner select-all">
                            {formatFingerprint(fingerprint) || 'Generating key fingerprint...'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </GlassCard>
              </div>
            )}

            {/* 2. Profile Tab */}
            {activeTab === 'profile' && (
              <GlassCard className="space-y-5">
                <div className="flex items-center gap-4 pb-4 border-b border-slate-200/60">
                  <img
                    src={getAvatar(profile?.avatar || profile?.photoURL)}
                    alt="User avatar"
                    className="w-20 h-20 rounded-full object-cover shadow-md ring-4 ring-white"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900">{profile?.displayName}</h3>
                      {(user?.emailVerified || profile?.emailVerified) && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700 rounded-full">
                          Verified
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">@{profile?.username || 'user'}</p>
                    <p className="text-xs text-slate-400">{user?.email}</p>
                  </div>
                </div>

                <AvatarPicker
                  selectedAvatar={profile?.avatar || 'avatar01'}
                  onSelectAvatar={handleAvatarChange}
                />

                {saveSuccess && (
                  <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-700 text-xs font-semibold">
                    Profile updated successfully!
                  </div>
                )}

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <InputField
                    id="displayName"
                    label="Display Name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    icon={User}
                  />

                  <InputField
                    id="username"
                    label="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    icon={Key}
                  />

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition-all"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                  </button>
                </form>
              </GlassCard>
            )}

            {/* 3. Notifications Tab */}
            {activeTab === 'notifications' && (
              <GlassCard className="space-y-4">
                <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-200/60">
                  Notification Preferences
                </h3>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Message Notifications</p>
                    <p className="text-[11px] text-slate-500">Receive alerts when new messages arrive</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications}
                    onChange={(e) => setNotifications(e.target.checked)}
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between py-2 border-t border-slate-100">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Read Receipts</p>
                    <p className="text-[11px] text-slate-500">Send seen status when reading messages</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={readReceipts}
                    onChange={(e) => setReadReceipts(e.target.checked)}
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                  />
                </div>
              </GlassCard>
            )}

            {/* 4. Privacy Tab */}
            {activeTab === 'privacy' && (
              <GlassCard className="space-y-4">
                <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-200/60">
                  Privacy Settings
                </h3>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Allow Username Search</p>
                    <p className="text-[11px] text-slate-500">Let users find your profile via search</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowSearch}
                    onChange={(e) => setAllowSearch(e.target.checked)}
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                  />
                </div>
              </GlassCard>
            )}

            {/* Danger Zone Card */}
            <GlassCard className="space-y-4 border-red-200 bg-red-50/30">
              <h3 className="text-xs font-bold text-red-600 uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4" /> Account Controls & Danger Zone
              </h3>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <button
                  onClick={handleLogout}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold transition-all shadow-sm"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>

                <button
                  onClick={handleDeleteAccount}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-red-600 text-white hover:bg-red-700 text-xs font-semibold transition-all shadow-md shadow-red-500/20"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Account
                </button>
              </div>
            </GlassCard>
          </div>
        </div>
      </main>
    </div>
  );
}
