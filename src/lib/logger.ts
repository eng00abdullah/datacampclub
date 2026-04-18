import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseReady } from './firebase';

export const logAction = async (action: string, user: string, target?: string, status: 'success' | 'warning' | 'error' = 'success') => {
  if (!isFirebaseReady) {
    return;
  }

  try {
    await addDoc(collection(db, 'audit_logs'), {
      action,
      user,
      target: target || '',
      status,
      timestamp: serverTimestamp(),
      ip: 'INTERNAL' // In a real app, this would be the client IP
    });
  } catch (error) {
    console.error('Failed to log action:', error);
  }
};
