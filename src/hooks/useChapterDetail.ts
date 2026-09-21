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

            // If chapter doesn't have direct pdfUrl, try fetching from subject doc, textbooks, or books collection
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
                  const tbDoc = await firestore()
                    .collection(COLLECTIONS.TEXTBOOKS)
                    .doc(`tb_${subId}`)
                    .get();
                  if (tbDoc.exists) {
                    const tbData = tbDoc.data() || {};
                    resolvedPdfUrl =
                      tbData.pdf_url ||
                      tbData.pdfUrl ||
                      tbData.file_url ||
                      tbData.url ||
                      '';
                  }
                }

                if (!resolvedPdfUrl) {
                  let tbSnap = await firestore()
                    .collection(COLLECTIONS.TEXTBOOKS)
                    .where('subject_id', '==', subId)
                    .limit(1)
                    .get();

                  if (tbSnap.empty) {
                    tbSnap = await firestore()
                      .collection(COLLECTIONS.TEXTBOOKS)
                      .where('subjectId', '==', subId)
                      .limit(1)
                      .get();
                  }

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

                if (!resolvedPdfUrl) {
                  const bookSnap = await firestore()
                    .collection('books')
                    .where('subjectId', '==', subId)
                    .limit(1)
                    .get();
                  if (!bookSnap.empty && bookSnap.docs[0]) {
                    const bkData = bookSnap.docs[0].data() || {};
                    resolvedPdfUrl = bkData.pdfUrl || bkData.fileUrl || '';
                  }
                }

                // Known curriculum textbook fallback for Std 8
                if (!resolvedPdfUrl) {
                  const titleToCheck = `${raw.title || ''} ${raw.titleGu || ''} ${subId}`.toLowerCase();
                  if (titleToCheck.includes('gita') || titleToCheck.includes('ગીતા') || titleToCheck.includes('bhagavad')) {
                    resolvedPdfUrl = 'https://firebasestorage.googleapis.com/v0/b/quizapp-1627022258976.appspot.com/o/textbooks%2FStd-6%20to%208%20%E0%AA%AD%E0%AA%97%E0%AA%B5%E0%AA%A6%E0%AB%8D%20%E0%AA%97%E0%AB%80%E0%AA%A4%E0%AA%BE%20%E0%AA%97%E0%AB%81%E0%AA%9C%E0%AA%B0%E0%AA%BE%E0%AA%A4%E0%AB%80%20%E0%AA%AE%E0%AA%BE%E0%AA%A7%E0%AB%8D%E0%AA%AF%E0%AA%AE.pdf?alt=media';
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
