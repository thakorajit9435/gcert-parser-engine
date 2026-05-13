// Analytics service placeholder — ready for integration with Firebase Analytics,
// Mixpanel, Amplitude, or any other provider.

export type AnalyticsEvent =
    | 'screen_view'
    | 'quiz_started'
    | 'quiz_completed'
    | 'content_viewed'
    | 'subscription_purchased'
    | 'admin_action';

interface AnalyticsParams {
    [key: string]: string | number | boolean;
}

/**
 * Log an analytics event.
 * Placeholder — swap with actual analytics SDK.
 */
export function logEvent(_event: AnalyticsEvent, _params?: AnalyticsParams): void {
    // TODO: Integrate with Firebase Analytics or third-party
    if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('[Analytics]', _event, _params);
    }
}

/**
 * Set the current screen name for analytics.
 */
export function setCurrentScreen(_screenName: string): void {
    if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('[Analytics] Screen:', _screenName);
    }
}

/**
 * Set user properties for analytics.
 */
export function setUserProperties(_properties: Record<string, string>): void {
    if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('[Analytics] User Props:', _properties);
    }
}
