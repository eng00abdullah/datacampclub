import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser, getRedirectResult } from 'firebase/auth';
import { doc, onSnapshot, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, isFirebaseReady } from '../lib/firebase';
import { demoSettings, demoUsers } from '../lib/demoData';
import { generateMemberId } from '../lib/memberUtils';
import { toast } from 'sonner';

interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  role: string;
  memberId: string;
  status: string;
  isVerified: boolean;
  phoneNumber?: string;
  faculty?: string;
  academicYear?: string;
  photoURL?: string;
}

interface SiteSettings {
  enableRegistration: boolean;
  maintenanceMode: boolean;
  siteName: string;
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  settings: SiteSettings | null;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isHR: boolean;
  isEventManager: boolean;
  isContentManager: boolean;
  isFinanceManager: boolean;
  isOrganizer: boolean;
  isManager: boolean;
  setMockUser: (profile: UserProfile) => void;
}

const VALID_ROLES = [
  'super_admin', 
  'admin', 
  'hr_organizer', 
  'hr_manager', 
  'event_manager', 
  'content_manager', 
  'finance_manager', 
  'organizer', 
  'member'
];

const sanitizeRole = (role: string): string => {
  return VALID_ROLES.includes(role) ? role : 'member';
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Handle Mock Auth
  const setMockUser = (mockProfile: UserProfile) => {
    mockProfile.role = sanitizeRole(mockProfile.role);
    setUser({ uid: mockProfile.uid, email: mockProfile.email } as any);
    setProfile(mockProfile);
  };

  useEffect(() => {
    // Fetch Settings
    if (!isFirebaseReady) {
      setSettings({
        enableRegistration: demoSettings.enableRegistration,
        maintenanceMode: demoSettings.maintenanceMode,
        siteName: demoSettings.siteName
      });
    } else {
      const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'site'), (snap) => {
        if (snap.exists()) setSettings(snap.data() as SiteSettings);
      });
      return () => unsubscribeSettings();
    }
  }, []);

  useEffect(() => {
    if (!isFirebaseReady) {
      // In Demo Mode, we don't persist users across reloads for security audits
      // Operatives must re-authenticate to simulate fresh access
      setLoading(false);
      return;
    }

    // Handle Redirect Result
    getRedirectResult(auth).then(async (result) => {
      if (result?.user) {
        setLoading(true);
        const user = result.user;
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
          const memberId = await generateMemberId(demoUsers);
          await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            fullName: user.displayName || 'New Member',
            role: 'member',
            memberId,
            status: 'active',
            isVerified: user.emailVerified,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          toast.success('Account initialized via Identity Provider.');
        } else {
          toast.success('Welcome back!');
        }
        
        // Force sync redirect to dashboard if user is on auth pages
        if (window.location.pathname === '/login' || window.location.pathname === '/register') {
          window.location.href = '/dashboard';
        }
      }
    }).catch((error) => {
      console.error("Redirect Auth Error:", error);
      if (error.code !== 'auth/no-auth-event') {
        toast.error(error.message);
      }
    });

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
      } else {
        // Sync email verification status and ensure profile exists
        if (firebaseUser.emailVerified) {
          try {
            const userRef = doc(db, 'users', firebaseUser.uid);
            const snap = await getDoc(userRef);
            
            if (snap.exists()) {
              const data = snap.data() as UserProfile;
              if (!data.isVerified) {
                await updateDoc(userRef, { 
                  isVerified: true,
                  updatedAt: new Date().toISOString()
                });
              }
            } else {
              // If user is authenticated in Auth but not in Firestore, 
              // we must create a basic profile to avoid deadlocks
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
            console.warn("Could not sync verification or profile:", err);
          }
        }
        // Loading will resolve in the profile useEffect
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (isFirebaseReady && user && !profile) {
      const unsubscribeProfile = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfile;
          data.role = sanitizeRole(data.role);
          setProfile(data);
        }
        setLoading(false);
      }, (error) => {
        console.error("Error fetching profile:", error);
        setLoading(false);
      });
      return () => unsubscribeProfile();
    } else if (isFirebaseReady && user && profile) {
      setLoading(false);
    } else if (isFirebaseReady && !user) {
      setLoading(false);
    }
  }, [user, profile, isFirebaseReady]);

  const isSuperAdmin = profile?.role === 'super_admin';
  const isAdmin = isSuperAdmin || profile?.role === 'admin';
  const isHR = isSuperAdmin || profile?.role === 'hr_organizer' || profile?.role === 'hr_manager';
  const isEventManager = isSuperAdmin || profile?.role === 'event_manager';
  const isContentManager = isSuperAdmin || profile?.role === 'content_manager';
  const isFinanceManager = isSuperAdmin || profile?.role === 'finance_manager';
  const isOrganizer = isSuperAdmin || profile?.role === 'organizer';
  
  const isManager = isAdmin || isHR || isEventManager || isContentManager || isFinanceManager || isOrganizer;

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      settings,
      isSuperAdmin,
      isAdmin, 
      isHR, 
      isEventManager,
      isContentManager,
      isFinanceManager,
      isOrganizer,
      isManager, 
      setMockUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
