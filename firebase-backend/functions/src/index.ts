import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { getRazorpayClient, verifySignature } from './razorpay';

admin.initializeApp();

const db = admin.firestore();

// ────────────────────────────────────────────────────────────────
// RAZORPAY FUNCTIONS
// ────────────────────────────────────────────────────────────────

/**
 * Creates a Razorpay Order for a specified plan amount.
 */
export const createRazorpayOrder = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'User must be logged in to create a payment order.'
        );
    }

    const { amount, currency = 'INR', planType } = data;

    if (!amount || !planType) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Amount and planType are required.'
        );
    }

    try {
        const razorpay = getRazorpayClient();
        const options = {
            amount: Math.round(amount * 100),
            currency,
            receipt: `receipt_order_${context.auth.uid}_${Date.now()}`,
            notes: { userId: context.auth.uid, planType },
        };
        const order = await razorpay.orders.create(options);
        return { orderId: order.id, amount: order.amount, currency: order.currency };
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        throw new functions.https.HttpsError('internal', 'Failed to create payment order.');
    }
});

/**
 * Verifies Razorpay Payment and updates user premium status.
 */
export const verifyRazorpayPayment = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'User must be logged in to verify payment.'
        );
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planType, amount } = data;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !planType) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing payment verification details.');
    }

    const isValid = verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) {
        throw new functions.https.HttpsError('permission-denied', 'Invalid payment signature. Verification failed.');
    }

    const userId = context.auth.uid;

    try {
        const now = admin.firestore.Timestamp.now();
        let durationDays = 0;

        switch (planType) {
            case 'monthly': durationDays = 30; break;
            case 'quarterly': durationDays = 90; break;
            case 'yearly': durationDays = 365; break;
            case 'lifetime': durationDays = -1; break;
        }

        const endDate = durationDays > 0
            ? admin.firestore.Timestamp.fromMillis(now.toMillis() + durationDays * 24 * 60 * 60 * 1000)
            : admin.firestore.Timestamp.fromDate(new Date('2099-12-31'));

        const batch = db.batch();

        const subscriptionRef = db.collection('subscriptions').doc();
        batch.set(subscriptionRef, {
            userId,
            planType,
            startDate: now,
            endDate,
            status: 'active',
            razorpayPaymentId: razorpay_payment_id,
            razorpayOrderId: razorpay_order_id,
            amount,
            currency: 'INR',
            isManual: false,
            createdAt: now,
            updatedAt: now,
        });

        const userRef = db.collection('users').doc(userId);
        batch.update(userRef, {
            premium: true,
            isPremium: true,
            premiumPlan: planType,
            premiumActivatedAt: now,
            lastActiveAt: now,
        });

        await batch.commit();
        return { success: true, message: 'Premium access activated successfully.' };
    } catch (error) {
        console.error('Error updating premium status:', error);
        throw new functions.https.HttpsError(
            'internal',
            'Payment verified but failed to update user profile. Please contact support.'
        );
    }
});

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
export const sendPushNotification = functions.https.onCall(async (data, context) => {
    // ── Auth guard ──────────────────────────────────────────────
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'You must be logged in to send notifications.'
        );
    }

    // ── Admin role check ────────────────────────────────────────
    const callerDoc = await db.collection('users').doc(context.auth.uid).get();
    if (!callerDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Caller user not found.');
    }
    const callerRole: string = callerDoc.data()?.role ?? '';
    if (callerRole !== 'super_admin' && callerRole !== 'content_admin') {
        throw new functions.https.HttpsError(
            'permission-denied',
            'Only admins can send push notifications.'
        );
    }

    const { notificationId, title, message, targetType, targetStandard, targetUserId } = data;

    if (!title || !message || !targetType) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'title, message, and targetType are required.'
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
            query = db.collection('users').where(
                admin.firestore.FieldPath.documentId(),
                '==',
                targetUserId
            );
        }

        const usersSnapshot = await query.get();

        // ── Step 2: Collect FCM tokens ──────────────────────────
        const tokens: string[] = usersSnapshot.docs
            .map((doc) => doc.data()?.fcmToken as string | null | undefined)
            .filter((t): t is string => typeof t === 'string' && t.length > 0);

        // If no tokens, mark as sent and return early
        if (tokens.length === 0) {
            console.log(`[sendPushNotification] No valid tokens for targetType=${targetType}`);
            if (notificationId) {
                await db.collection('notifications').doc(notificationId).update({
                    isSent: true,
                    sentAt: admin.firestore.FieldValue.serverTimestamp(),
                    successCount: 0,
                    failureCount: 0,
                    recipientCount: 0,
                });
            }
            return { success: true, successCount: 0, failureCount: 0 };
        }

        // ── Step 3: Send in batches of 500 ─────────────────────
        let totalSuccess = 0;
        let totalFailure = 0;

        const basePayload: Omit<admin.messaging.MulticastMessage, 'tokens'> = {
            notification: { title, body: message },
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
                    aps: { sound: 'default', badge: 1 },
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
                        console.warn(`[FCM] Delivery failed — token[${i + idx}]: ${r.error?.message}`);
                    }
                });
            } catch (batchErr) {
                console.error(`[FCM] Batch ${Math.floor(i / FCM_BATCH_SIZE) + 1} error:`, batchErr);
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
            `[sendPushNotification] Done — success: ${totalSuccess}, failure: ${totalFailure}, total tokens: ${tokens.length}`
        );
        return { success: true, successCount: totalSuccess, failureCount: totalFailure };

    } catch (error) {
        console.error('[sendPushNotification] Fatal error:', error);
        throw new functions.https.HttpsError(
            'internal',
            'Failed to send push notification: ' + (error as Error).message
        );
    }
});
