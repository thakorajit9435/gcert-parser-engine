import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    useMemo,
    ReactNode,
} from 'react';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { UserProfile, UserRole } from '../types';
import {
    onAuthStateChanged,
    ensureUserProfile,
    signOut as authSignOut,
} from '../services/firebase/auth.service';
import { subscribeToUser } from '../services/firebase/users.service';

// ─── Context Type ─────────────────────────────────────────────

interface AuthContextType {
    firebaseUser: FirebaseAuthTypes.User | null;
    userProfile: UserProfile | null;
    role: UserRole | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    isBlocked: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): React.JSX.Element {
    const [firebaseUser, setFirebaseUser] = useState<FirebaseAuthTypes.User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [profileVersion, setProfileVersion] = useState<number>(0);

    // Listen for auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged((user) => {
            setFirebaseUser(user);
            if (!user) {
                setUserProfile(null);
                setIsLoading(false);
            }
        });
        return unsubscribe;
    }, []);

    // When auth user changes, fetch/create profile + subscribe to changes
    useEffect(() => {
        if (!firebaseUser) {
            return;
        }

        let unsubscribeProfile: (() => void) | null = null;

        const initProfile = async (): Promise<void> => {
            setIsLoading(true);
            const result = await ensureUserProfile(firebaseUser.uid, firebaseUser.phoneNumber ?? undefined);

            if (result.success && result.data) {
                setUserProfile(result.data);
            }

            // Subscribe to real-time profile updates
            unsubscribeProfile = subscribeToUser(firebaseUser.uid, (profile) => {
                if (profile) {
                    setUserProfile(profile);
                }
                setIsLoading(false);
            });
        };

        initProfile();

        return () => {
            if (unsubscribeProfile) {
                unsubscribeProfile();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [firebaseUser?.uid, profileVersion]);

    const signOut = useCallback(async (): Promise<void> => {
        await authSignOut();
        setUserProfile(null);
        setFirebaseUser(null);
    }, []);

    const refreshProfile = useCallback((): void => {
        setProfileVersion((v) => v + 1);
    }, []);

    const value = useMemo<AuthContextType>(
        () => ({
            firebaseUser,
            userProfile,
            role: userProfile?.role ?? null,
            isLoading,
            isAuthenticated: !!firebaseUser,
            isBlocked: userProfile?.isBlocked ?? false,
            signOut,
            refreshProfile,
        }),
        [firebaseUser, userProfile, isLoading, signOut, refreshProfile],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────

export function useAuthContext(): AuthContextType {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuthContext must be used within AuthProvider');
    }
    return context;
}
