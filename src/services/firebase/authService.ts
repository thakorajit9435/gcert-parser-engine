import auth, {FirebaseAuthTypes} from '@react-native-firebase/auth';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';

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
    return {success: false, error: (error as Error).message};
  }
}

/**
 * Sign out the current user.
 */
export async function logoutUser(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await auth().signOut();
    return {success: true};
  } catch (error) {
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

/**
 * Send a Firebase email-verification link to the currently signed-in user.
 */
export async function sendVerificationEmail(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const currentUser = auth().currentUser;
    if (!currentUser) return {success: false, error: 'No user signed in.'};
    await currentUser.sendEmailVerification();
    return {success: true};
  } catch (error) {
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
    if (!currentUser) return {success: false, error: 'No user signed in.'};
    await currentUser.reload();
    return {
      success: true,
      emailVerified: auth().currentUser?.emailVerified ?? false,
    };
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}

/**
 * Sign in with Google via Firebase Authentication.
 * Throws a structured error code for cancelled sign-in.
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
