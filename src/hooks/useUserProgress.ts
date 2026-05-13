import {useState, useEffect, useCallback} from 'react';
import firestore from '@react-native-firebase/firestore';
import {UserProgress} from '../types';
import {COLLECTIONS} from '../constants';
import {useAuth} from './useAuth';

export function useUserProgress(subjectId?: string) {
  const {userProfile} = useAuth();
  const [progressMap, setProgressMap] = useState<Record<string, UserProgress>>(
    {},
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile?.uid) {
      setLoading(false);
      return;
    }

    let query = firestore()
      .collection(COLLECTIONS.USER_PROGRESS)
      .where('userId', '==', userProfile.uid);

    if (subjectId) {
      query = query.where('subjectId', '==', subjectId);
    }

    const unsubscribe = query.onSnapshot(
      snapshot => {
        const map: Record<string, UserProgress> = {};
        if (!snapshot.empty) {
          snapshot.docs.forEach(doc => {
            const data = doc.data() as UserProgress;
            map[data.chapterId] = {...data, id: doc.id};
          });
        }
        setProgressMap(map);
        setLoading(false);
      },
      error => {
        console.error('Error fetching user progress:', error);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [userProfile?.uid, subjectId]);

  const getChapterProgress = useCallback(
    (chapterId: string) => progressMap[chapterId] || null,
    [progressMap],
  );

  return {progressMap, loading, getChapterProgress};
}
