import firestore from '@react-native-firebase/firestore';
import {PdfReadingProgress, PdfType} from '../../types';
import {COLLECTIONS} from '../../constants';
import {logCrashError} from '../crashlytics';

/**
 * Upsert the user's reading progress for a specific PDF.
 */
export async function savePdfProgress(
  userId: string,
  pdfId: string,
  pdfType: PdfType,
  currentPage: number,
  totalPages: number,
): Promise<boolean> {
  try {
    const docId = `${userId}_${pdfId}`;
    await firestore()
      .collection(COLLECTIONS.PDF_READING_PROGRESS)
      .doc(docId)
      .set(
        {
          userId,
          pdfId,
          pdfType,
          currentPage,
          totalPages,
          lastReadAt: firestore.FieldValue.serverTimestamp(),
        },
        {merge: true},
      );
    return true;
  } catch (err) {
    logCrashError(err, 'pdf_error', {action: 'savePdfProgress', userId, pdfId});
    return false;
  }
}

/**
 * Fetch the reading progress for a specific PDF.
 */
export async function getPdfProgress(
  userId: string,
  pdfId: string,
): Promise<PdfReadingProgress | null> {
  try {
    const docId = `${userId}_${pdfId}`;
    const docSnap = await firestore()
      .collection(COLLECTIONS.PDF_READING_PROGRESS)
      .doc(docId)
      .get();

    if (docSnap.exists) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        userId: data?.userId,
        pdfId: data?.pdfId,
        pdfType: data?.pdfType,
        currentPage: data?.currentPage || 1,
        totalPages: data?.totalPages || 0,
        lastReadAt: data?.lastReadAt,
        bookmarkedPages: data?.bookmarkedPages || [],
      } as PdfReadingProgress;
    }
    return null;
  } catch (err) {
    logCrashError(err, 'pdf_error', {action: 'getPdfProgress', userId, pdfId});
    return null;
  }
}

/**
 * Toggle a bookmark on a specific page of a PDF.
 */
export async function togglePageBookmark(
  userId: string,
  pdfId: string,
  pdfType: PdfType,
  page: number,
): Promise<boolean> {
  try {
    const docId = `${userId}_${pdfId}`;
    const docRef = firestore()
      .collection(COLLECTIONS.PDF_READING_PROGRESS)
      .doc(docId);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      const data = docSnap.data();
      const bookmarkedPages: number[] = data?.bookmarkedPages || [];
      const pageIndex = bookmarkedPages.indexOf(page);

      let newBookmarks: number[];
      if (pageIndex > -1) {
        newBookmarks = bookmarkedPages.filter(p => p !== page);
      } else {
        newBookmarks = [...bookmarkedPages, page].sort((a, b) => a - b);
      }

      await docRef.update({
        bookmarkedPages: newBookmarks,
        lastReadAt: firestore.FieldValue.serverTimestamp(),
      });
      return true;
    } else {
      // Create progress document with bookmark
      await docRef.set({
        userId,
        pdfId,
        pdfType,
        currentPage: page,
        totalPages: 0,
        lastReadAt: firestore.FieldValue.serverTimestamp(),
        bookmarkedPages: [page],
      });
      return true;
    }
  } catch (err) {
    logCrashError(err, 'pdf_error', {
      action: 'togglePageBookmark',
      userId,
      pdfId,
      page,
    });
    return false;
  }
}

/**
 * Retrieve recently read PDFs for a user.
 */
export async function getRecentlyReadPdfs(
  userId: string,
  limitVal: number = 5,
): Promise<PdfReadingProgress[]> {
  try {
    const querySnapshot = await firestore()
      .collection(COLLECTIONS.PDF_READING_PROGRESS)
      .where('userId', '==', userId)
      .orderBy('lastReadAt', 'desc')
      .limit(limitVal)
      .get();

    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        pdfId: data.pdfId,
        pdfType: data.pdfType,
        currentPage: data.currentPage,
        totalPages: data.totalPages,
        lastReadAt: data.lastReadAt,
        bookmarkedPages: data.bookmarkedPages || [],
      } as PdfReadingProgress;
    });
  } catch (err) {
    logCrashError(err, 'pdf_error', {action: 'getRecentlyReadPdfs', userId});
    return [];
  }
}
