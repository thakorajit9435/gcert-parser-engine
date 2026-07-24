import firestore from '@react-native-firebase/firestore';
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { ServiceResult, PaginatedResult } from '../../types';
import { BaseCMSModel } from '../../types/cms.types';

/**
 * Generic fetcher for CMS modules with search, filter, pagination and soft delete support.
 */
export async function getCMSItemsPaginated<T extends BaseCMSModel>(
  collectionName: string,
  pageSize: number,
  startAfterDoc?: FirebaseFirestoreTypes.QueryDocumentSnapshot | null,
  filters?: Array<{
    field: string;
    operator: FirebaseFirestoreTypes.WhereFilterOp;
    value: unknown;
  }>,
  searchText?: string,
  searchField?: string,
  includeDeleted: boolean = false
): Promise<ServiceResult<PaginatedResult<T>>> {
  try {
    let query: FirebaseFirestoreTypes.Query = firestore().collection(collectionName);

    // Apply basic filters
    if (filters) {
      for (const cond of filters) {
        if (cond.value !== undefined && cond.value !== null && cond.value !== '') {
          query = query.where(cond.field, cond.operator, cond.value);
        }
      }
    }

    // Apply soft delete filter unless requested otherwise
    if (!includeDeleted) {
      query = query.where('isDeleted', '==', false);
    }

    // Standard ordering key - typically order (ASC) or createdAt (DESC)
    // We order by updatedAt DESC to show the latest changes first
    query = query.orderBy('updatedAt', 'desc');

    if (startAfterDoc) {
      query = query.startAfter(startAfterDoc);
    }

    query = query.limit(pageSize);
    const snapshot = await query.get();

    let data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as T[];

    // In-memory search filter if Firestore native full-text isn't active
    if (searchText && searchField) {
      const lowerSearch = searchText.toLowerCase();
      data = data.filter(item => {
        const val = (item as any)[searchField];
        if (typeof val === 'string') {
          return val.toLowerCase().includes(lowerSearch);
        }
        return false;
      });
    }

    const lastDoc = snapshot.docs[snapshot.docs.length - 1] ?? null;
    const hasMore = snapshot.docs.length === pageSize;

    return { success: true, data: { data, lastDoc, hasMore } };
  } catch (error) {
    console.error(`CMS fetch error [${collectionName}]:`, error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Creates a new document in the specified collection.
 */
export async function createCMSItem<T extends BaseCMSModel>(
  collectionName: string,
  itemData: Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'created_by'>,
  userId: string,
  customDocId?: string
): Promise<ServiceResult<string>> {
  try {
    const timestamp = firestore.FieldValue.serverTimestamp();
    const docRef = customDocId
      ? firestore().collection(collectionName).doc(customDocId)
      : firestore().collection(collectionName).doc();

    await docRef.set({
      ...itemData,
      isDeleted: false,
      createdAt: timestamp,
      updatedAt: timestamp,
      created_by: userId,
    });

    return { success: true, data: docRef.id };
  } catch (error) {
    console.error(`CMS create error [${collectionName}]:`, error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Updates an existing document in the specified collection.
 */
export async function updateCMSItem<T extends BaseCMSModel>(
  collectionName: string,
  itemId: string,
  updates: Partial<Omit<T, 'id' | 'createdAt' | 'created_by'>>
): Promise<ServiceResult<void>> {
  try {
    const timestamp = firestore.FieldValue.serverTimestamp();
    await firestore()
      .collection(collectionName)
      .doc(itemId)
      .update({
        ...updates,
        updatedAt: timestamp,
      });

    return { success: true };
  } catch (error) {
    console.error(`CMS update error [${collectionName}]:`, error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Soft deletes a document by setting isDeleted to true.
 */
export async function softDeleteCMSItem(
  collectionName: string,
  itemId: string
): Promise<ServiceResult<void>> {
  try {
    const timestamp = firestore.FieldValue.serverTimestamp();
    await firestore()
      .collection(collectionName)
      .doc(itemId)
      .update({
        isDeleted: true,
        updatedAt: timestamp,
      });

    return { success: true };
  } catch (error) {
    console.error(`CMS soft delete error [${collectionName}]:`, error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Restores a soft-deleted document back to active status.
 */
export async function restoreCMSItem(
  collectionName: string,
  itemId: string
): Promise<ServiceResult<void>> {
  try {
    const timestamp = firestore.FieldValue.serverTimestamp();
    await firestore()
      .collection(collectionName)
      .doc(itemId)
      .update({
        isDeleted: false,
        updatedAt: timestamp,
      });

    return { success: true };
  } catch (error) {
    console.error(`CMS restore error [${collectionName}]:`, error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Perform a batch import of documents (e.g. Topics, Glossary, Questions) into Firestore.
 * Maximum 500 documents per batch.
 */
export async function bulkImportCMSItems<T extends BaseCMSModel>(
  collectionName: string,
  itemsList: Array<Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>>,
  userId: string
): Promise<ServiceResult<{ successCount: number; errorCount: number }>> {
  try {
    const timestamp = firestore.FieldValue.serverTimestamp();
    const collectionRef = firestore().collection(collectionName);

    let successCount = 0;
    let errorCount = 0;

    // Check batch sizes (Firestore limit is 500 writes per batch operation)
    const batches = [];
    let currentBatch = firestore().batch();
    let currentCount = 0;

    for (const item of itemsList) {
      const docRef = collectionRef.doc();
      currentBatch.set(docRef, {
        ...item,
        isDeleted: false,
        createdAt: timestamp,
        updatedAt: timestamp,
        created_by: userId,
      });

      currentCount++;
      if (currentCount === 500) {
        batches.push(currentBatch);
        currentBatch = firestore().batch();
        currentCount = 0;
      }
    }

    if (currentCount > 0) {
      batches.push(currentBatch);
    }

    // Execute all batches sequentially
    for (const b of batches) {
      await b.commit();
      successCount += 500;
    }

    // Correct count representing actual items imported
    successCount = itemsList.length;

    // Create an audit/import log document to record the operation details
    await firestore().collection('importLogs').add({
      import_type: 'bulk_cms_import',
      source_format: 'json',
      target_collection: collectionName,
      status: 'completed',
      total_records: itemsList.length,
      success_count: successCount,
      error_count: 0,
      skip_count: 0,
      initiated_by: userId,
      started_at: timestamp,
      completed_at: timestamp,
      created_at: timestamp,
    });

    return { success: true, data: { successCount, errorCount } };
  } catch (error) {
    console.error(`CMS bulk import error [${collectionName}]:`, error);
    return { success: false, error: (error as Error).message };
  }
}
