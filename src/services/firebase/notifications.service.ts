/**
 * Notifications Service
 *
 * Admin side:  create, list (paginated), mark sent
 * Student side: real-time subscription, mark read, paginated fetch
 */

import firestore from '@react-native-firebase/firestore';
import {FirebaseFirestoreTypes} from '@react-native-firebase/firestore';
import functions from '@react-native-firebase/functions';
import {COLLECTIONS, DEFAULT_PAGE_SIZE} from '../../constants';
import {
  AppNotification,
  NotificationTargetType,
  ServiceResult,
  PaginatedResult,
} from '../../types';

const notifRef = () => firestore().collection(COLLECTIONS.NOTIFICATIONS);

// ────────────────────────────────────────────────────────────────
// ADMIN — List & Create
// ────────────────────────────────────────────────────────────────

/**
 * Get paginated notifications (admin view — all notifications).
 */
export async function getNotifications(
  pageSize: number = DEFAULT_PAGE_SIZE,
  startAfterDoc?: FirebaseFirestoreTypes.QueryDocumentSnapshot | null,
): Promise<ServiceResult<PaginatedResult<AppNotification>>> {
  try {
    let query: FirebaseFirestoreTypes.Query = notifRef().orderBy(
      'createdAt',
      'desc',
    );

    if (startAfterDoc) {
      query = query.startAfter(startAfterDoc);
    }

    query = query.limit(pageSize);
    const snapshot = await query.get();

    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as AppNotification[];

    const lastDoc = snapshot.docs[snapshot.docs.length - 1] ?? null;
    const hasMore = snapshot.docs.length === pageSize;

    return {success: true, data: {data, lastDoc, hasMore}};
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}

/**
 * Create a notification in Firestore and trigger the Cloud Function
 * to send FCM push notifications to target devices.
 *
 * @returns the new notification document ID
 */
export async function createAndSendNotification(params: {
  title: string;
  message: string;
  targetType: NotificationTargetType;
  targetStandard?: number | null;
  targetUserId?: string | null;
  createdBy: string;
}): Promise<ServiceResult<string>> {
  try {
    // 1. Write notification to Firestore first
    const docRef = await notifRef().add({
      title: params.title,
      message: params.message,
      targetType: params.targetType,
      targetStandard: params.targetStandard ?? null,
      targetUserId: params.targetUserId ?? null,
      isSent: false,
      sentAt: null,
      createdAt: firestore.FieldValue.serverTimestamp(),
      createdBy: params.createdBy,
    });

    // 2. Call Cloud Function to send FCM push notification
    try {
      const sendFn = functions().httpsCallable('sendPushNotification');
      await sendFn({
        notificationId: docRef.id,
        title: params.title,
        message: params.message,
        targetType: params.targetType,
        targetStandard: params.targetStandard ?? null,
        targetUserId: params.targetUserId ?? null,
      });
    } catch (fnError) {
      // Non-fatal: notification is saved, push delivery failed
      console.warn('[Notifications] Cloud Function failed:', fnError);
    }

    return {success: true, data: docRef.id};
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}

/**
 * Legacy createNotification — kept for backward compatibility with existing
 * NotificationsScreen calls that haven't been migrated yet.
 * @deprecated use createAndSendNotification
 */
export async function createNotification(params: {
  title: string;
  titleGu?: string;
  message: string;
  messageGu?: string;
  targetType: NotificationTargetType;
  targetStandard?: number;
  createdBy: string;
}): Promise<ServiceResult<string>> {
  return createAndSendNotification({
    title: params.title,
    message: params.message,
    targetType: params.targetType,
    targetStandard: params.targetStandard ?? null,
    targetUserId: null,
    createdBy: params.createdBy,
  });
}

/**
 * Mark a notification as sent (called by Cloud Function after delivery).
 */
export async function markNotificationSent(
  notificationId: string,
): Promise<ServiceResult<void>> {
  try {
    await notifRef().doc(notificationId).update({
      isSent: true,
      sentAt: firestore.FieldValue.serverTimestamp(),
    });
    return {success: true};
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}

/**
 * Delete a notification.
 */
export async function deleteNotification(
  notificationId: string,
): Promise<ServiceResult<void>> {
  try {
    await notifRef().doc(notificationId).delete();
    return {success: true};
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}

// ────────────────────────────────────────────────────────────────
// STUDENT — Inbox (real-time + paginated)
// ────────────────────────────────────────────────────────────────

/**
 * Real-time subscription to notifications relevant to a student.
 * Matches:
 *   - targetType = 'all'
 *   - targetType = 'standard' AND targetStandard = student's standard
 *   - targetType = 'individual' AND targetUserId = student's uid
 *   - targetType = 'premium' (for future use)
 *
 * Because Firestore requires a single composite query, we fetch
 * all notifications and filter client-side (collection is small).
 *
 * @param uid      student's Firebase uid
 * @param standard student's standard number
 * @param callback called with the latest relevant notifications on every change
 * @returns unsubscribe function
 */
export function subscribeToUserNotifications(
  uid: string,
  standard: number | null,
  callback: (notifications: AppNotification[]) => void,
): () => void {
  return notifRef()
    .orderBy('createdAt', 'desc')
    .limit(50)
    .onSnapshot(
      snapshot => {
        const all = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as AppNotification[];

        // Client-side filter: show notifications relevant to this student
        const relevant = all.filter(n => {
          if (n.targetType === 'all') return true;
          if (n.targetType === 'standard' && n.targetStandard === standard)
            return true;
          if (n.targetType === 'individual' && (n as any).targetUserId === uid)
            return true;
          return false;
        });

        callback(relevant);
      },
      error => {
        console.warn('[Notifications] onSnapshot error:', error);
        callback([]);
      },
    );
}

/**
 * Mark a notification as read for a specific user.
 * Stored in a sub-collection: notifications/{notifId}/reads/{uid}
 * This avoids modifying the shared notification document.
 */
export async function markNotificationRead(
  notificationId: string,
  uid: string,
): Promise<ServiceResult<void>> {
  try {
    await notifRef()
      .doc(notificationId)
      .collection('reads')
      .doc(uid)
      .set({readAt: firestore.FieldValue.serverTimestamp()});
    return {success: true};
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}

/**
 * Get set of notification IDs that this user has already read.
 * Used to compute unread count and per-item read state.
 */
export function subscribeToReadStatus(
  uid: string,
  notificationIds: string[],
  callback: (readIds: Set<string>) => void,
): () => void {
  if (notificationIds.length === 0) {
    callback(new Set());
    return () => {};
  }

  // We subscribe to each read doc individually (small set, efficient)
  const unsubs: Array<() => void> = [];
  const readSet = new Set<string>();

  notificationIds.forEach(notifId => {
    const unsub = notifRef()
      .doc(notifId)
      .collection('reads')
      .doc(uid)
      .onSnapshot(doc => {
        if (doc && doc.exists) {
          readSet.add(notifId);
        } else {
          readSet.delete(notifId);
        }
        callback(new Set(readSet));
      });
    unsubs.push(unsub);
  });

  return () => unsubs.forEach(u => u());
}
