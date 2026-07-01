import crashlytics from '@react-native-firebase/crashlytics';
import { UserProfile } from '../../types';

export type CrashlyticsCategory =
    | 'firestore_error'
    | 'pdf_error'
    | 'quiz_error'
    | 'api_error'
    | 'auth_error'
    | 'general_error';

/**
 * Initialize crashlytics user details.
 */
export async function initCrashlytics(user: UserProfile | null): Promise<void> {
    try {
        if (user) {
            await Promise.all([
                crashlytics().setUserId(user.uid),
                crashlytics().setAttributes({
                    role: user.role,
                    standard: user.standard ? String(user.standard) : 'none',
                    email: user.email,
                }),
            ]);
        } else {
            // Clear user if logged out
            await crashlytics().setUserId('');
        }
    } catch (error) {
        if (__DEV__) {
            // eslint-disable-next-line no-console
            console.warn('[Crashlytics] Failed to initialize user properties:', error);
        }
    }
}

/**
 * Record a non-fatal error to Firebase Crashlytics.
 */
export function logCrashError(
    error: any,
    category: CrashlyticsCategory = 'general_error',
    additionalContext?: Record<string, string | number | boolean>
): void {
    const errorInstance = error instanceof Error ? error : new Error(String(error));

    if (__DEV__) {
        // eslint-disable-next-line no-console
        console.warn(`[Crashlytics] Recorded Error [${category}]:`, errorInstance, additionalContext);
    }

    try {
        // Set category and context as attributes
        crashlytics().setAttribute('error_category', category);
        if (additionalContext) {
            Object.entries(additionalContext).forEach(([key, val]) => {
                crashlytics().setAttribute(key, String(val));
            });
        }
        crashlytics().recordError(errorInstance);
    } catch (err) {
        if (__DEV__) {
            // eslint-disable-next-line no-console
            console.warn('[Crashlytics] Failed to record non-fatal error:', err);
        }
    }
}

/**
 * Log a breadcrumb message to Crashlytics.
 */
export function logCrashBreadcrumb(message: string): void {
    if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log(`[Crashlytics] Breadcrumb: ${message}`);
    }

    try {
        crashlytics().log(message);
    } catch (err) {
        if (__DEV__) {
            // eslint-disable-next-line no-console
            console.warn('[Crashlytics] Failed to log breadcrumb:', err);
        }
    }
}
