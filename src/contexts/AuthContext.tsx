import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db, isFirebaseReady } from '../lib/firebase';

interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  role: string;
  memberId: string;
  isVerified: boolean;
  status: string;
  faculty?: string;
  academicYear?: string;
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isHR: boolean;
  isEventManager: boolean;
  isContentManager: boolean;
  isFinanceManager: boolean;
  isOrganizer: boolean;
  isManager: boolean;
  logout: () => Promise<void>;
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

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (isFirebaseReady && user) {
      const unsubscribeProfile = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        }
        setLoading(false);
      }, (error) => {
        console.error("Profile sync error:", error);
        setLoading(false);
      });
      return () => unsubscribeProfile();
    }
  }, [user]);

  const logout = () => signOut(auth);

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
      user, profile, loading, 
      isSuperAdmin, isAdmin, isHR, isEventManager, 
      isContentManager, isFinanceManager, isOrganizer, 
      isManager, logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
