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
  return firestore()
    .collection(COLLECTIONS.BLUEPRINTS)
    .where('standard', '==', standard)
    .where('semester', '==', semester)
    .where('isDeleted', '==', false)
    .where('isActive', '==', true)
    .orderBy('order', 'asc')
    .onSnapshot(
      snapshot => {
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Blueprint[];
        onData(items);
      },
      error => onError?.(error.message),
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

export async function deleteBlueprint(
  id: string,
): Promise<ServiceResult<void>> {
  return updateBlueprint(id, {isDeleted: true});
}

// ─── Admin: Get all (including inactive) ───────────────────────

export async function getAllBlueprints(
  standard: string,
  semester?: string,
): Promise<ServiceResult<Blueprint[]>> {
  try {
    let query: any = firestore()
      .collection(COLLECTIONS.BLUEPRINTS)
      .where('standard', '==', standard)
      .where('isDeleted', '==', false);

    if (semester) {
      query = query.where('semester', '==', semester);
    }

    const snapshot = await query.orderBy('order', 'asc').get();
    const items = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    })) as Blueprint[];

    return {success: true, data: items};
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}
