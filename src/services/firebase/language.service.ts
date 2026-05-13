import firestore from '@react-native-firebase/firestore';
import {COLLECTIONS} from '../../constants';
import {LanguageItem, ServiceResult} from '../../types';

// ─── Read ──────────────────────────────────────────────────────

export async function getLanguageItems(
  standard: string,
  language: string,
): Promise<ServiceResult<LanguageItem[]>> {
  try {
    const snapshot = await firestore()
      .collection(COLLECTIONS.LANGUAGE_SECTION)
      .where('standard', '==', standard)
      .where('language', '==', language)
      .where('isDeleted', '==', false)
      .where('isActive', '==', true)
      .get();

    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as LanguageItem[];

    items.sort((a, b) => (a.order || 0) - (b.order || 0));

    return {success: true, data: items};
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}

export function subscribeToLanguageItems(
  standard: string,
  language: string,
  onData: (items: LanguageItem[]) => void,
  onError?: (error: string) => void,
): () => void {
  return firestore()
    .collection(COLLECTIONS.LANGUAGE_SECTION)
    .where('standard', '==', standard)
    .where('language', '==', language)
    .where('isDeleted', '==', false)
    .onSnapshot(
      snapshot => {
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as LanguageItem[];
        items.sort((a, b) => (a.order || 0) - (b.order || 0));
        onData(items);
      },
      error => onError?.(error.message),
    );
}

// ─── Admin CRUD ────────────────────────────────────────────────

export async function createLanguageItem(
  data: Omit<LanguageItem, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>,
): Promise<ServiceResult<string>> {
  try {
    const ref = await firestore()
      .collection(COLLECTIONS.LANGUAGE_SECTION)
      .add({
        ...data,
        isActive: data.isActive !== undefined ? data.isActive : true,
        isDeleted: false,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    return {success: true, data: ref.id};
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}

export async function updateLanguageItem(
  id: string,
  data: Partial<Omit<LanguageItem, 'id' | 'createdAt'>>,
): Promise<ServiceResult<void>> {
  try {
    await firestore()
      .collection(COLLECTIONS.LANGUAGE_SECTION)
      .doc(id)
      .update({
        ...data,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    return {success: true};
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}

export async function deleteLanguageItem(
  id: string,
): Promise<ServiceResult<void>> {
  return updateLanguageItem(id, {isDeleted: true});
}

// ─── Admin: Get all (including inactive) ───────────────────────

export async function getAllLanguageItems(
  standard: string,
): Promise<ServiceResult<LanguageItem[]>> {
  try {
    const snapshot = await firestore()
      .collection(COLLECTIONS.LANGUAGE_SECTION)
      .where('standard', '==', standard)
      .where('isDeleted', '==', false)
      .get();

    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as LanguageItem[];

    items.sort((a, b) => {
      if (a.language !== b.language) {
        return (a.language || '').localeCompare(b.language || '');
      }
      return (a.order || 0) - (b.order || 0);
    });

    return {success: true, data: items};
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}
