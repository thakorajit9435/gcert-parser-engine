import auth, {FirebaseAuthTypes} from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import {COLLECTIONS} from '../../constants';
import {UserProfile, UserRole, ServiceResult} from '../../types';
import {logCrashError} from '../crashlytics';

/**
 * Sign in with email and password.
 */
export async function loginWithEmail(
  email: string,
  password: string,
): Promise<{
  success: boolean;
  data?: FirebaseAuthTypes.UserCredential;
  error?: string;
}> {
  try {
    const credential = await auth().signInWithEmailAndPassword(email, password);
    return {success: true, data: credential};
  } catch (error) {
    logCrashError(error, 'auth_error', {action: 'loginWithEmail', email});
    return {success: false, error: (error as Error).message};
  }
}

/**
 * Sign up with email and password.
 */
export async function signupWithEmail(
  email: string,
  password: string,
): Promise<{
  success: boolean;
  data?: FirebaseAuthTypes.UserCredential;
  error?: string;
}> {
  try {
    const credential = await auth().createUserWithEmailAndPassword(
      email,
      password,
    );
    return {success: true, data: credential};
  } catch (error) {
    logCrashError(error, 'auth_error', {action: 'signupWithEmail', email});
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
 * Sign out user alias (compatible with duplicate authService.ts)
 */
export async function logoutUser(): Promise<{
  success: boolean;
  error?: string;
}> {
  const result = await signOut();
  return {success: result.success, error: result.error};
}

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
 * Get the current Firebase user.
 */
export function getCurrentUser(): FirebaseAuthTypes.User | null {
  return auth().currentUser;
}

/**
 * Send a Firebase email-verification link to the currently signed-in user.
 */
export async function sendVerificationEmail(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      return {success: false, error: 'No user signed in.'};
    }
    await currentUser.sendEmailVerification();
    return {success: true};
  } catch (error) {
    logCrashError(error, 'auth_error', {action: 'sendVerificationEmail'});
    return {success: false, error: (error as Error).message};
  }
}

/**
 * Reload the current Firebase user and return the latest emailVerified value.
 */
export async function reloadCurrentUser(): Promise<{
  success: boolean;
  emailVerified?: boolean;
  error?: string;
}> {
  try {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      return {success: false, error: 'No user signed in.'};
    }
    await currentUser.reload();
    return {
      success: true,
      emailVerified: auth().currentUser?.emailVerified ?? false,
    };
  } catch (error) {
    logCrashError(error, 'auth_error', {action: 'reloadCurrentUser'});
    return {success: false, error: (error as Error).message};
  }
}

/**
 * Sign in with Google via Firebase Authentication.
 */
export async function signInWithGoogle(): Promise<{
  success: boolean;
  data?: FirebaseAuthTypes.UserCredential;
  error?: string;
  cancelled?: boolean;
}> {
  try {
    // Ensure Google Play Services are available (Android)
    await GoogleSignin.hasPlayServices({showPlayServicesUpdateDialog: true});

    const signInResult = await GoogleSignin.signIn();

    // v14+ returns { data: { idToken } }, older versions return { idToken } directly
    const idToken =
      (signInResult as any)?.data?.idToken ?? (signInResult as any)?.idToken;

    if (!idToken) {
      return {
        success: false,
        error: 'Google Sign-In failed: no ID token received.',
      };
    }

    const googleCredential = auth.GoogleAuthProvider.credential(idToken);
    const credential = await auth().signInWithCredential(googleCredential);
    return {success: true, data: credential};
  } catch (error: any) {
    logCrashError(error, 'auth_error', {action: 'signInWithGoogle'});
    if (
      error?.code === statusCodes.SIGN_IN_CANCELLED ||
      error?.code === 'SIGN_IN_CANCELLED'
    ) {
      return {success: false, cancelled: true, error: 'Sign-in cancelled.'};
    }
    if (error?.code === statusCodes.IN_PROGRESS) {
      return {success: false, error: 'Google Sign-In is already in progress.'};
    }
    return {
      success: false,
      error: (error as Error).message ?? 'Google Sign-In failed.',
    };
  }
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
