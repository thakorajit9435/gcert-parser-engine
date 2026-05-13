import firestore from '@react-native-firebase/firestore';
import {COLLECTIONS} from '../../constants';
import {MCQ, ServiceResult} from '../../types';
import {getFirestoreErrorMessage} from '../../utils/firestoreErrors';

// ─── Fetch MCQs ────────────────────────────────────────────────

export async function getMCQsByChapter(
  chapterId: string,
): Promise<ServiceResult<MCQ[]>> {
  try {
    const snapshot = await firestore()
      .collection(COLLECTIONS.MCQS || 'mcqs')
      .where('chapterId', '==', chapterId)
      .get();

    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as MCQ[];

    return {success: true, data};
  } catch (error) {
    return {success: false, error: getFirestoreErrorMessage(error)};
  }
}
