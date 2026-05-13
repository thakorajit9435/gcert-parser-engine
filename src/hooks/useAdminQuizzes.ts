import {useState, useEffect, useCallback, useRef} from 'react';
import firestore from '@react-native-firebase/firestore';
import {Quiz} from '../types';
import {COLLECTIONS} from '../constants';
import {
  setDailyQuiz,
  unsetDailyQuiz,
  softDeleteQuiz,
} from '../services/firebase/quiz.service';

interface QuizInput {
  title: string;
  subjectId: string;
  chapterId?: string;
  standardId: string;
  session?: string;
  totalMarks: number;
  timeLimitSeconds: number;
  passingScore: number;
  difficulty: 'easy' | 'medium' | 'hard';
  isDailyQuiz: boolean;
  isActive: boolean;
  isMixed: boolean;
  isPremium?: boolean;
}

interface UseAdminQuizzesReturn {
  quizzes: Quiz[];
  loading: boolean;
  error: string | null;
  addQuiz: (data: QuizInput) => Promise<string | null>;
  updateQuiz: (quizId: string, data: Partial<QuizInput>) => Promise<boolean>;
  softDelete: (quizId: string) => Promise<boolean>;
  refresh: () => void;
}

export function useAdminQuizzes(standardId?: string): UseAdminQuizzesReturn {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);

    let query: any = firestore()
      .collection(COLLECTIONS.QUIZZES)
      .where('isDeleted', '==', false)
      .orderBy('createdAt', 'desc');

    if (standardId) {
      query = firestore()
        .collection(COLLECTIONS.QUIZZES)
        .where('standardId', '==', standardId)
        .where('isDeleted', '==', false)
        .orderBy('createdAt', 'desc');
    }

    const unsubscribe = query.onSnapshot(
      (snapshot: any) => {
        if (!mountedRef.current) {
          return;
        }
        const data = snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data(),
        })) as Quiz[];
        setQuizzes(data);
        setLoading(false);
        setError(null);
      },
      (err: Error) => {
        if (!mountedRef.current) {
          return;
        }
        setError(err.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [standardId, tick]);

  const refresh = useCallback(() => {
    setTick(t => t + 1);
  }, []);

  const addQuiz = useCallback(
    async (data: QuizInput): Promise<string | null> => {
      try {
        const order = quizzes.length + 1;
        const ref = await firestore()
          .collection(COLLECTIONS.QUIZZES)
          .add({
            ...data,
            totalQuestions: 0,
            order,
            isDeleted: false,
            isPremium: data.isPremium ?? false,
            titleGu: '',
            createdAt: firestore.FieldValue.serverTimestamp(),
            updatedAt: firestore.FieldValue.serverTimestamp(),
          });

        if (data.isDailyQuiz) {
          await setDailyQuiz(ref.id, data.standardId);
        }

        return ref.id;
      } catch (err) {
        setError((err as Error).message);
        return null;
      }
    },
    [quizzes.length],
  );

  const updateQuiz = useCallback(
    async (quizId: string, data: Partial<QuizInput>): Promise<boolean> => {
      try {
        const existing = quizzes.find(q => q.id === quizId);

        await firestore()
          .collection(COLLECTIONS.QUIZZES)
          .doc(quizId)
          .update({...data, updatedAt: firestore.FieldValue.serverTimestamp()});

        if (data.isDailyQuiz === true && existing?.standardId) {
          await setDailyQuiz(quizId, data.standardId ?? existing.standardId);
        } else if (data.isDailyQuiz === false) {
          await unsetDailyQuiz(quizId);
        }

        return true;
      } catch (err) {
        setError((err as Error).message);
        return false;
      }
    },
    [quizzes],
  );

  const softDelete = useCallback(async (quizId: string): Promise<boolean> => {
    try {
      const result = await softDeleteQuiz(quizId);
      return result.success;
    } catch (err) {
      setError((err as Error).message);
      return false;
    }
  }, []);

  return {quizzes, loading, error, addQuiz, updateQuiz, softDelete, refresh};
}
