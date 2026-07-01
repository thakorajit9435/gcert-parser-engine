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
    if (!currentUser) {
      return {success: false, error: 'User is not authenticated'};
    }

    const activeUserId = userId || currentUser.uid;
    if (currentUser.uid !== activeUserId) {
      console.warn(
        `UserId mismatch in toggleBookmark: ${currentUser.uid} vs ${activeUserId}`,
      );
    }

    const docId = `${activeUserId}_${chapterId}`;
    const docRef = firestore()
      .collection(COLLECTIONS.USER_BOOKMARKS)
      .doc(docId);

    // De-duplication check: check if any bookmarks exist for this user and chapter
    const snapshot = await firestore()
      .collection(COLLECTIONS.USER_BOOKMARKS)
      .where('userId', '==', activeUserId)
      .where('chapterId', '==', chapterId)
      .get();

    if (!snapshot.empty) {
      // Delete all matching documents to remove the bookmark and clean up duplicates
      const batch = firestore().batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      // Also ensure the standard docId is deleted
      batch.delete(docRef);
      await batch.commit();
      return {success: true, data: false}; // removed
    } else {
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
          if (!chapterTitle) chapterTitle = cData?.title || '';
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
          subjectName = subjectDoc.data()?.name || '';
        }
      }

      // 3. Fetch standard name if missing
      if (!standardName && standardId) {
        const stdDocId = standardId.startsWith('std_')
          ? standardId
          : `std_${standardId}`;
        const stdDoc = await firestore()
          .collection(COLLECTIONS.STANDARDS)
          .doc(stdDocId)
          .get();
        if (stdDoc.exists) {
          standardName = stdDoc.data()?.label || `Std ${standardId}`;
        } else {
          standardName = `Std ${standardId}`;
        }
      }

      // Create bookmark with standard docId
      await docRef.set({
        userId: activeUserId,
        chapterId,
        standardId,
        standardName,
        subjectId,
        subjectName,
        chapterTitle,
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
  const currentUser = auth().currentUser;
  if (!currentUser) {
    onError?.('User is not authenticated');
    return () => {};
  }

  const activeUserId = userId || currentUser.uid;
  if (currentUser.uid !== activeUserId) {
    console.warn(
      `UserId mismatch in subscribeToBookmarks: ${currentUser.uid} vs ${activeUserId}`,
    );
  }

  return firestore()
    .collection(COLLECTIONS.USER_BOOKMARKS)
    .where('userId', '==', activeUserId)
    .orderBy('createdAt', 'desc')
    .onSnapshot(
      snapshot => {
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as UserBookmark[];
        onData(items);
      },
      error => {
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
    if (!currentUser) return false;

    const activeUserId = userId || currentUser.uid;
    if (currentUser.uid !== activeUserId) {
      console.warn(
        `UserId mismatch in isBookmarked: ${currentUser.uid} vs ${activeUserId}`,
      );
    }

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
