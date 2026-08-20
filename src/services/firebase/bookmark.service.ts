import auth from '@react-native-firebase/auth';
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
    standardName?: string;
    subjectId?: string;
    subjectName?: string;
    chapterTitle?: string;
  },
): Promise<ServiceResult<boolean>> {
  try {
    const currentUser = auth().currentUser;
    const activeUserId = userId || currentUser?.uid;
    if (!activeUserId) {
      return {success: false, error: 'User is not authenticated'};
    }

    const docId = `${activeUserId}_${chapterId}`;
    const docRef = firestore()
      .collection(COLLECTIONS.USER_BOOKMARKS)
      .doc(docId);

    const docSnap = await docRef.get();

    if (docSnap.exists) {
      await docRef.delete();
      return {success: true, data: false}; // removed
    }

    // Also check if any duplicate bookmarks exist for this user and chapter
    const snapshot = await firestore()
      .collection(COLLECTIONS.USER_BOOKMARKS)
      .where('userId', '==', activeUserId)
      .where('chapterId', '==', chapterId)
      .get();

    if (!snapshot.empty) {
      const batch = firestore().batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      batch.delete(docRef);
      await batch.commit();
      return {success: true, data: false}; // removed
    }

    // Fetch missing details to ensure data integrity
    let standardId = data?.standardId || '';
    let standardName = data?.standardName || '';
    let subjectId = data?.subjectId || '';
    let subjectName = data?.subjectName || '';
    let chapterTitle = data?.chapterTitle || '';

    // 1. Fetch chapter details if any required chapter fields are missing
    if (!chapterTitle || !subjectId || !standardId) {
      const chapterDoc = await firestore()
        .collection(COLLECTIONS.CHAPTERS)
        .doc(chapterId)
        .get();
      if (chapterDoc.exists) {
        const cData = chapterDoc.data();
        if (!chapterTitle) chapterTitle = cData?.titleGu || cData?.title || '';
        if (!subjectId) subjectId = cData?.subjectId || '';
        if (!standardId) standardId = cData?.standardId || '';
      }
    }

    // 2. Fetch subject name if missing
    if (!subjectName && subjectId) {
      const subjectDoc = await firestore()
        .collection(COLLECTIONS.SUBJECTS)
        .doc(subjectId)
        .get();
      if (subjectDoc.exists) {
        const sData = subjectDoc.data();
        subjectName = sData?.nameGu || sData?.name || '';
      }
    }

    // 3. Fetch standard name if missing
    if (!standardName && standardId) {
      standardName = `ધોરણ ${standardId}`;
    }

    // Create bookmark with deterministic docId
    await docRef.set({
      userId: activeUserId,
      chapterId,
      standardId: String(standardId),
      standardName: standardName || `ધોરણ ${standardId}`,
      subjectId: subjectId || '',
      subjectName: subjectName || 'વિષય',
      chapterTitle: chapterTitle || 'પ્રકરણ',
      createdAt: firestore.FieldValue.serverTimestamp(),
    });

    return {success: true, data: true}; // added
  } catch (error) {
    console.error('[toggleBookmark] error:', error);
    return {success: false, error: getFirestoreErrorMessage(error)};
  }
}

// ─── Get All Bookmarks ─────────────────────────────────────────

export function subscribeToBookmarks(
  userId: string,
  onData: (bookmarks: UserBookmark[]) => void,
  onError?: (error: string) => void,
): () => void {
  const currentUser = auth().currentUser;
  const activeUserId = userId || currentUser?.uid;
  if (!activeUserId) {
    onData([]);
    return () => {};
  }

  return firestore()
    .collection(COLLECTIONS.USER_BOOKMARKS)
    .where('userId', '==', activeUserId)
    .onSnapshot(
      snapshot => {
        if (!snapshot || snapshot.empty) {
          onData([]);
          return;
        }
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as UserBookmark[];

        // Sort in-memory by createdAt descending (avoids requiring Firestore composite index)
        items.sort((a: any, b: any) => {
          const tA = a.createdAt?.toMillis
            ? a.createdAt.toMillis()
            : a.createdAt?.seconds
            ? a.createdAt.seconds * 1000
            : 0;
          const tB = b.createdAt?.toMillis
            ? b.createdAt.toMillis()
            : b.createdAt?.seconds
            ? b.createdAt.seconds * 1000
            : 0;
          return tB - tA;
        });

        onData(items);
      },
      error => {
        console.error('[subscribeToBookmarks] error:', error);
        const friendlyMessage = getFirestoreErrorMessage(error);
        onError?.(friendlyMessage);
      },
    );
}

// ─── Check if Bookmarked ──────────────────────────────────────

export async function isBookmarked(
  userId: string,
  chapterId: string,
): Promise<boolean> {
  try {
    const currentUser = auth().currentUser;
    const activeUserId = userId || currentUser?.uid;
    if (!activeUserId) return false;

    const docId = `${activeUserId}_${chapterId}`;
    const docSnap = await firestore()
      .collection(COLLECTIONS.USER_BOOKMARKS)
      .doc(docId)
      .get();

    if (docSnap.exists) return true;

    const snapshot = await firestore()
      .collection(COLLECTIONS.USER_BOOKMARKS)
      .where('userId', '==', activeUserId)
      .where('chapterId', '==', chapterId)
      .limit(1)
      .get();

    return !snapshot.empty;
  } catch {
    return false;
  }
}
