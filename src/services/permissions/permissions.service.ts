import { PermissionsAndroid, Platform, Linking } from 'react-native';

/**
 * Directly requests native System Camera & Media permissions (same native OS popup as Mic).
 */
export async function requestCameraAndMediaPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;

    try {
        const apiLevel = typeof Platform.Version === 'string' ? parseInt(Platform.Version, 10) : Platform.Version;

        const permissionsToRequest: any[] = [PermissionsAndroid.PERMISSIONS.CAMERA];
        if (apiLevel >= 33) {
            permissionsToRequest.push('android.permission.READ_MEDIA_IMAGES');
        } else {
            permissionsToRequest.push(
                PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
                PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
            );
        }

        const results: Record<string, string> = await PermissionsAndroid.requestMultiple(permissionsToRequest);

        const cameraGranted =
            results[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED;
        const mediaGranted =
            apiLevel >= 33
                ? results['android.permission.READ_MEDIA_IMAGES'] === PermissionsAndroid.RESULTS.GRANTED
                : results[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.GRANTED ||
                  results[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.GRANTED;

        return cameraGranted || mediaGranted;
    } catch (error) {
        console.warn('[Permissions] requestCameraAndMediaPermission error:', error);
        return false;
    }
}

/**
 * Check if storage/media permission is granted.
 */
export async function checkStoragePermission(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;
    try {
        const apiLevel = typeof Platform.Version === 'string' ? parseInt(Platform.Version, 10) : Platform.Version;
        if (apiLevel >= 33) {
            return await PermissionsAndroid.check('android.permission.READ_MEDIA_IMAGES' as any);
        }
        const hasRead = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
        return hasRead;
    } catch {
        return false;
    }
}

/**
 * Request storage permission from user.
 */
export async function requestStoragePermission(): Promise<boolean> {
    return requestCameraAndMediaPermission();
}

/**
 * Check files and media permission.
 */
export async function checkFilesAndMediaPermission(): Promise<boolean> {
    return checkStoragePermission();
}

/**
 * Request files and media permission.
 */
export async function requestFilesAndMediaPermission(): Promise<boolean> {
    return requestCameraAndMediaPermission();
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
