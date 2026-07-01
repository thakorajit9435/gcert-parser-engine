import React, { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAuthContext } from '../context/AuthContext';
import { useStartup } from '../hooks/useStartup';
import { SplashScreen } from '../screens/common/SplashScreen';
import { NoInternetScreen } from '../screens/common/NoInternetScreen';
import { ForceUpdateScreen } from '../screens/common/ForceUpdateScreen';
import { AuthStack } from './AuthStack';
import { StudentTabs } from './StudentTabs';
import { AdminDrawerStack } from './AdminDrawerStack';
import { BlockedScreen } from '../screens/shared/BlockedScreen';
import { SelectStandardScreen } from '../screens/auth/SelectStandardScreen';
import { VerifyEmailScreen } from '../screens/auth/VerifyEmailScreen';
import { ADMIN_ROLES } from '../types';
import { StandardProvider } from '../context/StandardContext';
import NativeSplashScreen from 'react-native-splash-screen';

/**
 * Root navigator — routes based on startup phase and auth state.
 *
 * Startup flow (in order):
 *  0. initializing / checking_network / checking_version → SplashScreen
 *  1. no_internet                                        → NoInternetScreen (retry-able)
 *  2. force_update                                       → ForceUpdateScreen (non-dismissible)
 *  3. optional_update                                    → ForceUpdateScreen (dismissible)
 *  4. ready → auth checks:
 *       a. Not authenticated                             → AuthStack
 *       b. Blocked                                       → BlockedScreen
 *       c. Email NOT verified                            → VerifyEmailScreen
 *       d. Admin / Super Admin                           → AdminDrawerStack
 *       e. Student, no standard                         → SelectStandardScreen
 *       f. Student, standard set                        → StudentTabs
 */
export function RootNavigator(): React.JSX.Element {
    // ── Startup checks (internet + version) ───────────────────
    const { phase, updateConfig, currentVersion, retryNetwork, dismissOptionalUpdate } = useStartup();

    // ── Auth state ────────────────────────────────────────────
    const { isAuthenticated, isLoading, isBlocked, role, userData } = useAuth();
    const { isEmailVerified } = useAuthContext();

    // ── Hide native splash screen once ready ─────────────────
    // The native splash (react-native-splash-screen) is shown in
    // MainActivity.kt. We hide it once startup checks complete AND
    // auth state is resolved so the user sees the correct screen.
    const isStartupDone = phase !== 'initializing' && phase !== 'checking_network' && phase !== 'checking_version';
    const isReady = isStartupDone && !isLoading;

    useEffect(() => {
        if (isReady) {
            console.log('[RootNavigator] ✅ Hiding native splash screen');
            NativeSplashScreen.hide();
        }
    }, [isReady]);

    // ── Diagnostic log (remove after debugging) ──────────────
    console.log(`[RootNavigator] phase=${phase} isLoading=${isLoading} isAuthenticated=${isAuthenticated} role=${role}`);

    // ── Phase: still initializing / running checks ────────────
    if (phase === 'initializing' || phase === 'checking_network') {
        return <SplashScreen statusText="Starting up…" />;
    }

    if (phase === 'checking_version') {
        return <SplashScreen statusText="Checking for updates…" />;
    }

    // ── Phase: no internet ────────────────────────────────────
    if (phase === 'no_internet') {
        return <NoInternetScreen onRetry={retryNetwork} />;
    }

    // ── Phase: forced update — user cannot proceed ────────────
    if (phase === 'force_update' && updateConfig) {
        return (
            <ForceUpdateScreen
                config={updateConfig}
                currentVersion={currentVersion}
                isForced={true}
            />
        );
    }

    // ── Phase: optional update — user can dismiss ─────────────
    if (phase === 'optional_update' && updateConfig) {
        return (
            <ForceUpdateScreen
                config={updateConfig}
                currentVersion={currentVersion}
                isForced={false}
                onDismiss={dismissOptionalUpdate}
            />
        );
    }

    // ── Phase: ready — run auth checks ────────────────────────

    // Auth still loading → keep splash visible (no blank screen)
    if (isLoading) {
        return <SplashScreen statusText="Loading profile…" />;
    }

    if (!isAuthenticated) {
        return <AuthStack />;
    }

    if (isBlocked) {
        return <BlockedScreen />;
    }

    // Gate: user must verify email before entering the app.
    // Google Sign-In users always have emailVerified = true, so they pass through.
    if (!isEmailVerified) {
        return <VerifyEmailScreen />;
    }

    if (role && ADMIN_ROLES.includes(role)) {
        return (
            <StandardProvider>
                <AdminDrawerStack />
            </StandardProvider>
        );
    }

    // Student with no standard selected (typically after Google Sign-In)
    if (!userData?.standard) {
        return <SelectStandardScreen />;
    }

    // Default: student with standard set — wrapped in StandardProvider for standard switching
    return (
        <StandardProvider>
            <StudentTabs />
        </StandardProvider>
    );
}
