import {useState, useEffect, useCallback} from 'react';
import {UserBookmark} from '../types';
import {
  subscribeToBookmarks,
  toggleBookmark,
} from '../services/firebase/bookmark.service';

interface UseBookmarksReturn {
  bookmarks: UserBookmark[];
  loading: boolean;
  error: string | null;
  isBookmarked: (chapterId: string) => boolean;
  toggle: (
    chapterId: string,
    data?: {
      standardId?: string;
      subjectId?: string;
      subjectName?: string;
      chapterTitle?: string;
    },
  ) => Promise<boolean>;
}

export function useBookmarks(userId?: string): UseBookmarksReturn {
  const [bookmarks, setBookmarks] = useState<UserBookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToBookmarks(
      userId,
      data => {
        setBookmarks(data);
        setLoading(false);
        setError(null);
      },
      err => {
        setError(err);
        setBookmarks([]);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [userId]);

  const isBookmarkedFn = useCallback(
    (chapterId: string): boolean => {
      return bookmarks.some(b => b.chapterId === chapterId);
    },
    [bookmarks],
  );

  const toggleFn = useCallback(
    async (
      chapterId: string,
      data?: {
        standardId?: string;
        subjectId?: string;
        subjectName?: string;
        chapterTitle?: string;
      },
    ): Promise<boolean> => {
      if (!userId) return false;
      const result = await toggleBookmark(userId, chapterId, data);
      return result.success ? result.data ?? false : false;
    },
    [userId],
  );

  return {
    bookmarks,
    loading,
    error,
    isBookmarked: isBookmarkedFn,
    toggle: toggleFn,
  };
}
