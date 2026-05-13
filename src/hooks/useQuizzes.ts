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

    let query = firestore()
      .collection(COLLECTIONS.QUIZZES)
      .where('isDeleted', '==', false)
      .where('isActive', '==', true);

    if (filters.chapterId) {
      query = query.where('chapterId', '==', filters.chapterId);
    } else if (filters.subjectId) {
      query = query.where('subjectId', '==', filters.subjectId);
      if (filters.isMixed !== undefined) {
        query = query.where('isMixed', '==', filters.isMixed);
      }
    }

    // Note: we can't reliably order by order here without an index on isActive + chapterId/subjectId + order.
    // We will fetch and sort locally to avoid forcing the user to create lots of composite indexes.

    const unsubscribe = query.onSnapshot(
      snapshot => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Quiz[];

        // Sort locally by order
        data.sort((a, b) => a.order - b.order);

        setQuizzes(data);
        setLoading(false);
        setError(null);
      },
      err => {
        setError(err.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [filters.subjectId, filters.chapterId, filters.isMixed, refreshTrigger]);

  return {quizzes, loading, error, refresh};
}
