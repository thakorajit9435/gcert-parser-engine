import storage from '@react-native-firebase/storage';
import {ServiceResult} from '../../types';
import {generateId} from '../../utils';

/**
 * Upload a file to Firebase Storage.
 * @param localPath Local file URI (e.g., from image picker)
 * @param storagePath Storage folder path (e.g., 'subjects/images')
 * @param fileName Optional custom filename
 * @returns Download URL
 */
export async function uploadFile(
  localPath: string,
  storagePath: string,
  fileName?: string,
): Promise<ServiceResult<string>> {
  try {
    const name = fileName ?? `${generateId()}`;
    const fullPath = `${storagePath}/${name}`;
    const ref = storage().ref(fullPath);

    await ref.putFile(localPath);
    const downloadUrl = await ref.getDownloadURL();

    return {success: true, data: downloadUrl};
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}

/**
 * Upload an image file.
 */
export async function uploadImage(
  localPath: string,
  storagePath: string,
): Promise<ServiceResult<string>> {
  const ext = localPath.split('.').pop() ?? 'jpg';
  const fileName = `${generateId()}.${ext}`;
  return uploadFile(localPath, storagePath, fileName);
}

/**
 * Upload a PDF file.
 */
export async function uploadPdf(
  localPath: string,
  storagePath: string,
): Promise<ServiceResult<string>> {
  const fileName = `${generateId()}.pdf`;
  return uploadFile(localPath, storagePath, fileName);
}

/**
 * Upload a PDF file with progress tracking.
 * @param onProgress Callback receiving progress percentage (0–100).
 */
export async function uploadPdfWithProgress(
  localPath: string,
  storagePath: string,
  onProgress?: (progress: number) => void,
): Promise<ServiceResult<string>> {
  try {
    const fileName = `${generateId()}.pdf`;
    const fullPath = `${storagePath}/${fileName}`;
    const ref = storage().ref(fullPath);
    const task = ref.putFile(localPath);

    if (onProgress) {
      task.on('state_changed', snapshot => {
        const pct = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
        );
        onProgress(pct);
      });
    }

    await task;
    const downloadUrl = await ref.getDownloadURL();
    return {success: true, data: downloadUrl};
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}

/**
 * Upload a base64 string as a PDF to Firebase Storage.
 */
export async function uploadPdfString(
  base64String: string,
  storagePath: string,
): Promise<ServiceResult<string>> {
  try {
    const fileName = `${generateId()}.pdf`;
    const fullPath = `${storagePath}/${fileName}`;
    const ref = storage().ref(fullPath);

    await ref.putString(base64String, 'base64', {
      contentType: 'application/pdf',
    });
    const downloadUrl = await ref.getDownloadURL();

    return {success: true, data: downloadUrl};
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}

/**
 * Delete a file from Storage by its download URL.
 */
export async function deleteFileByUrl(
  downloadUrl: string,
): Promise<ServiceResult<void>> {
  try {
    const ref = storage().refFromURL(downloadUrl);
    await ref.delete();
    return {success: true};
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}
