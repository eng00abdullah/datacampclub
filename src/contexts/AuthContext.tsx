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
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
  isManager: boolean;
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

    // Handle Landing from Google Redirect
    const handleLanding = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          toast.success('Establishing digital identity...');
        }
      } catch (error: any) {
        if (error.code !== 'auth/no-auth-event') {
          console.error("Landing error:", error);
        }
      }
    };
    handleLanding();

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
      } else {
        // Essential: Check/Create Firestore Profile for ANY auth change
        const userRef = doc(db, 'users', firebaseUser.uid);
        const snap = await getDoc(userRef);
        
        if (!snap.exists()) {
          const memberId = await generateMemberId(demoUsers);
          await setDoc(userRef, {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            fullName: firebaseUser.displayName || 'New Member',
            role: 'member',
            memberId,
            status: 'active',
            isVerified: firebaseUser.emailVerified || true, // Treat social login as verified
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
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
        console.error("Sync error:", error);
        setLoading(false);
      });
      return () => unsubscribeProfile();
    }
  }, [user]);

  const logout = () => signOut(auth);
  const isManager = ['admin', 'super_admin', 'hr_manager', 'event_manager', 'content_manager'].includes(profile?.role || '');

  return (
    <AuthContext.Provider value={{ user, profile, loading, logout, isManager }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
