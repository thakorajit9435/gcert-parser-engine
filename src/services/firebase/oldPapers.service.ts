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
  return firestore()
    .collection(COLLECTIONS.OLD_PAPERS)
    .where('standard', '==', standard)
    .where('semester', '==', semester)
    .where('isDeleted', '==', false)
    .where('isActive', '==', true)
    .orderBy('year', 'desc')
    .onSnapshot(
      snapshot => {
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as OldPaper[];
        onData(items);
      },
      error => onError?.(error.message),
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
    let query: any = firestore()
      .collection(COLLECTIONS.OLD_PAPERS)
      .where('standard', '==', standard)
      .where('isDeleted', '==', false);

    if (semester) {
      query = query.where('semester', '==', semester);
    }

    const snapshot = await query.orderBy('year', 'desc').get();
    const items = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    })) as OldPaper[];

    return {success: true, data: items};
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}
