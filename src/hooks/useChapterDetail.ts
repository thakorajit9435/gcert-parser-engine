import { useState, useEffect } from 'react';
import firestore from '@react-native-firebase/firestore';
import { COLLECTIONS } from '../constants';
import { Chapter } from '../types';

interface UseChapterDetailReturn {
  chapter: Chapter | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useChapterDetail(chapterId?: string): UseChapterDetailReturn {
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refresh = () => setRefreshTrigger(prev => prev + 1);

  useEffect(() => {
    if (!chapterId) {
      setLoading(false);
      return;
    }

    const unsubscribe = firestore()
      .collection(COLLECTIONS.CHAPTERS)
      .doc(chapterId)
      .onSnapshot(
        async doc => {
          if (doc.exists) {
            const raw = doc.data() || {};
            let resolvedPdfUrl =
              raw.pdfUrl ||
              raw.pdf_url ||
              raw.file_url ||
              raw.url ||
              raw.textbookUrl ||
              raw.textbook_url ||
              '';

            const subId = raw.subjectId || raw.subject_id;

            // If chapter doesn't have direct pdfUrl, try fetching from subject doc or textbooks collection
            if (!resolvedPdfUrl && subId) {
              try {
                const subDoc = await firestore()
                  .collection(COLLECTIONS.SUBJECTS)
                  .doc(subId)
                  .get();
                if (subDoc.exists) {
                  const subData = subDoc.data() || {};
                  resolvedPdfUrl =
                    subData.pdfUrl ||
                    subData.pdf_url ||
                    subData.textbookUrl ||
                    subData.textbook_url ||
                    subData.file_url ||
                    '';
                }

                if (!resolvedPdfUrl) {
                  const tbSnap = await firestore()
                    .collection(COLLECTIONS.TEXTBOOKS)
                    .where('subject_id', '==', subId)
                    .limit(1)
                    .get();

                  if (!tbSnap.empty && tbSnap.docs[0]) {
                    const tbData = tbSnap.docs[0].data() || {};
                    resolvedPdfUrl =
                      tbData.pdf_url ||
                      tbData.pdfUrl ||
                      tbData.file_url ||
                      tbData.url ||
                      '';
                  }
                }
              } catch (e) {
                console.log('[useChapterDetail] Subject/textbook fallback lookup notice:', e);
              }
            }

            const normalized: Chapter = {
              id: doc.id,
              ...raw,
              subjectId: subId || '',
              pdfUrl: resolvedPdfUrl,
              titleGu: raw.titleGu || raw.title_gu || raw.title || '',
              title: raw.title || raw.titleGu || raw.title_gu || '',
              startPage: Number(raw.startPage ?? raw.start_page ?? raw.bookStartPage ?? raw.book_start_page ?? 1),
              endPage: raw.endPage ?? raw.end_page ?? undefined,
              bookStartPage: Number(raw.bookStartPage ?? raw.book_start_page ?? raw.startPage ?? raw.start_page ?? 1),
            } as Chapter;

            setChapter(normalized);
          } else {
            setChapter(null);
            setError('Chapter not found');
          }
          setLoading(false);
        },
        err => {
          setError(err.message);
          setLoading(false);
        },
      );

    return unsubscribe;
  }, [chapterId, refreshTrigger]);

  return { chapter, loading, error, refresh };
}
