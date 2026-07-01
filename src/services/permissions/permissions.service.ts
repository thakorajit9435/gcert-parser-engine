import { Platform } from 'react-native';
import { check, request, PERMISSIONS, RESULTS, openSettings, Permission } from 'react-native-permissions';

/**
 * Get storage permission constant based on platform and API level.
 */
function getStoragePermission(): Permission | null {
    if (Platform.OS === 'android') {
        const apiLevel = typeof Platform.Version === 'string' ? parseInt(Platform.Version, 10) : Platform.Version;
        if (apiLevel >= 33) {
            // Android 13+ (API 33+) does not require WRITE_EXTERNAL_STORAGE for app-specific storage.
            // If the app needs media, we use READ_MEDIA_* but for PDF downloads/caching, no permission is needed.
            return null;
        }
        return PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE;
    }
    // iOS manages app sandboxing; no runtime storage permission is needed for local downloading.
    return null;
}

/**
 * Check the current storage permission status.
 * Returns true if granted or if permission is not required for the current platform/version.
 */
export async function checkStoragePermission(): Promise<boolean> {
    const permission = getStoragePermission();
    if (!permission) {
        return true;
    }

    try {
        const status = await check(permission);
        return status === RESULTS.GRANTED || status === RESULTS.LIMITED;
    } catch (error) {
        if (__DEV__) {
            // eslint-disable-next-line no-console
            console.warn('[Permissions] checkStoragePermission error:', error);
        }
        return false;
    }
}

/**
 * Request storage permission from the user.
 * Returns true if granted or if permission is not required for the current platform/version.
 */
export async function requestStoragePermission(): Promise<boolean> {
    const permission = getStoragePermission();
    if (!permission) {
        return true;
    }

    try {
        const status = await request(permission);
        return status === RESULTS.GRANTED || status === RESULTS.LIMITED;
    } catch (error) {
        if (__DEV__) {
            // eslint-disable-next-line no-console
            console.warn('[Permissions] requestStoragePermission error:', error);
        }
        return false;
    }
}

/**
 * Open the system app settings screen.
 */
export async function openAppSettings(): Promise<void> {
    try {
        await openSettings();
    } catch (error) {
        if (__DEV__) {
            // eslint-disable-next-line no-console
            console.warn('[Permissions] openAppSettings error:', error);
        }
    }
}
