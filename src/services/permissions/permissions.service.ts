import { Platform } from 'react-native';
import {
    check,
    request,
    requestMultiple,
    PERMISSIONS,
    RESULTS,
    openSettings,
    Permission,
} from 'react-native-permissions';

/**
 * Get files & media permissions array based on platform and OS version.
 */
export function getFilesAndMediaPermissions(): Permission[] {
    if (Platform.OS === 'android') {
        const apiLevel = typeof Platform.Version === 'string' ? parseInt(Platform.Version, 10) : Platform.Version;
        if (apiLevel >= 33) {
            return [PERMISSIONS.ANDROID.READ_MEDIA_IMAGES];
        }
        return [
            PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
            PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
        ];
    }
    if (Platform.OS === 'ios') {
        return [PERMISSIONS.IOS.PHOTO_LIBRARY];
    }
    return [];
}

/**
 * Check if files and media permission is already granted.
 */
export async function checkFilesAndMediaPermission(): Promise<boolean> {
    const permissions = getFilesAndMediaPermissions();
    if (permissions.length === 0) return true;

    try {
        for (const perm of permissions) {
            const status = await check(perm);
            if (status !== RESULTS.GRANTED && status !== RESULTS.LIMITED) {
                return false;
            }
        }
        return true;
    } catch (error) {
        console.warn('[Permissions] checkFilesAndMediaPermission error:', error);
        return false;
    }
}

/**
 * Request files and media permissions from the OS.
 */
export async function requestFilesAndMediaPermission(): Promise<boolean> {
    const permissions = getFilesAndMediaPermissions();
    if (permissions.length === 0) return true;

    try {
        if (permissions.length === 1 && permissions[0]) {
            const status = await request(permissions[0]);
            return status === RESULTS.GRANTED || status === RESULTS.LIMITED;
        }
        const statuses = await requestMultiple(permissions);
        return permissions.every(
            p => statuses[p] === RESULTS.GRANTED || statuses[p] === RESULTS.LIMITED
        );
    } catch (error) {
        console.warn('[Permissions] requestFilesAndMediaPermission error:', error);
        return false;
    }
}

/**
 * Legacy storage permission helpers for backward compatibility.
 */
export async function checkStoragePermission(): Promise<boolean> {
    return checkFilesAndMediaPermission();
}

export async function requestStoragePermission(): Promise<boolean> {
    return requestFilesAndMediaPermission();
}

/**
 * Open the system app settings screen.
 */
export async function openAppSettings(): Promise<void> {
    try {
        await openSettings();
    } catch (error) {
        console.warn('[Permissions] openAppSettings error:', error);
    }
}
