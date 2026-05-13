import firestore from '@react-native-firebase/firestore';
import { COLLECTIONS } from '../../constants';
import { AuditAction, AuditLog, ServiceResult, PaginatedResult } from '../../types';
import { DEFAULT_PAGE_SIZE } from '../../constants';
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

const auditRef = () => firestore().collection(COLLECTIONS.AUDIT_LOGS);

/**
 * Log an admin action to the audit trail.
 */
export async function logAuditAction(params: {
    action: AuditAction;
    performedBy: string;
    performedByName?: string;
    targetId?: string;
    targetType?: string;
    metadata?: Record<string, unknown>;
}): Promise<ServiceResult<void>> {
    try {
        await auditRef().add({
            action: params.action,
            performedBy: params.performedBy,
            performedByName: params.performedByName ?? '',
            targetId: params.targetId ?? '',
            targetType: params.targetType ?? '',
            metadata: params.metadata ?? {},
            timestamp: firestore.FieldValue.serverTimestamp(),
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

/**
 * Get paginated audit logs.
 */
export async function getAuditLogs(
    pageSize: number = DEFAULT_PAGE_SIZE,
    startAfterDoc?: FirebaseFirestoreTypes.QueryDocumentSnapshot | null,
    actionFilter?: AuditAction,
    performedByFilter?: string,
): Promise<ServiceResult<PaginatedResult<AuditLog>>> {
    try {
        let query: FirebaseFirestoreTypes.Query = auditRef().orderBy('timestamp', 'desc');

        if (actionFilter) {
            query = query.where('action', '==', actionFilter);
        }
        if (performedByFilter) {
            query = query.where('performedBy', '==', performedByFilter);
        }
        if (startAfterDoc) {
            query = query.startAfter(startAfterDoc);
        }

        query = query.limit(pageSize);
        const snapshot = await query.get();

        const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as AuditLog[];

        const lastDoc = snapshot.docs[snapshot.docs.length - 1] ?? null;
        const hasMore = snapshot.docs.length === pageSize;

        return { success: true, data: { data, lastDoc, hasMore } };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}
