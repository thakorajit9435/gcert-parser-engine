import {useState, useEffect} from 'react';
import firestore from '@react-native-firebase/firestore';
import {COLLECTIONS} from '../constants';
import {Quiz} from '../types';

interface QuizzesFilters {
  subjectId?: string;
  chapterId?: string;
  isMixed?: boolean;
}

interface UseQuizzesReturn {
  quizzes: Quiz[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useQuizzes(filters: QuizzesFilters): UseQuizzesReturn {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refresh = () => setRefreshTrigger(prev => prev + 1);

  useEffect(() => {
    if (!filters.subjectId && !filters.chapterId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Single field query to avoid requiring composite indexes in Firestore
    let query: any = firestore().collection(COLLECTIONS.QUIZZES);

    if (filters.chapterId) {
      query = query.where('chapterId', '==', filters.chapterId);
    } else if (filters.subjectId) {
      query = query.where('subjectId', '==', filters.subjectId);
    }

    const processSnapshotDocs = (docs: any[]) => {
      let data = docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Quiz[];

      // Filter in memory for isDeleted, isActive, and isMixed
      data = data.filter(q => {
        const matchesChapter = filters.chapterId
          ? (q as any).chapterId === filters.chapterId || (q as any).chapter_id === filters.chapterId
          : true;
        const matchesSubject = filters.subjectId
          ? (q as any).subjectId === filters.subjectId || (q as any).subject_id === filters.subjectId
          : true;
        const isDel = (q as any).isDeleted === true || (q as any).is_deleted === true;
        const active = (q as any).isActive !== false && (q as any).is_active !== false;

        if (isDel || !active) {return false;}
        if (filters.chapterId && !matchesChapter) {return false;}
        if (filters.subjectId && !matchesSubject) {return false;}

        if (filters.isMixed !== undefined) {
          const isM = (q as any).isMixed === true || (q as any).is_mixed === true;
          if (isM !== filters.isMixed) {return false;}
        }
        return true;
      });

      // Sort locally by order
      data.sort((a, b) => ((a as any).order ?? 0) - ((b as any).order ?? 0));
      return data;
    };

    const unsubscribe = query.onSnapshot(
      async (snapshot: any) => {
        let docs = snapshot.docs;

        // Fallback: If chapterId query by camelCase returned no docs, check snake_case chapter_id
        if (filters.chapterId && snapshot.empty) {
          try {
            const altSnap = await firestore()
              .collection(COLLECTIONS.QUIZZES)
              .where('chapter_id', '==', filters.chapterId)
              .get();
            if (!altSnap.empty) {
              docs = altSnap.docs;
            }
          } catch (e) {
            // Ignore fallback error
          }
        }

        let data = processSnapshotDocs(docs);

        // Ultimate fallback: if data is empty, fetch all quizzes and filter in memory
        if (data.length === 0) {
          try {
            const allSnap = await firestore().collection(COLLECTIONS.QUIZZES).get();
            if (!allSnap.empty) {
              data = processSnapshotDocs(allSnap.docs);
            }
          } catch (e) {
            // Ignore
          }
        }

        setQuizzes(data);
        setLoading(false);
        setError(null);
      },
      async (err: any) => {
        // Safe fallback in case of Firestore error (e.g. index/permission issues)
        try {
          const allSnap = await firestore().collection(COLLECTIONS.QUIZZES).get();
          const data = processSnapshotDocs(allSnap.docs);
          setQuizzes(data);
          setLoading(false);
          setError(null);
        } catch (fallbackErr) {
          console.error('Failed to load quizzes:', err);
          setError(err.message);
          setLoading(false);
        }
      },
    );

    return unsubscribe;
  }, [filters.subjectId, filters.chapterId, filters.isMixed, refreshTrigger]);

  return {quizzes, loading, error, refresh};
}
