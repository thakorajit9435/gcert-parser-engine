import {FirebaseFirestoreTypes} from '@react-native-firebase/firestore';

/**
 * Format a Firestore timestamp to a readable date string.
 */
export function formatTimestamp(
  timestamp: FirebaseFirestoreTypes.Timestamp | null | undefined,
  locale: string = 'gu-IN',
): string {
  if (!timestamp) {
    return '—';
  }
  const date = timestamp.toDate();
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a Firestore timestamp to date + time.
 */
export function formatDateTime(
  timestamp: FirebaseFirestoreTypes.Timestamp | null | undefined,
  locale: string = 'gu-IN',
): string {
  if (!timestamp) {
    return '—';
  }
  const date = timestamp.toDate();
  return date.toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format a number with Indian numbering system.
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-IN');
}

/**
 * Format currency in INR.
 */
export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

/**
 * Truncate text with ellipsis.
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.substring(0, maxLength)}…`;
}

/**
 * Generate a unique ID.
 */
export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Debounce a function call.
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delayMs: number,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delayMs);
  };
}

/**
 * Check if a timestamp is today.
 */
export function isToday(timestamp: FirebaseFirestoreTypes.Timestamp): boolean {
  const date = timestamp.toDate();
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Get start of today as a Date object.
 */
export function getStartOfToday(): Date {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

/**
 * Validate a YouTube/video URL.
 */
export function isValidVideoUrl(url: string): boolean {
  const patterns = [
    /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
    /^https?:\/\/youtu\.be\/[\w-]+/,
    /^https?:\/\/(www\.)?vimeo\.com\/\d+/,
    /^https?:\/\/.+\.(mp4|webm|ogg)/,
  ];
  return patterns.some(p => p.test(url));
}

/**
 * Safely extract error message.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred.';
}

/**
 * Wrap a promise with a timeout. If the promise does not resolve within the specified timeout,
 * it resolves with the fallback value or rejects with a timeout error if no fallback is provided.
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  fallback?: T,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve, reject) =>
      setTimeout(() => {
        if (fallback !== undefined) {
          resolve(fallback);
        } else {
          reject(new Error('Operation timed out'));
        }
      }, timeoutMs),
    ),
  ]);
}
