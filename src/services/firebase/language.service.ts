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
      .where('isDeleted', '==', false)
      .get();

    const stdStr = String(standard || '').trim();
    const numStr = stdStr.replace(/[^0-9]/g, '');
    const langStr = String(language || '').trim().toLowerCase();

    let items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as LanguageItem[];

    items = items.filter(item => {
      if (item.isActive === false) return false;
      const itemStdStr = String(item.standard || '').trim();
      const itemNumStr = itemStdStr.replace(/[^0-9]/g, '');
      const matchStd =
        !stdStr || itemStdStr === stdStr || (numStr && itemNumStr === numStr);
      const matchLang =
        !langStr ||
        String(item.language || '').trim().toLowerCase() === langStr;
      return matchStd && matchLang;
    });

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
  const stdStr = String(standard || '').trim();
  const numStr = stdStr.replace(/[^0-9]/g, '');
  const langStr = String(language || '').trim().toLowerCase();

  return firestore()
    .collection(COLLECTIONS.LANGUAGE_SECTION)
    .onSnapshot(
      snapshot => {
        if (!snapshot) {
          onData([]);
          return;
        }
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as LanguageItem[];

        const filtered = items.filter(item => {
          if (item.isDeleted === true) return false;
          if (item.isActive === false) return false;
          const itemStdStr = String(item.standard || '').trim();
          const itemNumStr = itemStdStr.replace(/[^0-9]/g, '');
          const matchStd =
            !stdStr || itemStdStr === stdStr || (numStr && itemNumStr === numStr);
          const matchLang =
            !langStr ||
            String(item.language || '').trim().toLowerCase() === langStr;
          return matchStd && matchLang;
        });

        filtered.sort((a, b) => (a.order || 0) - (b.order || 0));
        onData(filtered);
      },
      error => {
        console.error('[subscribeToLanguageItems] error:', error);
        onError?.(error.message);
      },
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
  standard?: string,
  language?: string,
): Promise<ServiceResult<LanguageItem[]>> {
  try {
    const snapshot = await firestore()
      .collection(COLLECTIONS.LANGUAGE_SECTION)
      .where('isDeleted', '==', false)
      .get();

    let items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as LanguageItem[];

    if (standard) {
      const numStr = String(standard).replace(/[^0-9]/g, '');
      items = items.filter(item => {
        const itemStdStr = String(item.standard || '').trim();
        const itemNumStr = itemStdStr.replace(/[^0-9]/g, '');
        return itemStdStr === standard || (numStr && itemNumStr === numStr);
      });
    }

    if (language) {
      const langStr = String(language).trim().toLowerCase();
      items = items.filter(
        item => String(item.language || '').trim().toLowerCase() === langStr,
      );
    }

    items.sort((a, b) => (a.order || 0) - (b.order || 0));
    return {success: true, data: items};
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}
