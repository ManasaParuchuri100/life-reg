import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, 
  Cloud, 
  Shield, 
  Compass, 
  Star, 
  LogIn, 
  UserPlus, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { PixelCharacter } from './PixelCharacter';
import { INITIAL_PLAYER_STATS } from '../utils/storage';
import { sounds } from '../utils/sound';

type AuthMode = 'signin' | 'signup';

export const SignInPage: React.FC = () => {
  const { 
    signIn, 
    signInWithEmailPass, 
    signUpWithEmailPass, 
    signInAsGuest, 
    enterAsLocalGuest,
    loading, 
    error, 
    clearError 
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConsoleHelp, setShowConsoleHelp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playClick();
    if (mode === 'signin') {
      await signInWithEmailPass(email, password);
    } else {
      await signUpWithEmailPass(email, password);
    }
  };

  const handleGoogleSignIn = () => {
    sounds.playClick();
    signIn();
  };

  const handleGuestEnter = () => {
    sounds.playClick();
    signInAsGuest();
  };

  return (
    <div className="min-h-screen w-full bg-[#0a0f1d] text-slate-100 flex flex-col items-center justify-center p-3 sm:p-6 relative overflow-hidden font-sans">
      {/* Background ambient lighting effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-10 right-10 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Grid texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
          backgroundSize: '32px 32px'
        }}
      />

      {/* Main Card Container */}
      <div className="relative z-10 w-full max-w-md bg-[#131b2e]/95 border-2 border-slate-700/80 rounded-2xl p-5 sm:p-7 shadow-2xl backdrop-blur-xl flex flex-col items-center text-center pixel-panel">
        
        {/* Top Realm Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono mb-4">
          <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-400" />
          <span>FIREBASE CLOUD REALM · LIFE RPG</span>
        </div>

        {/* Pixel Character Showcase Avatar */}
        <div className="relative mb-4 p-2.5 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 shadow-inner">
          <div className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
            <PixelCharacter
              stats={INITIAL_PLAYER_STATS}
              direction="down"
              isMoving={false}
              scale={2.0}
            />
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-pixel font-bold uppercase tracking-wider shadow">
            {mode === 'signin' ? 'ADVENTURER' : 'RECRUIT'}
          </div>
        </div>

        {/* Title & Tagline */}
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-pixel mb-1 text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500">
          HEARTHBOUND
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 mb-5 max-w-xs font-medium leading-relaxed">
          Sign in or create an account to save your habits and voxel realm progress to Firebase.
        </p>

        {/* Tab Selection: Sign In vs Create Account */}
        <div className="w-full flex items-center bg-[#0d1424] p-1 rounded-xl border border-slate-700/80 mb-4">
          <button
            id="auth-tab-signin"
            type="button"
            onClick={() => {
              sounds.playClick();
              clearError();
              setMode('signin');
            }}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-pixel font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'signin'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
          <button
            id="auth-tab-signup"
            type="button"
            onClick={() => {
              sounds.playClick();
              clearError();
              setMode('signup');
            }}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-pixel font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'signup'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create Account</span>
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="w-full mb-4 p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl flex items-start gap-2.5 text-left">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs text-rose-200 leading-normal">
              {error}
            </div>
            <button 
              onClick={clearError}
              className="text-rose-400 hover:text-rose-200 text-xs font-bold px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-3 mb-4 text-left">
          {/* Email Input */}
          <div>
            <label className="block text-[11px] font-pixel text-slate-300 uppercase tracking-wider mb-1">
              Adventurer Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="auth-email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hero@example.com"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#0a1120] border border-slate-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-sm text-slate-100 placeholder-slate-500 transition-colors font-sans outline-none"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-pixel text-slate-300 uppercase tracking-wider">
                Password
              </label>
              {mode === 'signup' && (
                <span className="text-[10px] text-slate-400 font-sans">
                  Min 6 characters
                </span>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="auth-password-input"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[#0a1120] border border-slate-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-sm text-slate-100 placeholder-slate-500 transition-colors font-sans outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Action Button */}
          <button
            id="auth-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-amber-500/20 active:scale-[0.99] cursor-pointer pixel-btn"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span className="font-pixel">CONNECTING TO REALM...</span>
              </>
            ) : (
              <>
                {mode === 'signin' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                <span className="font-pixel tracking-wide uppercase">
                  {mode === 'signin' ? 'Enter Realm with Email' : 'Create Hero & Enter'}
                </span>
              </>
            )}
          </button>
        </form>

        {/* Divider: OR */}
        <div className="w-full flex items-center gap-3 my-3">
          <div className="flex-1 h-px bg-slate-700/60" />
          <span className="text-[10px] uppercase font-pixel tracking-wider text-slate-500">OR</span>
          <div className="flex-1 h-px bg-slate-700/60" />
        </div>

        {/* Alternative Sign-In Options */}
        <div className="w-full space-y-2">
          {/* Google Sign-in Button */}
          <button
            id="firebase-google-signin-btn"
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-[#0d1526] hover:bg-[#16223b] border border-slate-700 hover:border-slate-600 text-slate-200 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2.5 transition-all shadow cursor-pointer active:scale-[0.99]"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#ea4335"
                d="M12 5c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
              <path
                fill="#4285f4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#fbbc05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#34a853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
            </svg>
            <span className="font-pixel">Sign in with Google</span>
          </button>

          {/* Quick Enter as Guest */}
          <button
            id="auth-guest-enter-btn"
            type="button"
            onClick={handleGuestEnter}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/60 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99]"
            title="Instant entry without credentials"
          >
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-pixel text-[11px] uppercase tracking-wider">
              Quick Enter as Guest (Instant Play)
            </span>
          </button>
        </div>

        {/* Collapsible Firebase Console Note */}
        <div className="w-full mt-4 pt-3 border-t border-slate-800/80 text-left">
          <button
            type="button"
            onClick={() => setShowConsoleHelp(!showConsoleHelp)}
            className="w-full flex items-center justify-between text-[11px] text-slate-400 hover:text-amber-300 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <HelpCircle className="w-3 h-3 text-amber-400" />
              <span>Firebase Email/Password Setup Note</span>
            </span>
            {showConsoleHelp ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showConsoleHelp && (
            <div className="mt-2 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 space-y-1 leading-relaxed">
              <p className="text-slate-300 font-medium">To enable Email & Password authentication:</p>
              <ol className="list-decimal pl-4 space-y-0.5 text-slate-400">
                <li>Go to the <strong className="text-amber-300">Firebase Console</strong>.</li>
                <li>Navigate to <strong className="text-slate-300">Build &gt; Authentication &gt; Sign-in method</strong>.</li>
                <li>Click <strong className="text-slate-300">Email/Password</strong> and toggle <strong className="text-emerald-400">Enable</strong>, then save.</li>
              </ol>
            </div>
          )}
        </div>

        {/* Feature Pillars */}
        <div className="w-full grid grid-cols-3 gap-2 pt-3 mt-3 border-t border-slate-800/80 text-left">
          <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800 flex flex-col items-center text-center">
            <Cloud className="w-3.5 h-3.5 text-blue-400 mb-1" />
            <span className="text-[10px] font-bold text-slate-200">Firebase Cloud</span>
            <span className="text-[9px] text-slate-400">Persistent Save</span>
          </div>

          <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800 flex flex-col items-center text-center">
            <Star className="w-3.5 h-3.5 text-amber-400 mb-1" />
            <span className="text-[10px] font-bold text-slate-200">RPG Attributes</span>
            <span className="text-[9px] text-slate-400">XP & Levels</span>
          </div>

          <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800 flex flex-col items-center text-center">
            <Compass className="w-3.5 h-3.5 text-emerald-400 mb-1" />
            <span className="text-[10px] font-bold text-slate-200">Living World</span>
            <span className="text-[9px] text-slate-400">3D Voxel Stage</span>
          </div>
        </div>

      </div>

      {/* Footer Info */}
      <footer className="relative z-10 mt-4 text-center text-[11px] text-slate-500 flex items-center gap-1.5">
        <Shield className="w-3 h-3 text-slate-400" />
        <span>Secured with Firebase Authentication & Firestore Cloud</span>
      </footer>
    </div>
  );
};
