import {useState, useEffect, useCallback, useMemo} from 'react';
import {UserBookmark} from '../types';
import {
  subscribeToBookmarks,
  toggleBookmark,
} from '../services/firebase/bookmark.service';
import {logAnalyticsEvent} from '../services/analytics';

interface UseBookmarksReturn {
  bookmarks: UserBookmark[];
  loading: boolean;
  error: string | null;
  isBookmarked: (chapterId: string) => boolean;
  toggle: (
    chapterId: string,
    data?: {
      standardId?: string;
      standardName?: string;
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

  // Track optimistic UI states: chapterId -> { isBookmarked, data }
  const [optimisticState, setOptimisticState] = useState<{
    [chapterId: string]: {
      isBookmarked: boolean;
      data?: {
        standardId?: string;
        standardName?: string;
        subjectId?: string;
        subjectName?: string;
        chapterTitle?: string;
      };
    };
  }>({});

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
        // Clean up optimistic state when Firestore matches the expected state
        setOptimisticState(prev => {
          const next = {...prev};
          Object.keys(next).forEach(chapterId => {
            const isBookmarkedInFirestore = data.some(
              b => b.chapterId === chapterId,
            );
            const expectedState = next[chapterId]?.isBookmarked;
            if (
              expectedState !== undefined &&
              isBookmarkedInFirestore === expectedState
            ) {
              delete next[chapterId];
            }
          });
          return next;
        });
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
      const opt = optimisticState[chapterId];
      if (opt !== undefined) {
        return opt.isBookmarked;
      }
      return bookmarks.some(b => b.chapterId === chapterId);
    },
    [bookmarks, optimisticState],
  );

  const toggleFn = useCallback(
    async (
      chapterId: string,
      data?: {
        standardId?: string;
        standardName?: string;
        subjectId?: string;
        subjectName?: string;
        chapterTitle?: string;
      },
    ): Promise<boolean> => {
      if (!userId) return false;
      const wasBookmarked = isBookmarkedFn(chapterId);
      const nextBookmarked = !wasBookmarked;

      // Apply optimistic update instantly
      setOptimisticState(prev => ({
        ...prev,
        [chapterId]: {isBookmarked: nextBookmarked, data},
      }));

      const result = await toggleBookmark(userId, chapterId, data);
      if (result.success) {
        const finalState = result.data ?? false;
        logAnalyticsEvent(finalState ? 'bookmark_added' : 'bookmark_removed', {
          chapter_id: chapterId,
          subject_id: data?.subjectId || 'unknown',
          standard_id: data?.standardId || 'unknown',
          title: data?.chapterTitle || 'unknown',
        });
        return finalState;
      } else {
        // Revert optimistic update on error
        setOptimisticState(prev => {
          const next = {...prev};
          delete next[chapterId];
          return next;
        });
        setError(result.error || 'Failed to update bookmark');
        return false;
      }
    },
    [userId, isBookmarkedFn],
  );

  // Compute optimistic bookmarks array for instant UI update in lists
  const activeBookmarks = useMemo(() => {
    let list = [...bookmarks];
    Object.entries(optimisticState).forEach(([chapterId, state]) => {
      if (state.isBookmarked) {
        if (!list.some(b => b.chapterId === chapterId)) {
          list.unshift({
            id: `temp_${chapterId}`,
            userId: userId || '',
            chapterId,
            standardId: state.data?.standardId,
            standardName: state.data?.standardName,
            subjectId: state.data?.subjectId,
            subjectName: state.data?.subjectName,
            chapterTitle: state.data?.chapterTitle,
          });
        }
      } else {
        list = list.filter(b => b.chapterId !== chapterId);
      }
    });
    return list;
  }, [bookmarks, optimisticState, userId]);

  return {
    bookmarks: activeBookmarks,
    loading,
    error,
    isBookmarked: isBookmarkedFn,
    toggle: toggleFn,
  };
}
