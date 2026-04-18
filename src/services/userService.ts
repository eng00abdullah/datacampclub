import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  serverTimestamp,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db, isFirebaseReady } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';
import { demoUsers, setDemoUsers } from '../lib/demoData';

const COLLECTION = 'users';

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  if (!isFirebaseReady) {
    return demoUsers.find((u: UserProfile) => u.uid === uid) || null;
  }

  const docRef = doc(db, COLLECTION, uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? (docSnap.data() as UserProfile) : null;
};

export const createUserProfile = async (profile: UserProfile): Promise<void> => {
  if (!isFirebaseReady) {
    setDemoUsers([...demoUsers, { ...profile, uid: profile.uid || Date.now().toString() }]);
    return;
  }

  const docRef = doc(db, COLLECTION, profile.uid);
  await setDoc(docRef, {
    ...profile,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
};

export const updateUserProfile = async (uid: string, updates: Partial<UserProfile>): Promise<void> => {
  if (!isFirebaseReady) {
    const updated = demoUsers.map(u => u.uid === uid ? { ...u, ...updates } : u);
    setDemoUsers(updated);
    return;
  }

  const docRef = doc(db, COLLECTION, uid);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp()
  });
};

export const getUsers = async (pageSize: number = 10, lastDoc?: QueryDocumentSnapshot): Promise<{ users: UserProfile[], lastDoc?: QueryDocumentSnapshot }> => {
  if (!isFirebaseReady) {
    return { users: demoUsers.slice(0, pageSize) };
  }

  let q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'), limit(pageSize));
  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  const querySnapshot = await getDocs(q);
  const users = querySnapshot.docs.map(doc => doc.data() as UserProfile);
  const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];

  return { users, lastDoc: lastVisible };
};
