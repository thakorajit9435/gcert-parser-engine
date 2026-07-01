import {useState, useEffect, useRef, useCallback} from 'react';
import {PdfReadingProgress, PdfType} from '../types';
import {
  getPdfProgress,
  savePdfProgress,
  togglePageBookmark as togglePageBookmarkApi,
} from '../services/firebase';

export function usePdfProgress(
  userId: string | undefined,
  pdfId: string | undefined,
  pdfType: PdfType,
) {
  const [progress, setProgress] = useState<PdfReadingProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingProgressRef = useRef<{page: number; totalPages: number} | null>(
    null,
  );

  // Fetch initial progress
  useEffect(() => {
    if (!userId || !pdfId) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    getPdfProgress(userId, pdfId)
      .then(res => {
        if (isMounted && res) {
          setProgress(res);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [userId, pdfId]);

  // Force save any pending progress immediately
  const forceSaveProgress = useCallback(
    async (page: number, totalPages: number) => {
      if (!userId || !pdfId) return;

      // Clear any pending timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      pendingProgressRef.current = null;

      await savePdfProgress(userId, pdfId, pdfType, page, totalPages);
      setProgress(prev => {
        if (!prev) {
          return {
            id: `${userId}_${pdfId}`,
            userId,
            pdfId,
            pdfType,
            currentPage: page,
            totalPages,
            lastReadAt: {seconds: Date.now() / 1000, nanoseconds: 0} as any,
            bookmarkedPages: [],
          };
        }
        return {
          ...prev,
          currentPage: page,
          totalPages,
        };
      });
    },
    [userId, pdfId, pdfType],
  );

  // Debounced save progress
  const saveProgress = useCallback(
    (page: number, totalPages: number) => {
      if (!userId || !pdfId) return;

      // Keep track of the latest values to save
      pendingProgressRef.current = {page, totalPages};

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        if (pendingProgressRef.current && userId && pdfId) {
          const {page: p, totalPages: t} = pendingProgressRef.current;
          await savePdfProgress(userId, pdfId, pdfType, p, t);
          pendingProgressRef.current = null;
        }
      }, 3000); // 3 seconds debounce
    },
    [userId, pdfId, pdfType],
  );

  // Handle unmount - save any pending progress
  useEffect(() => {
    return () => {
      if (
        saveTimeoutRef.current &&
        pendingProgressRef.current &&
        userId &&
        pdfId
      ) {
        const {page, totalPages} = pendingProgressRef.current;
        clearTimeout(saveTimeoutRef.current);
        savePdfProgress(userId, pdfId, pdfType, page, totalPages).catch(err => {
          // eslint-disable-next-line no-console
          console.error('[usePdfProgress] Failed to save on unmount:', err);
        });
      }
    };
  }, [userId, pdfId, pdfType]);

  const toggleBookmark = useCallback(
    async (page: number) => {
      if (!userId || !pdfId) return false;

      const success = await togglePageBookmarkApi(userId, pdfId, pdfType, page);
      if (success) {
        setProgress(prev => {
          if (!prev) {
            return {
              id: `${userId}_${pdfId}`,
              userId,
              pdfId,
              pdfType,
              currentPage: page,
              totalPages: 0,
              lastReadAt: {seconds: Date.now() / 1000, nanoseconds: 0} as any,
              bookmarkedPages: [page],
            };
          }
          const isBookmarked = prev.bookmarkedPages.includes(page);
          const newBookmarks = isBookmarked
            ? prev.bookmarkedPages.filter(p => p !== page)
            : [...prev.bookmarkedPages, page].sort((a, b) => a - b);
          return {
            ...prev,
            bookmarkedPages: newBookmarks,
          };
        });
        return true;
      }
      return false;
    },
    [userId, pdfId, pdfType],
  );

  const isPageBookmarked = useCallback(
    (page: number) => {
      return progress?.bookmarkedPages?.includes(page) ?? false;
    },
    [progress],
  );

  return {
    progress,
    loading,
    saveProgress,
    forceSaveProgress,
    toggleBookmark,
    isPageBookmarked,
  };
}
