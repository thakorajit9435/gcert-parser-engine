import {useState, useCallback, useRef, useEffect} from 'react';
import {UserBookProgress} from '../types';
import {
  getUserBookProgress,
  updateUserBookProgress,
} from '../services/firebase/book.service';
import {useAuth} from './useAuth';

export function useBookProgress(bookId: string) {
  const {userProfile} = useAuth();
  const userId = userProfile?.uid;

  const [progress, setProgress] = useState<UserBookProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Store the timeout for debouncing
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchProgress = useCallback(async () => {
    if (!userId || !bookId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await getUserBookProgress(userId, bookId);
      if (result.success) {
        setProgress(result.data || null);
      } else {
        setError(result.error ?? 'Failed to fetch book progress');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [userId, bookId]);

  // Fetch initial progress on mount
  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  /**
   * Save progress to Firestore, debounced by 3 seconds
   */
  const saveProgress = useCallback(
    (page: number, totalPages: number) => {
      if (!userId || !bookId) {return;}

      // Optimistically update local state immediately
      setProgress((prev: UserBookProgress | null) => {
        if (prev) {
          return {...prev, lastPage: page, totalPages};
        }
        return {
          id: bookId,
          userId,
          bookId,
          lastPage: page,
          totalPages,
        };
      });

      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new timer to execute firestore write after 3 seconds
      debounceTimerRef.current = setTimeout(async () => {
        await updateUserBookProgress(userId, bookId, page, totalPages);
      }, 3000);
    },
    [userId, bookId],
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  /**
   * Force save progress immediately (e.g. when unmounting or leaving the screen)
   */
  const forceSaveProgress = useCallback(
    async (page: number, totalPages: number) => {
      if (!userId || !bookId) {return;}

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      await updateUserBookProgress(userId, bookId, page, totalPages);
    },
    [userId, bookId],
  );

  return {
    progress,
    loading,
    error,
    saveProgress,
    forceSaveProgress,
    fetchProgress,
  };
}
