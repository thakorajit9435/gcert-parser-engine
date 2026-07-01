import auth, {FirebaseAuthTypes} from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {COLLECTIONS} from '../../constants';
import {UserProfile, UserRole, ServiceResult} from '../../types';
import {logCrashError} from '../crashlytics';

/**
 * Sign in with phone number — sends OTP.
 */
export async function signInWithPhone(
  phoneNumber: string,
): Promise<ServiceResult<FirebaseAuthTypes.ConfirmationResult>> {
  try {
    const formattedPhone = phoneNumber.startsWith('+91')
      ? phoneNumber
      : `+91${phoneNumber}`;
    const confirmation = await auth().signInWithPhoneNumber(formattedPhone);
    return {success: true, data: confirmation};
  } catch (error) {
    logCrashError(error, 'auth_error', {
      action: 'signInWithPhone',
      phoneNumber,
    });
    return {success: false, error: (error as Error).message};
  }
}

/**
 * Verify OTP code.
 */
export async function verifyOTP(
  confirmationResult: FirebaseAuthTypes.ConfirmationResult,
  code: string,
): Promise<ServiceResult<FirebaseAuthTypes.UserCredential>> {
  try {
    const credential = await confirmationResult.confirm(code);
    if (!credential) {
      throw new Error('Verification failed.');
    }
    return {success: true, data: credential};
  } catch (error) {
    logCrashError(error, 'auth_error', {action: 'verifyOTP'});
    return {success: false, error: (error as Error).message};
  }
}

/**
 * Sign out the current user.
 */
export async function signOut(): Promise<ServiceResult<void>> {
  try {
    await auth().signOut();
    return {success: true};
  } catch (error) {
    logCrashError(error, 'auth_error', {action: 'signOut'});
    return {success: false, error: (error as Error).message};
  }
}

/**
 * Get the current Firebase user.
 */
export function getCurrentUser(): FirebaseAuthTypes.User | null {
  return auth().currentUser;
}

/**
 * Create or update user profile in Firestore after auth.
 */
export async function ensureUserProfile(
  uid: string,
  phone?: string,
): Promise<ServiceResult<UserProfile>> {
  try {
    const userRef = firestore().collection(COLLECTIONS.USERS).doc(uid);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      // Update last active
      await userRef.update({
        lastActiveAt: firestore.FieldValue.serverTimestamp(),
      });
      const data = userDoc.data() as UserProfile;
      return {success: true, data: {...data, uid}};
    }

    // Create new user profile
    const newUser: Omit<UserProfile, 'createdAt' | 'lastActiveAt'> & {
      createdAt: FirebaseFirestoreTypes.FieldValue;
      lastActiveAt: FirebaseFirestoreTypes.FieldValue;
    } = {
      uid,
      name: '',
      email: '',
      phone: phone ?? '',
      standard: 1,
      points: 0,
      premium: false,
      role: 'student' as UserRole,
      isBlocked: false,
      streak: 0,
      createdAt: firestore.FieldValue.serverTimestamp(),
      lastActiveAt: firestore.FieldValue.serverTimestamp(),
    };

    await userRef.set(newUser);
    const created = await userRef.get();
    return {success: true, data: created.data() as UserProfile};
  } catch (error) {
    logCrashError(error, 'auth_error', {action: 'ensureUserProfile', uid});
    return {success: false, error: (error as Error).message};
  }
}

/**
 * Subscribe to auth state changes.
 */
export function onAuthStateChanged(
  callback: (user: FirebaseAuthTypes.User | null) => void,
): () => void {
  return auth().onAuthStateChanged(callback);
}

// Re-export for type convenience
import {FirebaseFirestoreTypes} from '@react-native-firebase/firestore';
export type {FirebaseFirestoreTypes};
