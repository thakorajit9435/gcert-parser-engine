import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import {Book, UserBookProgress, ServiceResult} from '../../types';

const BOOKS_COLLECTION = 'books';
const PROGRESS_COLLECTION = 'userBookProgress';

/**
 * Fetch books for a specific standard. Can filter for active only (for students).
 */
export async function getBooksByStandard(
  standard: string,
  activeOnly = true,
): Promise<ServiceResult<Book[]>> {
  try {
    let query = firestore()
      .collection<Book>(BOOKS_COLLECTION)
      .where('standard', '==', standard);
    if (activeOnly) {
      query = query.where('isActive', '==', true);
    }

    const snapshot = await query.get();
    const books = snapshot.docs.map(doc => ({...doc.data(), id: doc.id}));
    return {success: true, data: books};
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}

/**
 * Fetch all books for admin.
 */
export async function getAllBooks(): Promise<ServiceResult<Book[]>> {
  try {
    const snapshot = await firestore()
      .collection<Book>(BOOKS_COLLECTION)
      .orderBy('createdAt', 'desc')
      .get();
    const books = snapshot.docs.map(doc => ({...doc.data(), id: doc.id}));
    return {success: true, data: books};
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}

/**
 * Add a new book for a standard and subject. Prevents duplicates by title under same subject.
 */
export async function addBook(
  bookData: Omit<Book, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<ServiceResult<Book>> {
  try {
    // Prevent duplicate title under same subject
    const existing = await firestore()
      .collection(BOOKS_COLLECTION)
      .where('subjectId', '==', bookData.subjectId)
      .where('title', '==', bookData.title)
      .get();

    if (!existing.empty) {
      return {
        success: false,
        error: 'A book with this title already exists for this subject.',
      };
    }

    const newBookRef = firestore().collection(BOOKS_COLLECTION).doc();
    const timestamp = firestore.FieldValue.serverTimestamp();

    const newBook = {
      ...bookData,
      isActive: bookData.isActive ?? true,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await newBookRef.set(newBook);
    return {
      success: true,
      data: {id: newBookRef.id, ...newBook} as unknown as Book,
    };
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}

/**
 * Update existing book data
 */
export async function updateBook(
  bookId: string,
  updates: Partial<Book>,
): Promise<ServiceResult<void>> {
  try {
    await firestore()
      .collection(BOOKS_COLLECTION)
      .doc(bookId)
      .update({
        ...updates,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    return {success: true};
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}

/**
 * Delete a book by ID. Does NOT delete the associated storage file in this method.
 */
export async function deleteBook(bookId: string): Promise<ServiceResult<void>> {
  try {
    await firestore().collection(BOOKS_COLLECTION).doc(bookId).delete();
    return {success: true};
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}

/**
 * Upload Book PDF to storage
 * Path: books/{standard}/{subject}/{fileName}.pdf
 */
export async function uploadBookPdf(
  localPath: string,
  standard: string,
  subjectId: string,
  fileName: string,
): Promise<ServiceResult<string>> {
  try {
    const fullPath = `books/${standard}/${subjectId}/${fileName}.pdf`;
    const ref = storage().ref(fullPath);

    await ref.putFile(localPath);
    const downloadUrl = await ref.getDownloadURL();

    return {success: true, data: downloadUrl};
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}

/**
 * Get user book progress
 */
export async function getUserBookProgress(
  userId: string,
  bookId: string,
): Promise<ServiceResult<UserBookProgress | null>> {
  try {
    const doc = await firestore()
      .collection(PROGRESS_COLLECTION)
      .doc(userId)
      .collection('books')
      .doc(bookId)
      .get();
    if (doc.exists) {
      return {
        success: true,
        data: {id: doc.id, ...doc.data()} as UserBookProgress,
      };
    }
    return {success: true, data: null};
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}

/**
 * Get all book progress for a specific user
 */
export async function getAllUserBookProgress(
  userId: string,
): Promise<ServiceResult<Record<string, UserBookProgress>>> {
  try {
    const snapshot = await firestore()
      .collection(PROGRESS_COLLECTION)
      .doc(userId)
      .collection('books')
      .get();
    const progressMap: Record<string, UserBookProgress> = {};

    snapshot.docs.forEach(doc => {
      progressMap[doc.id] = {id: doc.id, ...doc.data()} as UserBookProgress;
    });

    return {success: true, data: progressMap};
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}

/**
 * Update (or set) user book progress
 */
export async function updateUserBookProgress(
  userId: string,
  bookId: string,
  lastPage: number,
  totalPages: number,
): Promise<ServiceResult<void>> {
  try {
    const progressRef = firestore()
      .collection(PROGRESS_COLLECTION)
      .doc(userId)
      .collection('books')
      .doc(bookId);
    await progressRef.set(
      {
        userId,
        bookId,
        lastPage,
        totalPages,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      },
      {merge: true},
    );

    return {success: true};
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}
