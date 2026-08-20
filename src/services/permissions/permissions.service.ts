import { PermissionsAndroid, Platform, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PERMISSION_ACKNOWLEDGED_KEY = '@gyan_files_permission_ack_v1';

/**
 * Check if files and media permission is already granted and acknowledged.
 */
export async function checkFilesAndMediaPermission(): Promise<boolean> {
    try {
        const hasAck = await AsyncStorage.getItem(PERMISSION_ACKNOWLEDGED_KEY);
        if (!hasAck) {
            return false;
        }

        if (Platform.OS === 'android') {
            const apiLevel = typeof Platform.Version === 'string' ? parseInt(Platform.Version, 10) : Platform.Version;
            if (apiLevel >= 33) {
                const hasMedia = await PermissionsAndroid.check(
                    'android.permission.READ_MEDIA_IMAGES' as any
                );
                return hasMedia;
            } else {
                const hasRead = await PermissionsAndroid.check(
                    PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
                );
                const hasWrite = await PermissionsAndroid.check(
                    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
                );
                return hasRead && hasWrite;
            }
        }
        return true;
    } catch (error) {
        console.warn('[Permissions] checkFilesAndMediaPermission error:', error);
        return false;
    }
}

/**
 * Request files and media permissions from OS.
 */
export async function requestFilesAndMediaPermission(): Promise<boolean> {
    try {
        await AsyncStorage.setItem(PERMISSION_ACKNOWLEDGED_KEY, 'true');

        if (Platform.OS === 'android') {
            const apiLevel = typeof Platform.Version === 'string' ? parseInt(Platform.Version, 10) : Platform.Version;
            if (apiLevel >= 33) {
                const result = await PermissionsAndroid.request(
                    'android.permission.READ_MEDIA_IMAGES' as any,
                    {
                        title: 'Files and Media Permission',
                        message: 'App needs access to your photos and files for reading textbooks and solving doubts.',
                        buttonPositive: 'Allow',
                        buttonNegative: 'Deny',
                    }
                );
                return result === PermissionsAndroid.RESULTS.GRANTED;
            } else {
                const results = await PermissionsAndroid.requestMultiple([
                    PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
                    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                ]);
                return (
                    results[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] ===
                        PermissionsAndroid.RESULTS.GRANTED ||
                    results[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] ===
                        PermissionsAndroid.RESULTS.GRANTED
                );
            }
        }
        return true;
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
        await Linking.openSettings();
    } catch (error) {
        console.warn('[Permissions] openAppSettings error:', error);
    }
}
