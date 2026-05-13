/**
 * FCM Token Management Service
 *
 * Handles:
 * - Requesting notification permissions (iOS + Android)
 * - Retrieving and persisting the FCM device token to Firestore
 * - Auto-refreshing the token when Firebase rotates it
 */

import messaging from '@react-native-firebase/messaging';
import firestore from '@react-native-firebase/firestore';
import {Platform} from 'react-native';
import {COLLECTIONS} from '../../constants';

// ─── Permission ─────────────────────────────────────────────────

/**
 * Requests push notification permission from the OS.
 * - iOS:    shows the native permission dialog
 * - Android 13+: shows the POST_NOTIFICATIONS permission dialog
 *
 * @returns true if permission was granted, false otherwise
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    if (Platform.OS === 'ios') {
      const authStatus = await messaging().requestPermission();
      return (
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL
      );
    }
    // Android — permission is handled at the manifest level for < 13;
    // for 13+ react-native-firebase handles it automatically via requestPermission.
    const authStatus = await messaging().requestPermission();
    return authStatus === messaging.AuthorizationStatus.AUTHORIZED;
  } catch {
    return false;
  }
}

// ─── Token ──────────────────────────────────────────────────────

/**
 * Get the current FCM registration token.
 * Returns null if the device does not support FCM or permission is denied.
 */
export async function getFCMToken(): Promise<string | null> {
  try {
    const token = await messaging().getToken();
    return token ?? null;
  } catch {
    return null;
  }
}

/**
 * Persist the FCM token to `users/{uid}` in Firestore.
 * Uses `merge: true` so other fields are not overwritten.
 */
export async function saveFCMToken(uid: string, token: string): Promise<void> {
  try {
    await firestore()
      .collection(COLLECTIONS.USERS)
      .doc(uid)
      .set({fcmToken: token}, {merge: true});
  } catch (error) {
    // Non-fatal — log but don't crash
    console.warn('[FCM] Failed to save token:', error);
  }
}

/**
 * Remove the FCM token from Firestore on logout.
 * Prevents stale tokens from receiving notifications for signed-out users.
 */
export async function removeFCMToken(uid: string): Promise<void> {
  try {
    await firestore()
      .collection(COLLECTIONS.USERS)
      .doc(uid)
      .set({fcmToken: null}, {merge: true});
  } catch (error) {
    console.warn('[FCM] Failed to remove token:', error);
  }
}

/**
 * Subscribe to FCM token refresh events.
 * When Firebase rotates the token, this saves the new one automatically.
 *
 * @returns unsubscribe function — call it in useEffect cleanup
 */
export function subscribeToTokenRefresh(uid: string): () => void {
  return messaging().onTokenRefresh(async newToken => {
    await saveFCMToken(uid, newToken);
  });
}

// ─── Full Setup ──────────────────────────────────────────────────

/**
 * One-call setup: request permission → get token → save to Firestore.
 * Safe to call on every app launch — idempotent.
 *
 * @returns the FCM token, or null if setup failed
 */
export async function setupFCM(uid: string): Promise<string | null> {
  const granted = await requestNotificationPermission();
  if (!granted) return null;

  const token = await getFCMToken();
  if (!token) return null;

  await saveFCMToken(uid, token);
  return token;
}
