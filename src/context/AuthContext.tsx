import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { UserProfile, UserRole } from '../types';
import { onAuthStateChanged, loginWithEmail, signupWithEmail, logoutUser, signInWithGoogle, sendVerificationEmail as firebaseSendVerificationEmail, reloadCurrentUser } from '../services/firebase/authService';
import { getUserProfile, createStudentProfile, createAdminProfile, createGoogleStudentProfile } from '../services/firebase/userService';
import { subscribeToUser } from '../services/firebase/users.service';
import { removeFCMToken } from '../services/firebase/fcm.service';

// ─── Types ─────────────────────────────────────────────────────

export interface AuthContextType {
    /** Firebase auth user */
    user: FirebaseAuthTypes.User | null;
    /** Firestore user document */
    userData: UserProfile | null;
    /** Current user role — read from Firestore only (never trust client-supplied value) */
    role: UserRole | null;
    /** True while auth state or Firestore profile are loading */
    loading: boolean;
    /** True when user is authenticated AND profile loaded */
    isAuthenticated: boolean;
    /** Alias of loading */
    isLoading: boolean;
    /** Whether the user account is blocked */
    isBlocked: boolean;

    // ── Auth Functions ───────────────────────────────────────────
    /**
     * Sign in with email/password and load Firestore profile.
     * Navigation is handled by RootNavigator based on role.
     */
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;

    /**
     * Register a new student account.
     * Creates Firebase auth user + student Firestore document.
     * @param standard must be 1–12
     */
    signupStudent: (
        email: string,
        password: string,
        name: string,
        standard: number,
    ) => Promise<{ success: boolean; error?: string }>;

    /**
     * @deprecated Use signupStudent instead.
     */
    signup: (
        email: string,
        password: string,
        name: string,
        standard: number,
    ) => Promise<{ success: boolean; error?: string }>;

    /**
     * Create an admin account. Only callable when the current user is super_admin.
     *
     * Security: uses a secondary Firebase app instance so the super_admin session
     * is NOT disturbed when creating the new auth account.
     */
    createAdmin: (
        email: string,
        password: string,
        name: string,
        role: 'content_admin' | 'super_admin',
    ) => Promise<{ success: boolean; error?: string }>;

    /** Sign out the current user and clear local state. */
    logout: () => Promise<{ success: boolean; error?: string }>;
    /** @deprecated alias of logout */
    signOut: () => Promise<{ success: boolean; error?: string }>;
    /** @deprecated alias of userData */
    userProfile: UserProfile | null;

    /**
     * Sign in with Google.
     * Creates a Firestore student document if the user is new.
     * Navigation is handled automatically by RootNavigator.
     */
    loginWithGoogle: () => Promise<{ success: boolean; cancelled?: boolean; error?: string }>;

    // ── Email Verification ───────────────────────────────────────
    /** True when the Firebase user has clicked the verification link */
    isEmailVerified: boolean;
    /**
     * Send (or resend) a Firebase email verification link to the current user.
     */
    sendVerificationEmail: () => Promise<{ success: boolean; error?: string }>;
    /**
     * Reload Firebase user and return the latest emailVerified status.
     * Call this when the user taps "I've Verified".
     */
    checkEmailVerification: () => Promise<{ verified: boolean; error?: string }>;
}


// ─── Context ───────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ──────────────────────────────────────────────────

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): React.JSX.Element {
    const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
    const [userData, setUserData] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [isEmailVerified, setIsEmailVerified] = useState<boolean>(false);

    // Keep a ref so createAdmin can reference the current super_admin uid
    const currentUserRef = useRef<FirebaseAuthTypes.User | null>(null);

    // ── Configure Google Sign-In once ────────────────────────────
    useEffect(() => {
        GoogleSignin.configure({
            // Replace with your Web Client ID from Firebase Console:
            // Authentication → Sign-in method → Google → Web client ID
            webClientId: '848086296881-e9g5k5vmvanp3d08ntd3f1l1e5v5kton.apps.googleusercontent.com',
            offlineAccess: false,
        });
    }, []);

    // ── Auth State Listener ──────────────────────────────────────
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(async (firebaseUser) => {
            currentUserRef.current = firebaseUser;
            setUser(firebaseUser);

            if (!firebaseUser) {
                setUserData(null);
                setIsEmailVerified(false);
                setLoading(false);
                return;
            }

            // Reload the user from the Firebase server so we always get the
            // latest emailVerified value — this handles the case where a user
            // verifies their email outside the app and then reopens it.
            try {
                await firebaseUser.reload();
            } catch {
                // Ignore network errors — fall back to cached value
            }
            // Re-read after reload (currentUser is updated in place)
            const freshUser = auth().currentUser;
            const verified = freshUser?.emailVerified ?? firebaseUser.emailVerified;
            setIsEmailVerified(verified);

            // Fetch profile from Firestore — role comes from here only
            const result = await getUserProfile(firebaseUser.uid);
            if (result.success && result.data) {
                setUserData(result.data);
            }

            setLoading(false);
        });

        return () => unsubscribeAuth();
    }, []);

    // ── Real-time Firestore Profile Updates ──────────────────────
    useEffect(() => {
        if (!user) return;

        const unsubscribeProfile = subscribeToUser(user.uid, (profile) => {
            if (profile) {
                setUserData(profile);
            }
        });

        return () => unsubscribeProfile();
    }, [user?.uid]);

    // ── login ────────────────────────────────────────────────────
    const login = async (
        email: string,
        password: string,
    ): Promise<{ success: boolean; error?: string }> => {
        setLoading(true);
        const result = await loginWithEmail(email, password);
        if (result.success && result.data?.user) {
            const loggedInUser = result.data.user;

            // Explicitly set isEmailVerified immediately after login so
            // RootNavigator shows VerifyEmailScreen without any flash.
            // onAuthStateChanged will also fire and re-confirm this value.
            setIsEmailVerified(loggedInUser.emailVerified);

            const profileResult = await getUserProfile(loggedInUser.uid);
            if (profileResult.success && profileResult.data) {
                setUserData(profileResult.data);
            }
        }
        setLoading(false);
        return result.success
            ? { success: true }
            : { success: false, error: result.error };
    };

    // ── signupStudent ────────────────────────────────────────────
    const signupStudent = async (
        email: string,
        password: string,
        name: string,
        standard: number,
    ): Promise<{ success: boolean; error?: string }> => {
        setLoading(true);
        const result = await signupWithEmail(email, password);
        if (result.success && result.data?.user) {
            const { uid } = result.data.user;

            // Step 1: Create Firestore doc immediately — never delayed
            const profileResult = await createStudentProfile(uid, name, email, standard);
            if (profileResult.success && profileResult.data) {
                setUserData(profileResult.data);
            }

            // Step 2: Mark user as NOT yet verified so RootNavigator
            // routes directly to VerifyEmailScreen after signup completes.
            setIsEmailVerified(false);

            // Step 3: Send verification email — non-blocking
            // (signup succeeds even if email delivery fails)
            await firebaseSendVerificationEmail();
        }
        setLoading(false);
        return result.success
            ? { success: true }
            : { success: false, error: result.error };
    };

    // ── createAdmin ──────────────────────────────────────────────
    /**
     * Creates a new admin account without disrupting the super_admin session.
     *
     * Strategy: initialize a secondary Firebase app, create the user there,
     * write the Firestore profile, then delete the secondary app.
     * The primary app (and the super_admin session) remains untouched.
     */
    const createAdmin = async (
        email: string,
        password: string,
        name: string,
        role: 'content_admin' | 'super_admin',
    ): Promise<{ success: boolean; error?: string }> => {
        // Guard: only super_admin may call this
        if (userData?.role !== 'super_admin') {
            return { success: false, error: 'Only super_admin can create admin accounts.' };
        }

        try {
            // Dynamically import to access firebase app API
            const firebaseApp = await import('@react-native-firebase/app');
            const firebase = firebaseApp.default;

            const secondaryAppName = `adminCreate_${Date.now()}`;
            const primaryApp = firebase.app();
            const { options } = primaryApp;

            // initializeApp returns a Promise<FirebaseApp> in @react-native-firebase
            const secondaryApp = await firebase.initializeApp(options, secondaryAppName);
            const secondaryAuth = auth(secondaryApp as any);

            let newUid = '';
            try {
                const credential = await secondaryAuth.createUserWithEmailAndPassword(
                    email,
                    password,
                );
                newUid = credential.user.uid;
                // Sign out of secondary app immediately after getting the uid
                await secondaryAuth.signOut();
            } finally {
                // Always delete secondary app to prevent memory leaks
                await (secondaryApp as any).delete();
            }


            if (!newUid) {
                return { success: false, error: 'Failed to create authentication account.' };
            }

            // Write Firestore document with admin role — uses primary Firestore
            const profileResult = await createAdminProfile(newUid, name, email, role);
            if (!profileResult.success) {
                return { success: false, error: profileResult.error };
            }

            return { success: true };
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    };


    // ── loginWithGoogle ──────────────────────────────────────────
    const loginWithGoogle = async (): Promise<{
        success: boolean;
        cancelled?: boolean;
        error?: string;
    }> => {
        setLoading(true);
        try {
            const result = await signInWithGoogle();

            if (result.cancelled) {
                return { success: false, cancelled: true };
            }

            if (!result.success || !result.data?.user) {
                return { success: false, error: result.error || 'Google Sign-In failed.' };
            }

            const { uid, displayName, email } = result.data.user;

            // Create Firestore doc if first time, otherwise return existing
            const profileResult = await createGoogleStudentProfile(
                uid,
                displayName ?? '',
                email ?? '',
            );

            if (profileResult.success && profileResult.data) {
                setUserData(profileResult.data);
            }

            return { success: true };
        } catch (err) {
            return { success: false, error: 'Something went wrong. Try again.' };
        } finally {
            setLoading(false);
        }
    };

    // ── sendVerificationEmail ────────────────────────────────────
    const sendVerificationEmail = async (): Promise<{ success: boolean; error?: string }> => {
        return firebaseSendVerificationEmail();
    };

    // ── checkEmailVerification ───────────────────────────────────
    /**
     * Reload Firebase user, update local isEmailVerified state,
     * and return the latest verification result.
     */
    const checkEmailVerification = async (): Promise<{ verified: boolean; error?: string }> => {
        const result = await reloadCurrentUser();
        if (result.success) {
            setIsEmailVerified(result.emailVerified ?? false);
            return { verified: result.emailVerified ?? false };
        }
        return { verified: false, error: result.error };
    };

    // ── logout ───────────────────────────────────────────────────
    const logout = async (): Promise<{ success: boolean; error?: string }> => {
        setLoading(true);
        if (user?.uid) {
            await removeFCMToken(user.uid);
        }
        const result = await logoutUser();
        if (result.success) {
            setUser(null);
            setUserData(null);
            currentUserRef.current = null;
        }
        setLoading(false);
        return result;
    };

    // ── Context Value ────────────────────────────────────────────
    const value: AuthContextType = {
        user,
        userData,
        role: userData?.role ?? null,
        loading,
        isAuthenticated: !!user && !!userData,
        isLoading: loading,
        isBlocked: userData?.isBlocked ?? false,
        isEmailVerified,
        login,
        signupStudent,
        signup: signupStudent,   // backward compat
        createAdmin,
        logout,
        loginWithGoogle,
        sendVerificationEmail,
        checkEmailVerification,
        // ── Backward-compat aliases used by existing screens ────────
        signOut: logout,
        userProfile: userData,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ──────────────────────────────────────────────────────

export function useAuthContext(): AuthContextType {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuthContext must be used within AuthProvider');
    }
    return context;
}
