import {useState, useEffect, useCallback} from 'react';
import firestore from '@react-native-firebase/firestore';
import {Quiz} from '../types';
import {COLLECTIONS} from '../constants';

interface UseDailyQuizReturn {
  quiz: Quiz | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useDailyQuiz(standardId?: string): UseDailyQuizReturn {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);

    let query: any = firestore()
      .collection(COLLECTIONS.QUIZZES)
      .where('isDailyQuiz', '==', true)
      .where('isActive', '==', true)
      .where('isDeleted', '==', false)
      .limit(1);

    if (standardId) {
      query = firestore()
        .collection(COLLECTIONS.QUIZZES)
        .where('standardId', '==', standardId)
        .where('isDailyQuiz', '==', true)
        .where('isActive', '==', true)
        .where('isDeleted', '==', false)
        .limit(1);
    }

    const unsubscribe = query.onSnapshot(
      (snapshot: any) => {
        if (snapshot.empty || !snapshot.docs[0]) {
          setQuiz(null);
        } else {
          const doc = snapshot.docs[0];
          setQuiz({id: doc.id, ...doc.data()} as Quiz);
        }
        setLoading(false);
        setError(null);
      },
      (err: Error) => {
        setError(err.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [standardId, tick]);

  const refresh = useCallback(() => {
    setTick(t => t + 1);
  }, []);

  return {quiz, loading, error, refresh};
}
