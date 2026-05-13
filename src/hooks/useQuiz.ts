import {useState, useEffect, useCallback, useRef} from 'react';
import {Quiz, Question, QuizAttempt} from '../types';
import {
  getQuizById,
  getQuizQuestions,
  saveQuizAttempt,
} from '../services/firebase/quiz.service';

interface SubmitPayload {
  userId: string;
  answers: Record<string, string>;
  timeTakenSeconds: number;
}

interface UseQuizReturn {
  quiz: Quiz | null;
  questions: Question[];
  loading: boolean;
  error: string | null;
  submitting: boolean;
  refresh: () => Promise<void>;
  submitQuiz: (
    payload: SubmitPayload,
  ) => Promise<{
    score: number;
    correct: number;
    passed: boolean;
    pointsEarned: number;
  } | null>;
}

export function useQuiz(quizId?: string): UseQuizReturn {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const mountedRef = useRef<boolean>(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchQuiz = useCallback(async (): Promise<void> => {
    if (!quizId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [quizResult, questionsResult] = await Promise.all([
        getQuizById(quizId),
        getQuizQuestions(quizId),
      ]);

      if (!mountedRef.current) {
        return;
      }

      if (!quizResult.success || !quizResult.data) {
        setError(quizResult.error ?? 'Quiz not found.');
        return;
      }

      if (!questionsResult.success) {
        setError(questionsResult.error ?? 'Failed to load questions.');
        return;
      }

      setQuiz(quizResult.data);
      setQuestions(questionsResult.data ?? []);
    } catch (err) {
      if (mountedRef.current) {
        setError((err as Error).message);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [quizId]);

  useEffect(() => {
    fetchQuiz();
  }, [fetchQuiz]);

  const submitQuiz = useCallback(
    async (
      payload: SubmitPayload,
    ): Promise<{
      score: number;
      correct: number;
      passed: boolean;
      pointsEarned: number;
    } | null> => {
      if (!quiz) {
        return null;
      }

      setSubmitting(true);

      try {
        let correctCount = 0;
        questions.forEach(q => {
          if (payload.answers[q.id] === q.correctOptionId) {
            correctCount++;
          }
        });

        const score =
          questions.length > 0
            ? Math.round((correctCount / questions.length) * 100)
            : 0;
        const passed = score >= (quiz.passingScore ?? 60);
        const pointsEarned = correctCount * 10;

        const attempt: Omit<QuizAttempt, 'id' | 'createdAt'> = {
          userId: payload.userId,
          quizId: quiz.id,
          chapterId: quiz.chapterId,
          subjectId: quiz.subjectId,
          standardId: quiz.standardId,
          score,
          totalQuestions: questions.length,
          correctAnswers: correctCount,
          timeTakenSeconds: payload.timeTakenSeconds,
          answers: payload.answers,
          passed,
        };

        await saveQuizAttempt(attempt, pointsEarned);

        return {score, correct: correctCount, passed, pointsEarned};
      } catch {
        return null;
      } finally {
        if (mountedRef.current) {
          setSubmitting(false);
        }
      }
    },
    [quiz, questions],
  );

  return {
    quiz,
    questions,
    loading,
    error,
    submitting,
    refresh: fetchQuiz,
    submitQuiz,
  };
}
