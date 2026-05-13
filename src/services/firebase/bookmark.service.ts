import firestore from '@react-native-firebase/firestore';
import {COLLECTIONS} from '../../constants';
import {UserBookmark, ServiceResult} from '../../types';
import {getFirestoreErrorMessage} from '../../utils/firestoreErrors';

// ─── Toggle Bookmark ───────────────────────────────────────────

export async function toggleBookmark(
  userId: string,
  chapterId: string,
  data?: {
    standardId?: string;
    subjectId?: string;
    subjectName?: string;
    chapterTitle?: string;
  },
): Promise<ServiceResult<boolean>> {
  try {
    const docId = `${userId}_${chapterId}`;
    const docRef = firestore()
      .collection(COLLECTIONS.USER_BOOKMARKS)
      .doc(docId);

    const existing = await docRef.get();

    if (existing.exists) {
      await docRef.delete();
      return {success: true, data: false}; // removed
    } else {
      await docRef.set({
        userId,
        chapterId,
        standardId: data?.standardId || '',
        subjectId: data?.subjectId || '',
        subjectName: data?.subjectName || '',
        chapterTitle: data?.chapterTitle || '',
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
      return {success: true, data: true}; // added
    }
  } catch (error) {
    return {success: false, error: getFirestoreErrorMessage(error)};
  }
}

// ─── Get All Bookmarks ─────────────────────────────────────────

export function subscribeToBookmarks(
  userId: string,
  onData: (bookmarks: UserBookmark[]) => void,
  onError?: (error: string) => void,
): () => void {
  return firestore()
    .collection(COLLECTIONS.USER_BOOKMARKS)
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .onSnapshot(
      snapshot => {
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as UserBookmark[];
        onData(items);
      },
      error => onError?.(error.message),
    );
}

// ─── Check if Bookmarked ──────────────────────────────────────

export async function isBookmarked(
  userId: string,
  chapterId: string,
): Promise<boolean> {
  try {
    const docId = `${userId}_${chapterId}`;
    const doc = await firestore()
      .collection(COLLECTIONS.USER_BOOKMARKS)
      .doc(docId)
      .get();
    return doc.exists;
  } catch {
    return false;
  }
}
