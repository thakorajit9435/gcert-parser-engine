import { useState, useEffect, useMemo } from 'react';
import firestore from '@react-native-firebase/firestore';
import { COLLECTIONS } from '../constants';
import { Chapter } from '../types';
import { useUserProgress } from './useUserProgress';

interface UseChaptersReturn {
  chapters: Chapter[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useChapters(subjectId?: string, standardId?: string): UseChaptersReturn {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { progressMap } = useUserProgress(subjectId);

  const refresh = () => setRefreshTrigger(prev => prev + 1);

  useEffect(() => {
    if (!subjectId) {
      setChapters([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Query chapters by subjectId without compound orderBy to prevent missing index crashes
    const query = firestore()
      .collection(COLLECTIONS.CHAPTERS)
      .where('subjectId', '==', subjectId);

    const unsubscribe = query.onSnapshot(
      snapshot => {
        if (!snapshot || snapshot.empty) {
          setChapters([]);
        } else {
          let data = snapshot.docs.map(doc => {
            const raw = doc.data() || {};
            const rawStart = raw.startPage ?? raw.start_page ?? raw.bookStartPage ?? raw.book_start_page;
            const parsedStartPage = rawStart !== undefined && rawStart !== null && rawStart !== '' ? Number(rawStart) : undefined;
            const rawEnd = raw.endPage ?? raw.end_page;
            const parsedEndPage = rawEnd !== undefined && rawEnd !== null && rawEnd !== '' ? Number(rawEnd) : undefined;
            const rawBookStart = raw.bookStartPage ?? raw.book_start_page ?? raw.startPage ?? raw.start_page;
            const parsedBookStartPage = rawBookStart !== undefined && rawBookStart !== null && rawBookStart !== '' ? Number(rawBookStart) : undefined;

            return {
              id: doc.id,
              ...raw,
              subjectId: raw.subjectId || raw.subject_id || subjectId,
              pdfUrl:
                raw.pdfUrl ||
                raw.pdf_url ||
                raw.file_url ||
                raw.url ||
                raw.textbookUrl ||
                raw.textbook_url ||
                '',
              titleGu: raw.titleGu || raw.title_gu || raw.title || '',
              title: raw.title || raw.titleGu || raw.title_gu || '',
              startPage: parsedStartPage,
              endPage: parsedEndPage,
              bookStartPage: parsedBookStartPage,
            } as Chapter;
          });

          // Filter out deleted chapters
          data = data.filter(ch => ch.isDeleted !== true);

          // Client-side sort by startPage ascending first, fallback to chapter order / number ascending
          data.sort((a, b) => {
            const pageA = a.startPage;
            const pageB = b.startPage;
            if (pageA !== undefined && pageB !== undefined && pageA !== pageB) {
              return pageA - pageB;
            }
            if (pageA !== undefined && pageB === undefined) {
              return -1;
            }
            if (pageA === undefined && pageB !== undefined) {
              return 1;
            }
            return (
              (Number(a.order ?? (a as any).chapterNumber) || 999) -
              (Number(b.order ?? (b as any).chapterNumber) || 999)
            );
          });

          setChapters(data);
        }
        setLoading(false);
        setError(null);
      },
      err => {
        console.warn('[useChapters] Firestore error:', err.message);
        setError(err.message);
        setChapters([]);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [subjectId, standardId, refreshTrigger]);

  const chaptersWithProgress = useMemo(() => {
    if (!chapters.length) {
      return [];
    }
    return chapters.map(ch => ({
      ...ch,
      isCompleted: progressMap[ch.id]?.isCompleted ?? false,
      lastOpenedAt: progressMap[ch.id]?.lastOpenedAt ?? null,
    }));
  }, [chapters, progressMap]);

  return { chapters: chaptersWithProgress, loading, error, refresh };
}
