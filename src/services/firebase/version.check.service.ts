import firestore from '@react-native-firebase/firestore';
import { COLLECTIONS, MOBILE_APP_CONFIG_DOC_ID } from '../../constants';

// ─── Types ────────────────────────────────────────────────────

export interface MobileAppConfig {
    /** Semver of the latest published release, e.g. "1.2.0" */
    latestVersion: string;
    /** When true the user CANNOT skip the update */
    forceUpdate: boolean;
    /** Human-readable description shown on the update card */
    updateMessage: string;
    /** Deep-link / URL for the Play Store listing */
    playStoreUrl: string;
}

export type VersionStatus =
    | 'up_to_date'
    | 'optional_update'
    | 'force_update';

export interface VersionCheckResult {
    status: VersionStatus;
    config: MobileAppConfig | null;
}

// ─── Helpers ─────────────────────────────────────────────────

/**
 * Compare two semver strings.
 * Returns:
 *  -1  if a < b
 *   0  if a === b
 *   1  if a > b
 */
function compareSemver(a: string, b: string): -1 | 0 | 1 {
    const parsePart = (v: string) =>
        v
            .replace(/[^0-9.]/g, '')
            .split('.')
            .map((n) => parseInt(n, 10) || 0);

    const pa = parsePart(a);
    const pb = parsePart(b);
    const len = Math.max(pa.length, pb.length);

    for (let i = 0; i < len; i++) {
        const numA = pa[i] ?? 0;
        const numB = pb[i] ?? 0;
        if (numA < numB) return -1;
        if (numA > numB) return 1;
    }
    return 0;
}

// ─── Firestore fetch ─────────────────────────────────────────

const DEFAULT_PLAY_STORE_URL =
    'https://play.google.com/store/apps/details?id=com.students';

const DEFAULT_CONFIG: MobileAppConfig = {
    latestVersion: '1.0.0',
    forceUpdate: false,
    updateMessage: 'A new version is available with exciting features and improvements.',
    playStoreUrl: DEFAULT_PLAY_STORE_URL,
};

/**
 * Fetch the mobileApp config document.
 * Falls back gracefully on error (returns null → caller treats as up-to-date).
 */
export async function fetchMobileAppConfig(): Promise<MobileAppConfig | null> {
    try {
        const doc = await firestore()
            .collection(COLLECTIONS.APP_CONFIG)
            .doc(MOBILE_APP_CONFIG_DOC_ID)
            .get();

        if (!doc.exists) {
            console.warn('[VersionCheck] mobileApp config document not found — skipping update check');
            return null;
        }

        const data = doc.data();
        if (!data) return null;

        return {
            latestVersion: data.latestVersion ?? DEFAULT_CONFIG.latestVersion,
            forceUpdate: data.forceUpdate ?? DEFAULT_CONFIG.forceUpdate,
            updateMessage: data.updateMessage ?? DEFAULT_CONFIG.updateMessage,
            playStoreUrl: data.playStoreUrl ?? DEFAULT_CONFIG.playStoreUrl,
        };
    } catch (error) {
        console.error('[VersionCheck] Failed to fetch mobileApp config:', error);
        return null;
    }
}

// ─── Version check ───────────────────────────────────────────

/**
 * Main entry point.
 *
 * @param currentVersion  The version string running on device (e.g. "1.0.0")
 * @returns VersionCheckResult with status and raw config
 */
export async function checkAppVersion(
    currentVersion: string,
): Promise<VersionCheckResult> {
    const config = await fetchMobileAppConfig();

    if (!config) {
        // Firestore unavailable or doc missing — safe fallback
        return { status: 'up_to_date', config: null };
    }

    const cmp = compareSemver(currentVersion, config.latestVersion);

    if (cmp >= 0) {
        // Current version is equal to or newer than latest
        return { status: 'up_to_date', config };
    }

    // Current version is older than latest
    if (config.forceUpdate) {
        return { status: 'force_update', config };
    }

    return { status: 'optional_update', config };
}
