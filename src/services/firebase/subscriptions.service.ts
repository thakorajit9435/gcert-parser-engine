import firestore from '@react-native-firebase/firestore';
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { COLLECTIONS, DEFAULT_PAGE_SIZE } from '../../constants';
import {
    Subscription,
    SubscriptionPlanType,
    SubscriptionStatus,
    ServiceResult,
    PaginatedResult,
} from '../../types';

const subsRef = () => firestore().collection(COLLECTIONS.SUBSCRIPTIONS);

/**
 * Get paginated subscriptions.
 */
export async function getSubscriptions(
    pageSize: number = DEFAULT_PAGE_SIZE,
    startAfterDoc?: FirebaseFirestoreTypes.QueryDocumentSnapshot | null,
    statusFilter?: SubscriptionStatus,
): Promise<ServiceResult<PaginatedResult<Subscription>>> {
    try {
        let query: FirebaseFirestoreTypes.Query = subsRef().orderBy('createdAt', 'desc');

        if (statusFilter) {
            query = query.where('status', '==', statusFilter);
        }
        if (startAfterDoc) {
            query = query.startAfter(startAfterDoc);
        }

        query = query.limit(pageSize);
        const snapshot = await query.get();

        const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as Subscription[];

        const lastDoc = snapshot.docs[snapshot.docs.length - 1] ?? null;
        const hasMore = snapshot.docs.length === pageSize;

        return { success: true, data: { data, lastDoc, hasMore } };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

/**
 * Get subscriptions for a specific user.
 */
export async function getUserSubscriptions(
    userId: string,
): Promise<ServiceResult<Subscription[]>> {
    try {
        const snapshot = await subsRef()
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .get();

        const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as Subscription[];

        return { success: true, data };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

/**
 * Manually activate a subscription for a user.
 */
export async function manualActivateSubscription(
    userId: string,
    planType: SubscriptionPlanType,
    durationDays: number,
): Promise<ServiceResult<string>> {
    try {
        const now = new Date();
        const endDate = durationDays > 0
            ? new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000)
            : new Date('2099-12-31'); // Lifetime

        const batch = firestore().batch();

        // Create subscription doc
        const subRef = subsRef().doc();
        batch.set(subRef, {
            userId,
            planType,
            startDate: firestore.Timestamp.fromDate(now),
            endDate: firestore.Timestamp.fromDate(endDate),
            status: 'active' as SubscriptionStatus,
            razorpayPaymentId: null,
            razorpayOrderId: null,
            amount: 0,
            currency: 'INR',
            isManual: true,
            createdAt: firestore.FieldValue.serverTimestamp(),
            updatedAt: firestore.FieldValue.serverTimestamp(),
        });

        // Update user premium flag
        const userRef = firestore().collection(COLLECTIONS.USERS).doc(userId);
        batch.update(userRef, { premium: true });

        await batch.commit();
        return { success: true, data: subRef.id };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

/**
 * Cancel a subscription.
 */
export async function cancelSubscription(
    subscriptionId: string,
    userId: string,
): Promise<ServiceResult<void>> {
    try {
        const batch = firestore().batch();

        batch.update(subsRef().doc(subscriptionId), {
            status: 'cancelled' as SubscriptionStatus,
            updatedAt: firestore.FieldValue.serverTimestamp(),
        });

        // Check if user has other active subscriptions
        const otherActive = await subsRef()
            .where('userId', '==', userId)
            .where('status', '==', 'active')
            .get();

        // If cancelling the only active one, remove premium
        if (otherActive.docs.length <= 1) {
            batch.update(firestore().collection(COLLECTIONS.USERS).doc(userId), {
                premium: false,
            });
        }

        await batch.commit();
        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

/**
 * Get revenue summary (sum of amounts for active/completed subscriptions).
 */
export async function getRevenueSummary(): Promise<ServiceResult<number>> {
    try {
        const snapshot = await subsRef()
            .where('status', 'in', ['active', 'expired'])
            .get();

        let total = 0;
        snapshot.docs.forEach((doc) => {
            const data = doc.data();
            total += (data.amount as number) || 0;
        });

        return { success: true, data: total };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

/**
 * Check and expire subscriptions past their end date.
 * This is designed to be called periodically (cron-ready structure).
 */
export async function expireOldSubscriptions(): Promise<ServiceResult<number>> {
    try {
        const now = firestore.Timestamp.now();
        const snapshot = await subsRef()
            .where('status', '==', 'active')
            .where('endDate', '<', now)
            .get();

        if (snapshot.empty) {
            return { success: true, data: 0 };
        }

        const batch = firestore().batch();
        const affectedUserIds = new Set<string>();

        snapshot.docs.forEach((doc) => {
            batch.update(doc.ref, {
                status: 'expired' as SubscriptionStatus,
                updatedAt: firestore.FieldValue.serverTimestamp(),
            });
            const data = doc.data();
            affectedUserIds.add(data.userId as string);
        });

        // Update premium status for affected users
        for (const userId of affectedUserIds) {
            const remaining = await subsRef()
                .where('userId', '==', userId)
                .where('status', '==', 'active')
                .get();

            // Only the ones we're about to expire
            const stillActive = remaining.docs.filter(
                (doc) => !snapshot.docs.some((expired) => expired.id === doc.id),
            );

            if (stillActive.length === 0) {
                batch.update(firestore().collection(COLLECTIONS.USERS).doc(userId), {
                    premium: false,
                });
            }
        }

        await batch.commit();
        return { success: true, data: snapshot.docs.length };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}
