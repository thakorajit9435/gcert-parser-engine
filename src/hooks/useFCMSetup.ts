/**
 * useFCMSetup — React hook
 *
 * Runs once when an authenticated user is present.
 * Handles:
 *   1. Notification permission request
 *   2. FCM token retrieval + Firestore save
 *   3. Token refresh listener
 *   4. Foreground message handler (in-app notification)
 *   5. Background/quit notification tap handler (navigation)
 */

import {useEffect, useRef} from 'react';
import messaging, {
  FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import {Alert} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {
  setupFCM,
  subscribeToTokenRefresh,
} from '../services/firebase/fcm.service';
import {useAuthContext} from '../context/AuthContext';

// ─── Helper: Handle notification tap navigation ──────────────────

function handleNotificationNavigation(
  remoteMessage: FirebaseMessagingTypes.RemoteMessage,
  navigation: any,
): void {
  const {data} = remoteMessage;
  if (!data) return;

  try {
    if (data?.chapterId) {
      navigation.navigate('ChapterDetail', {chapterId: data.chapterId});
    } else if (data?.quizId) {
      navigation.navigate('Quiz', {quizId: data.quizId});
    } else if (data?.screen === 'Notifications') {
      navigation.navigate('NotificationsInbox');
    }
  } catch {
    // Navigation might not be ready yet — silently ignore
  }
}

// ─── Hook ────────────────────────────────────────────────────────

export function useFCMSetup(): void {
  const {user, isAuthenticated} = useAuthContext();
  const navigation = useNavigation<any>();

  // Track whether initial setup has run for this user session
  const setupDoneRef = useRef<string | null>(null);

  // ── 1. Setup (permission + token + Firestore save) ───────────
  useEffect(() => {
    if (!isAuthenticated || !user?.uid) return;
    // Prevent re-running for the same user on every re-render
    if (setupDoneRef.current === user.uid) return;
    setupDoneRef.current = user.uid;

    setupFCM(user.uid).catch(err =>
      console.warn('[useFCMSetup] Setup failed:', err),
    );

    // Token refresh listener — auto-saves new token when rotated
    const unsubTokenRefresh = subscribeToTokenRefresh(user.uid);

    return () => {
      unsubTokenRefresh();
    };
  }, [isAuthenticated, user?.uid]);

  // ── 2. Foreground message handler ────────────────────────────
  useEffect(() => {
    const unsubForeground = messaging().onMessage(async remoteMessage => {
      const title = remoteMessage.notification?.title ?? 'New Notification';
      const body = remoteMessage.notification?.body ?? '';

      Alert.alert(title, body, [
        {
          text: 'View',
          onPress: () =>
            handleNotificationNavigation(remoteMessage, navigation),
        },
        {text: 'Dismiss', style: 'cancel'},
      ]);
    });

    return () => unsubForeground();
  }, [navigation]);

  // ── 3. Background / Quit tap handler ─────────────────────────
  useEffect(() => {
    // Handles taps when app is in background
    const unsubBackground = messaging().onNotificationOpenedApp(
      remoteMessage => {
        handleNotificationNavigation(remoteMessage, navigation);
      },
    );

    // Handles taps when app was fully quit (check on mount once)
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          // Small delay to ensure navigation is ready
          setTimeout(() => {
            handleNotificationNavigation(remoteMessage, navigation);
          }, 1000);
        }
      });

    return () => unsubBackground();
  }, [navigation]);
}
