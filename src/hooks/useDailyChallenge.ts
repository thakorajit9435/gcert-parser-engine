import {useState, useEffect, useCallback} from 'react';
import firestore from '@react-native-firebase/firestore';
import {DailyChallenge, Quiz} from '../types';
import {COLLECTIONS} from '../constants';

export function useDailyChallenge(standardId?: string, userId?: string) {
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [hasAttempted, setHasAttempted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    if (!standardId) {
      setLoading(false);
      return;
    }

    const todayDateStr = new Date().toISOString().split('T')[0];

    const fetchDaily = async () => {
      setLoading(true);
      try {
        // First get the active challenge config for today
        const challengeSnap = await firestore()
          .collection(COLLECTIONS.DAILY_CHALLENGES)
          .where('standardId', '==', standardId)
          .where('date', '==', todayDateStr)
          .where('isActive', '==', true)
          .limit(1)
          .get();

        if (challengeSnap.empty) {
          setChallenge(null);
          setQuiz(null);
          setLoading(false);
          return;
        }

        const doc = challengeSnap.docs[0];
        if (!doc) {
          setChallenge(null);
          setQuiz(null);
          setLoading(false);
          return;
        }
        const challengeData = {...doc.data(), id: doc.id} as DailyChallenge;
        setChallenge(challengeData);

        const quizDoc = await firestore()
          .collection(COLLECTIONS.QUIZZES)
          .doc(challengeData.quizId)
          .get();
        if (quizDoc.exists && quizDoc.data()?.isActive) {
          setQuiz({id: quizDoc.id, ...quizDoc.data()} as Quiz);

          if (userId) {
            const attemptSnap = await firestore()
              .collection(COLLECTIONS.QUIZ_ATTEMPTS)
              .where('userId', '==', userId)
              .where('quizId', '==', challengeData.quizId)
              .limit(1)
              .get();
            setHasAttempted(!attemptSnap.empty);
          } else {
            setHasAttempted(false);
          }
        } else {
          setQuiz(null);
          setHasAttempted(false);
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchDaily();
  }, [standardId, userId, tick]);

  return {challenge, quiz, hasAttempted, loading, error, refresh};
}
