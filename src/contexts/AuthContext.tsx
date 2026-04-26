import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  User as FirebaseUser, 
  signOut, 
  getRedirectResult,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  GoogleAuthProvider
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
  const [authError, setAuthError] = useState<string | null>(null);

  // Profile creation helper
  const ensureProfile = async (firebaseUser: FirebaseUser) => {
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
          isVerified: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          photoURL: firebaseUser.photoURL || undefined
        };
        await setDoc(userRef, newProfile);
        return newProfile;
      }
      return snap.data() as UserProfile;
    } catch (err) {
      console.error("Profile creation/check error:", err);
      return null;
    }
  };

  useEffect(() => {
    if (!isFirebaseReady) {
      setLoading(false);
      return;
    }

    // Auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        setLoading(false);
        setAuthError(null);
        ensureProfile(currentUser);
      } else {
        // Only if no user, check for a redirect result
        try {
          const result = await getRedirectResult(auth);
          if (result?.user) {
            setAuthError(null);
            setUser(result.user);
            await ensureProfile(result.user);
          }
        } catch (err: any) {
          if (err.code === 'auth/unauthorized-domain') {
            setAuthError('unauthorized-domain');
            const domain = window.location.hostname;
            toast.error(`Domain "${domain}" is not authorized.`, { duration: 15000 });
          } else {
            console.error("Redirect error:", err);
          }
        }
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Separate Profile Sync Effect
  useEffect(() => {
    if (user && isFirebaseReady) {
      const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        }
      });
      return () => unsubscribe();
    }
  }, [user]);

  const loginWithGoogle = async () => {
    if (!isFirebaseReady) return;
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await ensureProfile(result.user);
        toast.success("Successfully authenticated.");
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      
      if (error.code === 'auth/unauthorized-domain') {
        setAuthError('unauthorized-domain');
        const domain = window.location.hostname;
        toast.error(
          `Domain Unauthorized: Please add "${domain}" to your Firebase Console (Authentication > Settings > Authorized Domains).`,
          { duration: 15000 }
        );
      } else if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
        toast.info("Secure gateway initializing...");
      } else {
        toast.error("Authentication failed: " + error.message);
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
    setAuthError(null);
  };

  const role = profile?.role || '';
  const isSuperAdmin = role === 'super_admin';
  const isAdmin = isSuperAdmin || role === 'admin';
  const isHR = isSuperAdmin || ['hr_organizer', 'hr_manager', 'hr_member'].includes(role);
  const isEventManager = isSuperAdmin || role === 'event_manager';
  const isContentManager = isSuperAdmin || role === 'content_manager';
  const isFinanceManager = isSuperAdmin || role === 'finance_manager';
  const isOrganizer = isSuperAdmin || role === 'organizer';
  const isManager = isAdmin || isHR || isEventManager || isContentManager || isFinanceManager || isOrganizer;

  const setMockUser = (mockData: any) => {
    if (profile) {
      setProfile({ ...profile, ...mockData });
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, profile, loading, logout, loginWithGoogle,
      isSuperAdmin, isAdmin, isHR, isEventManager,
      isContentManager, isFinanceManager, isOrganizer,
      isManager,
      settings: {},
      setMockUser,
      authError
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
