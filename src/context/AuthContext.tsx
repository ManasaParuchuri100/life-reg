import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { 
  auth, 
  signInWithGoogle, 
  signInWithEmail, 
  signUpWithEmail, 
  signInGuest, 
  signOutUser, 
  initializeUserAccount 
} from '../firebase';
import { PlayerStats, Quest, InventoryItem } from '../types';
import { 
  INITIAL_PLAYER_STATS, 
  INITIAL_QUESTS, 
  INITIAL_INVENTORY,
  loadSavedStats,
  loadSavedQuests,
  loadSavedInventory 
} from '../utils/storage';

interface GuestUser {
  uid: string;
  email: string;
  displayName: string;
  isAnonymous: boolean;
}

interface AuthContextType {
  user: User | GuestUser | null;
  loading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signInWithEmailPass: (email: string, pass: string) => Promise<void>;
  signUpWithEmailPass: (email: string, pass: string) => Promise<void>;
  signInAsGuest: () => Promise<void>;
  enterAsLocalGuest: () => void;
  signOut: () => Promise<void>;
  clearError: () => void;
  userInitialData: {
    stats: PlayerStats | null;
    quests: Quest[];
    inventory: InventoryItem[];
  } | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function formatAuthError(err: any): string {
  const code = err?.code || '';
  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-not-found':
      return 'No hero found with this email. Click "Create Account" below to register!';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please verify your credentials or create an account.';
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please switch to "Sign In" above.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.';
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is not yet enabled in Firebase Console. (Please enable Email/Password in Firebase Console > Authentication > Sign-in method).';
    case 'auth/too-many-requests':
      return 'Access temporarily disabled due to multiple failed attempts. Please wait a moment and retry.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in popup was closed before completing.';
    case 'auth/network-request-failed':
      return 'Network error encountered. Please check your connection.';
    default:
      return err?.message || 'Authentication failed. Please check your credentials and try again.';
  }
}

const GUEST_SESSION_KEY = 'hearthbound_active_guest_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | GuestUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userInitialData, setUserInitialData] = useState<{
    stats: PlayerStats | null;
    quests: Quest[];
    inventory: InventoryItem[];
  } | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      setError(null);
      if (currentUser) {
        try {
          setUser(currentUser);
          localStorage.removeItem(GUEST_SESSION_KEY);
          const initialData = await initializeUserAccount(currentUser);
          setUserInitialData(initialData);
        } catch (err) {
          console.error('Failed to initialize user data in Firebase:', err);
          setError('Failed to sync profile from cloud. Using local realm data.');
        }
      } else {
        // Check if user had an active guest session
        const savedGuestUid = localStorage.getItem(GUEST_SESSION_KEY);
        if (savedGuestUid) {
          const guestUser: GuestUser = {
            uid: savedGuestUid,
            email: 'guest@pixelrealm.local',
            displayName: 'Guest Adventurer',
            isAnonymous: true,
          };
          setUser(guestUser);
          setUserInitialData({
            stats: loadSavedStats(),
            quests: loadSavedQuests(),
            inventory: loadSavedInventory(),
          });
        } else {
          setUser(null);
          setUserInitialData(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignInGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Google Sign-in failure:', err);
      setError(formatAuthError(err));
      setLoading(false);
    }
  };

  const handleSignInEmail = async (email: string, pass: string) => {
    if (!email || !pass) {
      setError('Please enter both your email address and password.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await signInWithEmail(email, pass);
    } catch (err: any) {
      console.error('Email sign-in failure:', err);
      setError(formatAuthError(err));
      setLoading(false);
    }
  };

  const handleSignUpEmail = async (email: string, pass: string) => {
    if (!email || !pass) {
      setError('Please enter both your email address and a password.');
      return;
    }
    if (pass.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await signUpWithEmail(email, pass);
    } catch (err: any) {
      console.error('Email sign-up failure:', err);
      setError(formatAuthError(err));
      setLoading(false);
    }
  };

  const handleSignInGuest = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInGuest();
    } catch (err: any) {
      console.warn('Anonymous Firebase auth failed, falling back to local guest mode:', err);
      // Fallback to local guest mode so user is never blocked from playing
      enterAsLocalGuest();
    }
  };

  const enterAsLocalGuest = () => {
    setLoading(true);
    setError(null);
    const guestUid = localStorage.getItem(GUEST_SESSION_KEY) || `guest_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(GUEST_SESSION_KEY, guestUid);
    const guestUser: GuestUser = {
      uid: guestUid,
      email: 'guest@pixelrealm.local',
      displayName: 'Guest Adventurer',
      isAnonymous: true,
    };
    setUser(guestUser);
    setUserInitialData({
      stats: loadSavedStats(),
      quests: loadSavedQuests(),
      inventory: loadSavedInventory(),
    });
    setLoading(false);
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      localStorage.removeItem(GUEST_SESSION_KEY);
      await signOutUser();
      setUser(null);
      setUserInitialData(null);
      setLoading(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to sign out.');
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        signIn: handleSignInGoogle,
        signInWithEmailPass: handleSignInEmail,
        signUpWithEmailPass: handleSignUpEmail,
        signInAsGuest: handleSignInGuest,
        enterAsLocalGuest,
        signOut: handleSignOut,
        clearError: () => setError(null),
        userInitialData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
