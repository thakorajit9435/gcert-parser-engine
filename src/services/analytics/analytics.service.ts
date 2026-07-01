import {
  getAnalytics,
  logEvent,
  setUserId,
  setUserProperties,
  logScreenView,
} from '@react-native-firebase/analytics';
import {getApp} from '@react-native-firebase/app';

export type AnalyticsEventName =
  | 'signup'
  | 'login'
  | 'logout'
  | 'subject_open'
  | 'chapter_open'
  | 'pdf_open'
  | 'video_open'
  | 'quiz_start'
  | 'quiz_complete'
  | 'bookmark_added'
  | 'bookmark_removed'
  | 'notification_open'
  | 'language_change'
  | 'standard_change';

const APP_VERSION = '1.0.0';

const analyticsInstance = getAnalytics(getApp());

/**
 * Log an event to Firebase Analytics.
 */
export async function logAnalyticsEvent(
  event: AnalyticsEventName,
  params: Record<string, any> = {},
): Promise<void> {
  const eventParams = {
    ...params,
    app_version: APP_VERSION,
  };

  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log(`[Analytics] Event: ${event}`, eventParams);
  }

  try {
    await logEvent(analyticsInstance, event, eventParams);
  } catch (error) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('[Analytics] Error logging event:', error);
    }
  }
}

/**
 * Set user identity and properties in Firebase Analytics.
 */
export async function setAnalyticsUser(
  userId: string | null,
  role?: string,
  standard?: string,
): Promise<void> {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log(`[Analytics] Set User: ${userId}`, {role, standard});
  }

  try {
    await setUserId(analyticsInstance, userId);
    if (userId) {
      await setUserProperties(analyticsInstance, {
        role: role || '',
        standard: standard || '',
        app_version: APP_VERSION,
      });
    }
  } catch (error) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('[Analytics] Error setting user properties:', error);
    }
  }
}

/**
 * Log a screen view event to Firebase Analytics.
 */
export async function setAnalyticsScreen(screenName: string): Promise<void> {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log(`[Analytics] Screen View: ${screenName}`);
  }

  try {
    await logScreenView(analyticsInstance, {
      screen_name: screenName,
      screen_class: screenName,
    });
  } catch (error) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('[Analytics] Error logging screen view:', error);
    }
  }
}
