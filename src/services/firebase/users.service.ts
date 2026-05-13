import firestore from '@react-native-firebase/firestore';
import {COLLECTIONS, DEFAULT_PAGE_SIZE} from '../../constants';
import {
  UserProfile,
  UserUpdatePayload,
  UserRole,
  ServiceResult,
  PaginatedResult,
} from '../../types';

const usersRef = () => firestore().collection(COLLECTIONS.USERS);

/**
 * Get user profile by UID.
 */
export async function getUserById(
  uid: string,
): Promise<ServiceResult<UserProfile>> {
  try {
    const doc = await usersRef().doc(uid).get();
    if (!doc.exists) {
      return {success: false, error: 'User not found.'};
    }
    return {success: true, data: {uid, ...doc.data()} as UserProfile};
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}

/**
 * Subscribe to user profile changes.
 */
export function subscribeToUser(
  uid: string,
  callback: (user: UserProfile | null) => void,
): () => void {
  return usersRef()
    .doc(uid)
    .onSnapshot(
      doc => {
        if (doc.exists) {
          callback({uid, ...doc.data()} as UserProfile);
        } else {
          callback(null);
        }
      },
      _error => {
        callback(null);
      },
    );
}

/**
 * Get paginated list of users.
 */
export async function getUsers(
  pageSize: number = DEFAULT_PAGE_SIZE,
  startAfterDoc?: FirebaseFirestoreTypes.QueryDocumentSnapshot | null,
  searchQuery?: string,
  filterRole?: UserRole,
  filterStandard?: number,
): Promise<ServiceResult<PaginatedResult<UserProfile>>> {
  try {
    let query: FirebaseFirestoreTypes.Query = usersRef().orderBy(
      'createdAt',
      'desc',
    );

    if (filterRole) {
      query = query.where('role', '==', filterRole);
    }
    if (filterStandard) {
      query = query.where('standard', '==', filterStandard);
    }
    if (startAfterDoc) {
      query = query.startAfter(startAfterDoc);
    }

    query = query.limit(pageSize);

    const snapshot = await query.get();
    let users = snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data(),
    })) as UserProfile[];

    // Client-side search (for name/phone; Firestore doesn't support full-text search)
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      users = users.filter(
        u =>
          u.name.toLowerCase().includes(lowerQuery) ||
          (u.phone && u.phone.includes(searchQuery)),
      );
    }

    const lastDoc = snapshot.docs[snapshot.docs.length - 1] ?? null;
    const hasMore = snapshot.docs.length === pageSize;

    return {
      success: true,
      data: {data: users, lastDoc, hasMore},
    };
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}

/**
 * Update user profile.
 */
export async function updateUser(
  uid: string,
  payload: UserUpdatePayload,
): Promise<ServiceResult<void>> {
  try {
    await usersRef()
      .doc(uid)
      .update({
        ...payload,
        lastActiveAt: firestore.FieldValue.serverTimestamp(),
      });
    return {success: true};
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}

/**
 * Block or unblock a user.
 */
export async function setUserBlocked(
  uid: string,
  isBlocked: boolean,
): Promise<ServiceResult<void>> {
  try {
    await usersRef().doc(uid).update({isBlocked});
    return {success: true};
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}

/**
 * Change user role. Only super_admin should call this.
 */
export async function changeUserRole(
  uid: string,
  newRole: UserRole,
): Promise<ServiceResult<void>> {
  try {
    await usersRef().doc(uid).update({role: newRole});
    return {success: true};
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}

/**
 * Adjust user points.
 */
export async function adjustUserPoints(
  uid: string,
  pointsDelta: number,
): Promise<ServiceResult<void>> {
  try {
    await usersRef()
      .doc(uid)
      .update({
        points: firestore.FieldValue.increment(pointsDelta),
      });
    return {success: true};
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}

/**
 * Get total user count.
 */
export async function getTotalUserCount(): Promise<number> {
  try {
    const snapshot = await usersRef().count().get();
    return snapshot.data().count;
  } catch {
    return 0;
  }
}

/**
 * Get premium user count.
 */
export async function getPremiumUserCount(): Promise<number> {
  try {
    const snapshot = await usersRef()
      .where('premium', '==', true)
      .count()
      .get();
    return snapshot.data().count;
  } catch {
    return 0;
  }
}

/**
 * Get users active today.
 */
export async function getActiveUsersTodayCount(): Promise<number> {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const snapshot = await usersRef()
      .where('lastActiveAt', '>=', firestore.Timestamp.fromDate(startOfToday))
      .count()
      .get();
    return snapshot.data().count;
  } catch {
    return 0;
  }
}

/**
 * Get top performers for leaderboard.
 */
export async function getLeaderboard(
  limit: number = 50,
  standardFilter?: number,
): Promise<ServiceResult<UserProfile[]>> {
  try {
    let query: FirebaseFirestoreTypes.Query = usersRef()
      .orderBy('points', 'desc')
      .limit(limit);

    if (standardFilter) {
      query = query.where('standard', '==', standardFilter);
    }

    const snapshot = await query.get();
    const users = snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data(),
    })) as UserProfile[];

    return {success: true, data: users};
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}

/**
 * Reset all user points (leaderboard reset).
 */
export async function resetAllPoints(): Promise<ServiceResult<void>> {
  try {
    const batch = firestore().batch();
    const snapshot = await usersRef().get();

    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, {points: 0});
    });

    await batch.commit();
    return {success: true};
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}

/**
 * Get count of non-student users (content_admin + super_admin).
 */
export async function getAdminCount(): Promise<number> {
  try {
    const snapshot = await usersRef()
      .where('role', '!=', 'student')
      .count()
      .get();
    return snapshot.data().count;
  } catch {
    return 0;
  }
}

// Re-export Firestore types
import {FirebaseFirestoreTypes} from '@react-native-firebase/firestore';
export type {FirebaseFirestoreTypes};
