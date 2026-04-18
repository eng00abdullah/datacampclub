import { doc, runTransaction } from 'firebase/firestore';
import { db, isFirebaseReady } from './firebase';

export const generateMemberId = async (existingUsers: any[] = []) => {
  if (!isFirebaseReady) {
    // Demo mode: Increment based on existing items in memory
    const maxId = existingUsers.reduce((max: number, u: any) => {
      const id = parseInt(u.memberId);
      return (isNaN(id) || !u.memberId) ? max : Math.max(max, id);
    }, 0);
    return (maxId + 1).toString();
  }

  const counterRef = doc(db, 'id_counters', 'global');
  
  try {
    return await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      let count = 1;
      
      if (counterDoc.exists()) {
        count = counterDoc.data().count + 1;
        transaction.update(counterRef, { count });
      } else {
        transaction.set(counterRef, { count: 1 });
      }
      
      return count.toString();
    });
  } catch (err) {
    console.warn("Counter transaction failed, using timestamp fallback:", err);
    return Date.now().toString().slice(-6); // Shorter numeric fallback
  }
};
