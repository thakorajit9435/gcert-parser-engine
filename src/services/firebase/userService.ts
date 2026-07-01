import firestore from '@react-native-firebase/firestore';
import {UserProfile, UserRole} from '../../types';

const USERS_COLLECTION = 'users';

/**
 * Creates a new student document in Firestore on signup.
 * Role is always 'student'; standard must be 1–12.
 */
export async function createStudentProfile(
  uid: string,
  name: string,
  email: string,
  standard: number,
): Promise<{success: boolean; data?: UserProfile; error?: string}> {
  try {
    const userRef = firestore().collection(USERS_COLLECTION).doc(uid);

    const newUser = {
      uid,
      name,
      email,
      standard,
      role: 'student' as UserRole,
      premium: false,
      isPremium: false,
      points: 0,
      isBlocked: false,
      streak: 0,
      createdAt: firestore.FieldValue.serverTimestamp(),
      lastActiveAt: firestore.FieldValue.serverTimestamp(),
    };

    await userRef.set(newUser);
    const created = await userRef.get();
    return {success: true, data: {uid, ...created.data()} as UserProfile};
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}

/**
 * Creates an admin (content_admin | super_admin) user document.
 * standard is always null for admin accounts.
 * Only callable after super_admin has created the Firebase auth account.
 */
export async function createAdminProfile(
  uid: string,
  name: string,
  email: string,
  role: 'content_admin' | 'super_admin',
): Promise<{success: boolean; data?: UserProfile; error?: string}> {
  try {
    const userRef = firestore().collection(USERS_COLLECTION).doc(uid);

    const newAdmin = {
      uid,
      name,
      email,
      standard: null,
      role,
      premium: false,
      isPremium: false,
      points: 0,
      isBlocked: false,
      streak: 0,
      createdAt: firestore.FieldValue.serverTimestamp(),
      lastActiveAt: firestore.FieldValue.serverTimestamp(),
    };

    await userRef.set(newAdmin);
    const created = await userRef.get();
    return {success: true, data: {uid, ...created.data()} as UserProfile};
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}

/**
 * Get user profile by UID.
 *
 * @param options.source  Pass `'cache'` to read from the local Firestore
 *                        cache only (useful as a fallback when the server
 *                        is unreachable or the initial fetch timed out).
 */
export async function getUserProfile(
  uid: string,
  options?: {source?: 'default' | 'cache'},
): Promise<{success: boolean; data?: UserProfile; error?: string}> {
  try {
    const getOptions =
      options?.source === 'cache' ? {source: 'cache' as const} : undefined;
    const doc = await firestore()
      .collection(USERS_COLLECTION)
      .doc(uid)
      .get(getOptions);
    if (!doc.exists) {
      return {success: false, error: 'User not found'};
    }
    return {success: true, data: {uid, ...doc.data()} as UserProfile};
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}

/**
 * Create or fetch a student profile for Google Sign-In.
 *
 * - Document does NOT exist  → creates with standard = null
 * - Document already exists  → returns it unchanged (no overwrite)
 *
 * @returns isNewUser true when a new document was just created
 */
export async function createGoogleStudentProfile(
  uid: string,
  name: string,
  email: string,
): Promise<{
  success: boolean;
  data?: UserProfile;
  isNewUser?: boolean;
  error?: string;
}> {
  try {
    const userRef = firestore().collection(USERS_COLLECTION).doc(uid);
    const existing = await userRef.get();

    if (existing.exists) {
      return {
        success: true,
        data: {uid, ...existing.data()} as UserProfile,
        isNewUser: false,
      };
    }

    // Fallback name if Google did not return one
    const safeName = name?.trim() || 'Student';

    const newUser = {
      uid,
      name: safeName,
      email,
      standard: null,
      role: 'student' as UserRole,
      premium: false,
      isPremium: false,
      points: 0,
      isBlocked: false,
      streak: 0,
      createdAt: firestore.FieldValue.serverTimestamp(),
      lastActiveAt: firestore.FieldValue.serverTimestamp(),
    };

    await userRef.set(newUser);
    const created = await userRef.get();
    return {
      success: true,
      data: {uid, ...created.data()} as UserProfile,
      isNewUser: true,
    };
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}
