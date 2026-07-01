import firestore from '@react-native-firebase/firestore';
import {DailyChallenge} from '../../types';
import {COLLECTIONS} from '../../constants';

export async function getDailyChallenge(
  standardId: string,
  dateStr: string,
): Promise<DailyChallenge | null> {
  try {
    const snapshot = await firestore()
      .collection(COLLECTIONS.DAILY_CHALLENGES)
      .where('standardId', '==', standardId)
      .where('date', '==', dateStr)
      .where('isActive', '==', true)
      .limit(1)
      .get();

    if (snapshot.empty) {return null;}

    const doc = snapshot.docs[0];
    if (!doc) {return null;}
    return {...doc.data(), id: doc.id} as DailyChallenge;
  } catch (err) {
    console.error('Error fetching daily challenge:', err);
    return null;
  }
}

export async function setDailyChallenge(
  standardId: string,
  quizId: string,
  dateStr: string,
): Promise<boolean> {
  try {
    // Find existing challenge for this date and standard
    const existing = await firestore()
      .collection(COLLECTIONS.DAILY_CHALLENGES)
      .where('standardId', '==', standardId)
      .where('date', '==', dateStr)
      .limit(1)
      .get();

    if (!existing.empty) {
      const docId = existing.docs[0]?.id;
      if (!docId) {return false;}
      await firestore()
        .collection(COLLECTIONS.DAILY_CHALLENGES)
        .doc(docId)
        .update({
          quizId,
          isActive: true,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
      return true;
    }

    // Create new
    const challengeData: Omit<DailyChallenge, 'id'> = {
      standardId,
      quizId,
      date: dateStr,
      isActive: true,
      createdAt: firestore.FieldValue.serverTimestamp() as any,
      updatedAt: firestore.FieldValue.serverTimestamp() as any,
    };

    await firestore()
      .collection(COLLECTIONS.DAILY_CHALLENGES)
      .add(challengeData);
    return true;
  } catch (err) {
    console.error('Error setting daily challenge:', err);
    return false;
  }
}
