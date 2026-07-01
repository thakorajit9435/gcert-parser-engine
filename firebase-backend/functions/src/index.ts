import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();

// ────────────────────────────────────────────────────────────────
// PUSH NOTIFICATION FUNCTION
// ────────────────────────────────────────────────────────────────

const FCM_BATCH_SIZE = 500; // FCM multicast max per call

/**
 * sendPushNotification
 *
 * Callable Cloud Function triggered by the admin when creating a notification.
 *
 * Flow:
 *   1. Authenticate caller (must be admin role)
 *   2. Fetch target users from Firestore based on targetType:
 *        'all'        → all students
 *        'standard'   → students where standard == targetStandard
 *        'individual' → single student by targetUserId
 *   3. Collect valid (non-null) FCM tokens
 *   4. Send via admin.messaging().sendEachForMulticast() in batches of 500
 *   5. Mark notification doc as isSent=true + store delivery counts
 */
export const sendPushNotification = functions.https.onCall(
  async (data, context) => {
    // ── Auth guard ──────────────────────────────────────────────
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be logged in to send notifications.',
      );
    }

    // ── Admin role check ────────────────────────────────────────
    const callerDoc = await db.collection('users').doc(context.auth.uid).get();
    if (!callerDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'Caller user not found.',
      );
    }
    const callerRole: string = callerDoc.data()?.role ?? '';
    if (callerRole !== 'super_admin' && callerRole !== 'content_admin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only admins can send push notifications.',
      );
    }

    const {
      notificationId,
      title,
      message,
      targetType,
      targetStandard,
      targetUserId,
    } = data;

    if (!title || !message || !targetType) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'title, message, and targetType are required.',
      );
    }

    try {
      // ── Step 1: Build Firestore query based on target type ──
      let query: FirebaseFirestore.Query = db
        .collection('users')
        .where('role', '==', 'student');

      if (targetType === 'standard' && targetStandard != null) {
        query = query.where('standard', '==', targetStandard);
      } else if (targetType === 'individual' && targetUserId) {
        // For individual, we just get the one user doc
        query = db
          .collection('users')
          .where(admin.firestore.FieldPath.documentId(), '==', targetUserId);
      }

      const usersSnapshot = await query.get();

      // ── Step 2: Collect FCM tokens ──────────────────────────
      const tokens: string[] = usersSnapshot.docs
        .map(doc => doc.data()?.fcmToken as string | null | undefined)
        .filter((t): t is string => typeof t === 'string' && t.length > 0);

      // If no tokens, mark as sent and return early
      if (tokens.length === 0) {
        console.log(
          `[sendPushNotification] No valid tokens for targetType=${targetType}`,
        );
        if (notificationId) {
          await db.collection('notifications').doc(notificationId).update({
            isSent: true,
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
            successCount: 0,
            failureCount: 0,
            recipientCount: 0,
          });
        }
        return {success: true, successCount: 0, failureCount: 0};
      }

      // ── Step 3: Send in batches of 500 ─────────────────────
      let totalSuccess = 0;
      let totalFailure = 0;

      const basePayload: Omit<admin.messaging.MulticastMessage, 'tokens'> = {
        notification: {title, body: message},
        data: {
          notificationId: notificationId ?? '',
          targetType: String(targetType),
          screen: 'Notifications',
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'default',
          },
        },
        apns: {
          payload: {
            aps: {sound: 'default', badge: 1},
          },
        },
      };

      for (let i = 0; i < tokens.length; i += FCM_BATCH_SIZE) {
        const batchTokens = tokens.slice(i, i + FCM_BATCH_SIZE);
        try {
          const response = await admin.messaging().sendEachForMulticast({
            ...basePayload,
            tokens: batchTokens,
          });
          totalSuccess += response.successCount;
          totalFailure += response.failureCount;

          // Log per-token failures for debugging
          response.responses.forEach((r, idx) => {
            if (!r.success) {
              console.warn(
                `[FCM] Delivery failed — token[${i + idx}]: ${
                  r.error?.message
                }`,
              );
            }
          });
        } catch (batchErr) {
          console.error(
            `[FCM] Batch ${Math.floor(i / FCM_BATCH_SIZE) + 1} error:`,
            batchErr,
          );
          totalFailure += batchTokens.length;
        }
      }

      // ── Step 4: Update Firestore notification status ────────
      if (notificationId) {
        await db.collection('notifications').doc(notificationId).update({
          isSent: true,
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
          successCount: totalSuccess,
          failureCount: totalFailure,
          recipientCount: tokens.length,
        });
      }

      console.log(
        `[sendPushNotification] Done — success: ${totalSuccess}, failure: ${totalFailure}, total tokens: ${tokens.length}`,
      );
      return {
        success: true,
        successCount: totalSuccess,
        failureCount: totalFailure,
      };
    } catch (error) {
      console.error('[sendPushNotification] Fatal error:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to send push notification: ' + (error as Error).message,
      );
    }
  },
);
