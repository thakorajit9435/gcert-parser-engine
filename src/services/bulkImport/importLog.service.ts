/**
 * importLog.service.ts
 * Saves import history to the `importLogs` Firestore collection.
 * This is an ADDITIVE-ONLY collection — does not touch any existing schema.
 */

import firestore from '@react-native-firebase/firestore';
import { COLLECTIONS } from '../../constants';

export interface ImportLogPayload {
  fileName: string;
  type: 'subject' | 'chapter';
  totalRows: number;
  successRows: number;
  skippedRows: number;
  failedRows: number;
  createdBy: string;
}

export interface ImportLog extends ImportLogPayload {
  id: string;
  createdAt: any;
}

/**
 * Save a new import log entry.
 */
export async function saveImportLog(payload: ImportLogPayload): Promise<void> {
  await firestore()
    .collection(COLLECTIONS.IMPORT_LOGS)
    .add({
      ...payload,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });
}

/**
 * Fetch the most recent import logs (last 20).
 */
export async function fetchImportLogs(
  type?: 'subject' | 'chapter',
): Promise<ImportLog[]> {
  let query: any = firestore()
    .collection(COLLECTIONS.IMPORT_LOGS)
    .orderBy('createdAt', 'desc')
    .limit(20);

  if (type) {
    query = firestore()
      .collection(COLLECTIONS.IMPORT_LOGS)
      .where('type', '==', type)
      .orderBy('createdAt', 'desc')
      .limit(20);
  }

  const snapshot = await query.get();
  return snapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data(),
  })) as ImportLog[];
}
