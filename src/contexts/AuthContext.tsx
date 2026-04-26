import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser, signOut, getRedirectResult } from 'firebase/auth';
import { doc, onSnapshot, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, isFirebaseReady } from '../lib/firebase';
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

  useEffect(() => {
    if (!isFirebaseReady) {
      setLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          // Handled by listener
        }
      } catch (error: any) {
        if (error.code !== 'auth/no-auth-event') {
          console.error("Redirect handler error:", error);
        }
      }

      const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
        setUser(firebaseUser);
        if (!firebaseUser) {
          setProfile(null);
          setLoading(false);
        } else {
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
            }
          } catch (err) {
            console.error("Auth initialization error:", err);
          }
        }
      });

      return () => unsubscribeAuth();
    };

    initAuth();
  }, []);

  useEffect(() => {
    if (isFirebaseReady && user) {
      const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        }
        setLoading(false);
      }, (error) => {
        console.error("Profile sync error:", error);
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const logout = async () => {
    await signOut(auth);
    window.location.href = '/';
  };

  const setMockUser = (mockData: any) => {
    if (profile) {
      setProfile({ ...profile, ...mockData });
    }
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

  return (
    <AuthContext.Provider value={{ 
      user, profile, loading, logout,
      isSuperAdmin, isAdmin, isHR, isEventManager,
      isContentManager, isFinanceManager, isOrganizer,
      isManager,
      settings: {},
      setMockUser
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
