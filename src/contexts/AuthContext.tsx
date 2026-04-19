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

    // Safety Timeout: Never stay in loading more than 4 seconds
    const safetyTimeout = setTimeout(() => {
      setLoading(false);
    }, 4000);

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
        clearTimeout(safetyTimeout);
      } else {
        // We have a user! Priority 1: Unblock the UI
        setLoading(false);
        clearTimeout(safetyTimeout);

        // Priority 2: Sync Profile (Background)
        try {
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
              isVerified: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
        } catch (err) {
          console.warn("Silent profile sync error:", err);
        }
      }
    });

    return () => {
      unsubscribeAuth();
      clearTimeout(safetyTimeout);
    };
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
