import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { UserProfile, UserRole } from '../types';
import { onAuthStateChanged, loginWithEmail, signupWithEmail, logoutUser, signInWithGoogle, sendVerificationEmail as firebaseSendVerificationEmail, reloadCurrentUser } from '../services/firebase/authService';
import { getUserProfile, createStudentProfile, createAdminProfile, createGoogleStudentProfile } from '../services/firebase/userService';
import { subscribeToUser } from '../services/firebase/users.service';
import { removeFCMToken } from '../services/firebase/fcm.service';
import { logAnalyticsEvent, setAnalyticsUser } from '../services/analytics';
import { initCrashlytics, logCrashError } from '../services/crashlytics';
import { withTimeout } from '../utils';

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
        // ── Failsafe: if onAuthStateChanged never fires OR the async work
        // inside the callback hangs/crashes — unblock the splash after 10 s.
        const failsafeTimer = setTimeout(() => {
            console.warn('[AuthContext] Failsafe: loading timed out after 10 s — unblocking app.');
            setLoading(false);
        }, 10_000);

        const unsubscribeAuth = onAuthStateChanged(async (firebaseUser) => {
            console.log('[AuthContext] onAuthStateChanged fired, user:', firebaseUser?.uid ?? 'null');

            // Do NOT clear the failsafe here — clear it ONLY after all async
            // work completes (in `finally`) so it remains a true safety net.

            try {
                currentUserRef.current = firebaseUser;
                setUser(firebaseUser);

                if (!firebaseUser) {
                    console.log('[AuthContext] No user — clearing state');
                    setUserData(null);
                    setIsEmailVerified(false);
                    setAnalyticsUser(null);
                    initCrashlytics(null);
                    return;
                }

                // Reload the user from the Firebase server so we always get the
                // latest emailVerified value — this handles the case where a user
                // verifies their email outside the app and then reopens it.
                // Wrapped in a 4 s timeout so a slow/unreachable server can't hang startup.
                console.log('[AuthContext] Reloading Firebase user…');
                try {
                    await withTimeout(firebaseUser.reload(), 4000);
                } catch {
                    // Ignore network errors / timeouts — fall back to cached value
                    console.warn('[AuthContext] User reload timed out / failed — using cached value');
                }
                // Re-read after reload (currentUser is updated in place)
                const freshUser = auth().currentUser;
                const verified = freshUser?.emailVerified ?? firebaseUser.emailVerified;
                setIsEmailVerified(verified);

                // Fetch profile from Firestore — role comes from here only.
                // Wrapped with a 5 s timeout so a Firestore hang doesn't freeze the splash.
                console.log('[AuthContext] Fetching user profile…');
                let result = await withTimeout(
                    getUserProfile(firebaseUser.uid),
                    5000,
                    { success: false, error: 'Profile fetch timed out' }
                );

                // Cache fallback: if server fetch failed/timed out, try local Firestore cache
                // so a returning user can still enter the app under poor network conditions.
                if (!result.success) {
                    console.warn('[AuthContext] Server profile fetch failed — trying cache…');
                    result = await withTimeout(
                        getUserProfile(firebaseUser.uid, { source: 'cache' }),
                        2000,
                        { success: false, error: 'Cache fetch also timed out' },
                    );
                }

                if (result.success && result.data) {
                    console.log('[AuthContext] Profile loaded, role:', result.data.role);
                    setUserData(result.data);
                    setAnalyticsUser(firebaseUser.uid, result.data.role, result.data.standard ? String(result.data.standard) : undefined);
                    initCrashlytics(result.data);
                } else {
                    console.warn('[AuthContext] Failed to load user profile or timed out:', result.error);
                }
            } catch (err) {
                // Catch-all: log the unexpected error so it's visible in Metro
                console.error('[AuthContext] Unexpected error in auth listener — unblocking app:', err);
            } finally {
                // ALWAYS unblock the splash — even if something above threw
                clearTimeout(failsafeTimer);
                setLoading(false);
                console.log('[AuthContext] Auth loading complete ✓');
            }
        });

        return () => {
            clearTimeout(failsafeTimer);
            unsubscribeAuth();
        };
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

            logAnalyticsEvent('login', { method: 'email' });

            // Explicitly set isEmailVerified immediately after login so
            // RootNavigator shows VerifyEmailScreen without any flash.
            // onAuthStateChanged will also fire and re-confirm this value.
            setIsEmailVerified(loggedInUser.emailVerified);

            const profileResult = await getUserProfile(loggedInUser.uid);
            if (profileResult.success && profileResult.data) {
                setUserData(profileResult.data);
                setAnalyticsUser(loggedInUser.uid, profileResult.data.role, profileResult.data.standard ? String(profileResult.data.standard) : undefined);
                initCrashlytics(profileResult.data);
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

            logAnalyticsEvent('signup', { method: 'email', standard });

            // Step 1: Create Firestore doc immediately — never delayed
            const profileResult = await createStudentProfile(uid, name, email, standard);
            if (profileResult.success && profileResult.data) {
                setUserData(profileResult.data);
                setAnalyticsUser(uid, profileResult.data.role, String(standard));
                initCrashlytics(profileResult.data);
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
                return { success: false, error: 'Unable to connect Google Account. Please try again.' };
            }

            const { uid, displayName, email } = result.data.user;

            logAnalyticsEvent('login', { method: 'google' });

            // Create Firestore doc if first time, otherwise return existing
            const profileResult = await createGoogleStudentProfile(
                uid,
                displayName ?? '',
                email ?? '',
            );

            if (profileResult.success && profileResult.data) {
                setUserData(profileResult.data);
                setAnalyticsUser(uid, profileResult.data.role, profileResult.data.standard ? String(profileResult.data.standard) : undefined);
                initCrashlytics(profileResult.data);
            }

            return { success: true };
        } catch (err) {
            logCrashError(err, 'auth_error');
            return { success: false, error: 'Google Sign-In failed. Please try again.' };
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
            setUser(auth().currentUser);
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
        // Sign out of Google session so user can pick a different account next time
        try {
            await GoogleSignin.signOut();
        } catch {
            // Ignore — user may not have signed in via Google
        }
        const result = await logoutUser();
        if (result.success) {
            logAnalyticsEvent('logout');
            setUser(null);
            setUserData(null);
            currentUserRef.current = null;
            setAnalyticsUser(null);
            initCrashlytics(null);
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
