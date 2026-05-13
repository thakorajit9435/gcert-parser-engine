import { useState, useEffect, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { checkAppVersion, MobileAppConfig, VersionStatus } from '../services/firebase/version.check.service';
import packageJson from '../../package.json';

// ─── Types ────────────────────────────────────────────────────

export type StartupPhase =
    /** Initial render — splash visible, nothing checked yet */
    | 'initializing'
    /** Actively re-checking network after a retry tap */
    | 'checking_network'
    /** Device is offline */
    | 'no_internet'
    /** Actively fetching remote version config */
    | 'checking_version'
    /** Force-update required — user cannot proceed */
    | 'force_update'
    /** Optional update available — user may dismiss */
    | 'optional_update'
    /** All checks passed — hand off to auth/navigation */
    | 'ready';

export interface StartupState {
    phase: StartupPhase;
    /** Update config from Firestore (populated when update is available) */
    updateConfig: MobileAppConfig | null;
    /** Semantic-version string running on device */
    currentVersion: string;
    /** Retry network check (called from NoInternet UI) */
    retryNetwork: () => void;
    /** Dismiss the optional-update modal and continue */
    dismissOptionalUpdate: () => void;
}

// ─── App version ─────────────────────────────────────────────
// Reads version from package.json via resolveJsonModule (tsconfig).
// For production, swap this with DeviceInfo.getVersion() from
// react-native-device-info if you need the native build version.
const APP_VERSION: string = packageJson.version ?? '1.0.0';

// ─── Hook ────────────────────────────────────────────────────

/**
 * useStartup
 *
 * Orchestrates the app startup sequence:
 *  1. Check internet connectivity
 *  2. Fetch remote version config
 *  3. Compare versions and surface the appropriate phase
 *
 * Consumers (RootNavigator) render the correct UI based on `phase`.
 */
export function useStartup(): StartupState {
    const [phase, setPhase] = useState<StartupPhase>('initializing');
    const [updateConfig, setUpdateConfig] = useState<MobileAppConfig | null>(null);

    // ── Internal runner ───────────────────────────────────────
    const runStartupChecks = useCallback(async () => {
        console.log('[useStartup] Starting checks…');

        // ── 1. Network check ──────────────────────────────────
        setPhase('checking_network');
        let connected = false;
        try {
            const state = await NetInfo.fetch();
            connected = state.isConnected === true && state.isInternetReachable !== false;
        } catch {
            connected = false;
        }

        if (!connected) {
            console.log('[useStartup] No internet — showing offline screen');
            setPhase('no_internet');
            return;
        }

        // ── 2. Version check ──────────────────────────────────
        setPhase('checking_version');
        let versionStatus: VersionStatus = 'up_to_date';
        let config: MobileAppConfig | null = null;

        try {
            const result = await checkAppVersion(APP_VERSION);
            versionStatus = result.status;
            config = result.config;
            console.log('[useStartup] Version check:', versionStatus, 'current:', APP_VERSION);
        } catch (err) {
            // Firestore error — safe fallback: let user in
            console.error('[useStartup] Version check error — proceeding:', err);
            versionStatus = 'up_to_date';
        }

        if (versionStatus === 'force_update') {
            setUpdateConfig(config);
            setPhase('force_update');
            return;
        }

        if (versionStatus === 'optional_update') {
            setUpdateConfig(config);
            setPhase('optional_update');
            return;
        }

        // ── 3. All clear ──────────────────────────────────────
        setPhase('ready');
    }, []);

    // ── Mount: run checks ─────────────────────────────────────
    useEffect(() => {
        // Small delay so the splash has time to paint before any async work starts
        const timer = setTimeout(() => {
            runStartupChecks();
        }, 1200);
        return () => clearTimeout(timer);
    }, [runStartupChecks]);

    // ── Retry handler (called from NoInternet UI) ─────────────
    const retryNetwork = useCallback(() => {
        console.log('[useStartup] Retry triggered');
        runStartupChecks();
    }, [runStartupChecks]);

    // ── Optional update dismiss ───────────────────────────────
    const dismissOptionalUpdate = useCallback(() => {
        console.log('[useStartup] Optional update dismissed — proceeding');
        setPhase('ready');
    }, []);

    return {
        phase,
        updateConfig,
        currentVersion: APP_VERSION,
        retryNetwork,
        dismissOptionalUpdate,
    };
}
