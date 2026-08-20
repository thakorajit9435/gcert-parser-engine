import firestore from '@react-native-firebase/firestore';
import {COLLECTIONS} from '../../constants';
import {Blueprint, ServiceResult} from '../../types';

// ─── Read ──────────────────────────────────────────────────────

export function subscribeToBlueprints(
  standard: string,
  semester: string,
  onData: (items: Blueprint[]) => void,
  onError?: (error: string) => void,
): () => void {
  const stdStr = String(standard || '').trim();
  const numStr = stdStr.replace(/[^0-9]/g, '');

  return firestore()
    .collection(COLLECTIONS.BLUEPRINTS)
    .onSnapshot(
      snapshot => {
        if (!snapshot) {
          onData([]);
          return;
        }
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Blueprint[];

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

        filtered.sort((a, b) => (a.order || 0) - (b.order || 0));
        onData(filtered);
      },
      error => {
        console.error('[subscribeToBlueprints] error:', error);
        onError?.(error.message);
      },
    );
}

// ─── Admin CRUD ────────────────────────────────────────────────

export async function createBlueprint(
  data: Omit<Blueprint, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>,
): Promise<ServiceResult<string>> {
  try {
    const ref = await firestore()
      .collection(COLLECTIONS.BLUEPRINTS)
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

export async function updateBlueprint(
  id: string,
  data: Partial<Omit<Blueprint, 'id' | 'createdAt'>>,
): Promise<ServiceResult<void>> {
  try {
    await firestore()
      .collection(COLLECTIONS.BLUEPRINTS)
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

export async function deleteBlueprint(id: string): Promise<ServiceResult<void>> {
  return updateBlueprint(id, {isDeleted: true});
}

// ─── Admin: Get all (including inactive) ───────────────────────

export async function getAllBlueprints(
  standard: string,
  semester?: string,
): Promise<ServiceResult<Blueprint[]>> {
  try {
    const snapshot = await firestore()
      .collection(COLLECTIONS.BLUEPRINTS)
      .where('isDeleted', '==', false)
      .get();

    let items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Blueprint[];

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

    items.sort((a, b) => (a.order || 0) - (b.order || 0));
    return {success: true, data: items};
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}
