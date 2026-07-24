/**
 * Maps Firestore error codes to user-friendly messages.
 */

const ERROR_MAP: Record<string, string> = {
  'permission-denied': 'You do not have permission to perform this action.',
  'failed-precondition':
    'This operation requires a Firestore index. Please contact admin.',
  unavailable:
    'Network error. Please check your internet connection and try again.',
  'not-found': 'The requested resource was not found.',
  'already-exists': 'This item already exists.',
  'resource-exhausted': 'Too many requests. Please try again in a moment.',
  unauthenticated: 'You are not signed in. Please log in and try again.',
  'deadline-exceeded': 'The request took too long. Please try again.',
  cancelled: 'The operation was cancelled.',
  'data-loss': 'Data may have been lost. Please try again.',
  internal: 'An internal error occurred. Please try again.',
  'invalid-argument': 'Invalid data provided. Please check your input.',
  'out-of-range': 'The value is outside the allowed range.',
  unimplemented: 'This feature is not yet available.',
};

export function getFirestoreErrorMessage(error: unknown): string {
  if (!error) return 'An unknown error occurred.';

  const err = error as {code?: string; message?: string};

  // Check for firestore error code (format: "firestore/permission-denied")
  if (err.code) {
    const code = err.code.replace('firestore/', '');
    const msg = ERROR_MAP[code];
    if (msg) return msg;
  }

  // Check for network errors
  if (err.message && err.message.includes('network')) {
    return (
      ERROR_MAP.unavailable ||
      'Network error. Please check your internet connection.'
    );
  }

  // Fallback
  return err.message || 'Something went wrong. Please try again.';
}
