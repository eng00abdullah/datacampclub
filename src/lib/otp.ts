import { collection, addDoc, query, where, getDocs, deleteDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db, isFirebaseReady } from './firebase';
import { toast } from 'sonner';

// In-memory storage for Demo Mode OTPs (not persisted across reloads for security)
const demoStore: Record<string, { otp: string; expiresAt: number }> = {};

const hashOTP = async (otp: string) => {
  const msgUint8 = new TextEncoder().encode(otp);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const generateOTP = () => {
  const array = new Uint32Array(1);
  window.crypto.getRandomValues(array);
  const randomNumber = array[0] / (0xFFFFFFFF + 1);
  return Math.floor(100000 + randomNumber * 900000).toString();
};

export const sendOTP = async (target: string, type: 'email' | 'phone') => {
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  if (!isFirebaseReady) {
    demoStore[target] = { otp, expiresAt: expiresAt.getTime() };
    toast.info(`[DEMO] OTP ${otp} would be sent to ${target}`);
    return true;
  }

  try {
    const hashedOtp = await hashOTP(otp);
    
    // Delete old OTPs for this target using Promise.all to fix race condition
    const q = query(collection(db, 'otps'), where('target', '==', target));
    const snap = await getDocs(q);
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));

    // Add new hashed OTP
    await addDoc(collection(db, 'otps'), {
      target,
      otp: hashedOtp,
      type,
      attempts: 0,
      expiresAt: Timestamp.fromDate(expiresAt),
      createdAt: serverTimestamp()
    });

    // In a real production app, this would trigger a Cloud Function or external service hook (e.g. Twilio/SendGrid).
    toast.success(`Verification record prepared for ${target}. (Live SMS/Email transmission requires configured API keys)`);
    return true;
  } catch (error) {
    console.error('Failed to send OTP:', error);
    return false;
  }
};

export const verifyOTP = async (target: string, code: string) => {
  if (!isFirebaseReady) {
    const saved = demoStore[target];
    if (!saved) return false;
    
    if (Date.now() > saved.expiresAt) {
      delete demoStore[target];
      return false;
    }
    
    const isValid = saved.otp === code;
    if (isValid) delete demoStore[target];
    return isValid;
  }

  try {
    const q = query(collection(db, 'otps'), where('target', '==', target));
    const snap = await getDocs(q);
    
    if (snap.empty) return false;
    
    const otpDoc = snap.docs[0];
    const data = otpDoc.data();
    const expiresAt = data.expiresAt.toDate();
    
    if (new Date() > expiresAt || data.attempts >= 5) {
      await deleteDoc(otpDoc.ref);
      return false;
    }

    const hashedInput = await hashOTP(code);
    if (data.otp !== hashedInput) {
      const { updateDoc } = await import('firebase/firestore');
      await updateDoc(otpDoc.ref, { attempts: (data.attempts || 0) + 1 });
      return false;
    }

    // Valid OTP, delete it
    await deleteDoc(otpDoc.ref);
    return true;
  } catch (error) {
    console.error('Failed to verify OTP:', error);
    return false;
  }
};
