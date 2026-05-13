import firestore from '@react-native-firebase/firestore';
import {UserProgress} from '../../types';
import {COLLECTIONS} from '../../constants';

export async function markChapterCompleted(
  userId: string,
  chapterId: string,
  subjectId: string,
  standardId: string,
): Promise<boolean> {
  try {
    const querySnapshot = await firestore()
      .collection(COLLECTIONS.USER_PROGRESS)
      .where('userId', '==', userId)
      .where('chapterId', '==', chapterId)
      .limit(1)
      .get();

    if (!querySnapshot.empty) {
      // Document exists, update it
      const docId = querySnapshot.docs[0]?.id;
      if (!docId) return false;
      await firestore()
        .collection(COLLECTIONS.USER_PROGRESS)
        .doc(docId)
        .update({
          isCompleted: true,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
      return true;
    }

    // Doesn't exist, create new
    const progressData: Omit<UserProgress, 'id'> = {
      userId,
      chapterId,
      subjectId,
      standardId,
      isCompleted: true,
      lastOpenedAt: firestore.FieldValue.serverTimestamp() as any,
      createdAt: firestore.FieldValue.serverTimestamp() as any,
      updatedAt: firestore.FieldValue.serverTimestamp() as any,
    };

    await firestore().collection(COLLECTIONS.USER_PROGRESS).add(progressData);
    return true;
  } catch (err) {
    console.error('Error marking chapter completed:', err);
    return false;
  }
}

export async function updateChapterLastOpened(
  userId: string,
  chapterId: string,
  subjectId: string,
  standardId: string,
): Promise<void> {
  try {
    const querySnapshot = await firestore()
      .collection(COLLECTIONS.USER_PROGRESS)
      .where('userId', '==', userId)
      .where('chapterId', '==', chapterId)
      .limit(1)
      .get();

    if (!querySnapshot.empty) {
      const docId = querySnapshot.docs[0]?.id;
      if (!docId) return;
      await firestore()
        .collection(COLLECTIONS.USER_PROGRESS)
        .doc(docId)
        .update({
          lastOpenedAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
      return;
    }

    const progressData: Omit<UserProgress, 'id'> = {
      userId,
      chapterId,
      subjectId,
      standardId,
      isCompleted: false, // Just opening it
      lastOpenedAt: firestore.FieldValue.serverTimestamp() as any,
      createdAt: firestore.FieldValue.serverTimestamp() as any,
      updatedAt: firestore.FieldValue.serverTimestamp() as any,
    };

    await firestore().collection(COLLECTIONS.USER_PROGRESS).add(progressData);
  } catch (err) {
    console.error('Error updating lastOpenedAt:', err);
  }
}

export async function toggleChapterBookmark(
  userId: string,
  chapterId: string,
  subjectId: string,
  standardId: string,
  isBookmarked: boolean,
): Promise<boolean> {
  try {
    const querySnapshot = await firestore()
      .collection(COLLECTIONS.USER_PROGRESS)
      .where('userId', '==', userId)
      .where('chapterId', '==', chapterId)
      .limit(1)
      .get();

    if (!querySnapshot.empty) {
      const docId = querySnapshot.docs[0]?.id;
      if (!docId) return false;
      await firestore()
        .collection(COLLECTIONS.USER_PROGRESS)
        .doc(docId)
        .update({
          isBookmarked,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
      return true;
    }

    const progressData: Omit<UserProgress, 'id'> = {
      userId,
      chapterId,
      subjectId,
      standardId,
      isCompleted: false,
      isBookmarked,
      lastOpenedAt: firestore.FieldValue.serverTimestamp() as any,
      createdAt: firestore.FieldValue.serverTimestamp() as any,
      updatedAt: firestore.FieldValue.serverTimestamp() as any,
    };

    await firestore().collection(COLLECTIONS.USER_PROGRESS).add(progressData);
    return true;
  } catch (err) {
    console.error('Error toggling chapter bookmark:', err);
    return false;
  }
}
