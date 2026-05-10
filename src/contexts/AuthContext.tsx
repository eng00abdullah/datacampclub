import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  onAuthStateChanged,
  User as FirebaseUser,
  signOut,
  getRedirectResult,
  signInWithPopup,
} from 'firebase/auth';
import { doc, onSnapshot, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, isFirebaseReady, googleProvider } from '../lib/firebase';
import { generateMemberId } from '../lib/memberUtils';
import { demoUsers } from '../lib/demoData';
import { toast } from 'sonner';

interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  role: string;
  memberId: string;
  isVerified: boolean;
  status: string;
  phoneNumber?: string;
  faculty?: string;
  academicYear?: string;
  photoURL?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isHR: boolean;
  isEventManager: boolean;
  isContentManager: boolean;
  isFinanceManager: boolean;
  isOrganizer: boolean;
  isManager: boolean;
  settings: any;
  setMockUser: (user: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const isInitialized = useRef(false);
  const profileUnsubscribeRef = useRef<(() => void) | null>(null);

  // Create or fetch user profile in Firestore
  const ensureProfile = async (firebaseUser: FirebaseUser): Promise<UserProfile | null> => {
    if (!isFirebaseReady) return null;
    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        const memberId = await generateMemberId(demoUsers);
        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          fullName: firebaseUser.displayName || 'New Member',
          role: 'member',
          memberId,
          status: 'active',
          isVerified: true, // Google accounts are pre-verified
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          photoURL: firebaseUser.photoURL || undefined,
        };
        await setDoc(userRef, newProfile);
        return newProfile;
      }

      return snap.data() as UserProfile;
    } catch (err) {
      console.error('Profile creation/check error:', err);
      return null;
    }
  };

  // Subscribe to real-time profile updates for a given uid
  const subscribeToProfile = (uid: string) => {
    // Unsubscribe from any previous profile listener
    if (profileUnsubscribeRef.current) {
      profileUnsubscribeRef.current();
      profileUnsubscribeRef.current = null;
    }

    if (!isFirebaseReady) return;

    const unsubscribe = onSnapshot(doc(db, 'users', uid), (docSnap) => {
      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile);
      }
    });

    profileUnsubscribeRef.current = unsubscribe;
  };

  // Auth state listener
  useEffect(() => {
    if (!isFirebaseReady) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const isNewLogin = isInitialized.current;
        isInitialized.current = true;

        setUser(currentUser);

        // ✅ FIX: Ensure profile exists BEFORE setting loading=false
        // This prevents Dashboard from opening with profile=null
        const fetchedProfile = await ensureProfile(currentUser);
        if (fetchedProfile) {
          setProfile(fetchedProfile);
        }

        // Subscribe to real-time updates (will keep profile fresh)
        subscribeToProfile(currentUser.uid);

        setLoading(false);

        if (isNewLogin) {
          toast.success('Welcome to DataCamp Student Club!');
        }
      } else {
        // No user yet — check if we're coming back from a redirect flow
        try {
          const result = await getRedirectResult(auth);
          if (result?.user) {
            // Redirect login succeeded
            setUser(result.user);
            const fetchedProfile = await ensureProfile(result.user);
            if (fetchedProfile) {
              setProfile(fetchedProfile);
            }
            subscribeToProfile(result.user.uid);
            setLoading(false);
            return;
          }
        } catch (err: any) {
          if (err.code === 'auth/unauthorized-domain') {
            const domain = window.location.hostname;
            toast.error(
              `Domain "${domain}" is not authorized. Add it to Firebase Console → Authentication → Authorized Domains.`,
              { duration: 15000 }
            );
          } else if (err.code && err.code !== 'auth/popup-closed-by-user') {
            console.error('Redirect result error:', err);
          }
        }

        // Genuinely no user — clean up
        isInitialized.current = false;
        if (profileUnsubscribeRef.current) {
          profileUnsubscribeRef.current();
          profileUnsubscribeRef.current = null;
        }
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (profileUnsubscribeRef.current) {
        profileUnsubscribeRef.current();
      }
    };
  }, []);

  // Google Sign In
  const loginWithGoogle = async () => {
    if (!isFirebaseReady) {
      toast.error('Firebase is not configured. Please check your setup.');
      return;
    }

    try {
      await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged will fire automatically and handle everything
    } catch (error: any) {
      if (
        error.code === 'auth/popup-closed-by-user' ||
        error.code === 'auth/cancelled-popup-request'
      ) {
        return;
      }

      if (error.code === 'auth/unauthorized-domain') {
        const domain = window.location.hostname;
        toast.error(
          `Domain "${domain}" is not authorized. Add it in Firebase Console → Authentication → Authorized Domains.`,
          { duration: 15000 }
        );
        return;
      }

      if (error.code === 'auth/popup-blocked') {
        toast.info('Popup was blocked by your browser. Please allow popups for this site and try again.');
        return;
      }

      toast.error('Sign-in failed. Please try again.');
      console.error('Google sign-in error:', error);
    }
  };

  // Logout
  const logout = async () => {
    try {
      if (profileUnsubscribeRef.current) {
        profileUnsubscribeRef.current();
        profileUnsubscribeRef.current = null;
      }
      await signOut(auth);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setProfile(null);
    }
  };

  // Role helpers
  const role = profile?.role || '';
  const isSuperAdmin = role === 'super_admin';
  const isAdmin = isSuperAdmin || role === 'admin';
  const isHR = isSuperAdmin || ['hr_organizer', 'hr_manager', 'hr_member'].includes(role);
  const isEventManager = isSuperAdmin || role === 'event_manager';
  const isContentManager = isSuperAdmin || role === 'content_manager';
  const isFinanceManager = isSuperAdmin || role === 'finance_manager';
  const isOrganizer = isSuperAdmin || role === 'organizer';
  const isManager =
    isAdmin || isHR || isEventManager || isContentManager || isFinanceManager || isOrganizer;

  const setMockUser = (mockData: any) => {
    if (profile) {
      setProfile({ ...profile, ...mockData });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        logout,
        loginWithGoogle,
        isSuperAdmin,
        isAdmin,
        isHR,
        isEventManager,
        isContentManager,
        isFinanceManager,
        isOrganizer,
        isManager,
        settings: {},
        setMockUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
