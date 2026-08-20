import firestore from '@react-native-firebase/firestore';
import {COLLECTIONS} from '../../constants';
import {OldPaper, ServiceResult} from '../../types';

// ─── Read ──────────────────────────────────────────────────────

export function subscribeToOldPapers(
  standard: string,
  semester: string,
  onData: (items: OldPaper[]) => void,
  onError?: (error: string) => void,
): () => void {
  const stdStr = String(standard || '').trim();
  const numStr = stdStr.replace(/[^0-9]/g, '');

  return firestore()
    .collection(COLLECTIONS.OLD_PAPERS)
    .onSnapshot(
      snapshot => {
        if (!snapshot) {
          onData([]);
          return;
        }
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as OldPaper[];

        const filtered = items.filter(item => {
          if (item.isDeleted === true) return false;
          if (item.isActive === false) return false;

          // Match standard
          const itemStdStr = String(item.standard || item.standardId || '').trim();
          const itemNumStr = itemStdStr.replace(/[^0-9]/g, '');
          const matchStd = !stdStr || itemStdStr === stdStr || (numStr && itemNumStr === numStr);
          if (!matchStd) return false;

          // Match semester if specified
          if (semester && semester !== 'all') {
            const itemSem = String(item.semester || '').trim().toLowerCase();
            const targetSem = String(semester).trim().toLowerCase();
            if (itemSem && itemSem !== targetSem) return false;
          }

          return true;
        });

        filtered.sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0));
        onData(filtered);
      },
      error => {
        console.error('[subscribeToOldPapers] error:', error);
        onError?.(error.message);
      },
    );
}

// ─── Admin CRUD ────────────────────────────────────────────────

export async function createOldPaper(
  data: Omit<OldPaper, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>,
): Promise<ServiceResult<string>> {
  try {
    const ref = await firestore()
      .collection(COLLECTIONS.OLD_PAPERS)
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

export async function updateOldPaper(
  id: string,
  data: Partial<Omit<OldPaper, 'id' | 'createdAt'>>,
): Promise<ServiceResult<void>> {
  try {
    await firestore()
      .collection(COLLECTIONS.OLD_PAPERS)
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

export async function deleteOldPaper(id: string): Promise<ServiceResult<void>> {
  return updateOldPaper(id, {isDeleted: true});
}

// ─── Admin: Get all (including inactive) ───────────────────────

export async function getAllOldPapers(
  standard: string,
  semester?: string,
): Promise<ServiceResult<OldPaper[]>> {
  try {
    const snapshot = await firestore()
      .collection(COLLECTIONS.OLD_PAPERS)
      .where('isDeleted', '==', false)
      .get();

    let items = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    })) as OldPaper[];

    if (standard) {
      const numStr = String(standard).replace(/[^0-9]/g, '');
      items = items.filter(item => {
        const itemStdStr = String(item.standard || item.standardId || '').trim();
        const itemNumStr = itemStdStr.replace(/[^0-9]/g, '');
        return itemStdStr === standard || (numStr && itemNumStr === numStr);
      });
    }

    if (semester && semester !== 'all') {
      items = items.filter(
        item =>
          String(item.semester || '').trim().toLowerCase() ===
          String(semester).trim().toLowerCase(),
      );
    }

    items.sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0));
    return {success: true, data: items};
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}
