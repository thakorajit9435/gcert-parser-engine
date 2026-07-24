import {useState, useEffect, useMemo} from 'react';
import firestore from '@react-native-firebase/firestore';
import {COLLECTIONS} from '../constants';
import {Chapter} from '../types';
import {useUserProgress} from './useUserProgress';

interface UseChaptersReturn {
  chapters: Chapter[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useChapters(subjectId?: string): UseChaptersReturn {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const {progressMap} = useUserProgress(subjectId);

  const refresh = () => setRefreshTrigger(prev => prev + 1);

  useEffect(() => {
    if (!subjectId) {
      setLoading(false);
      return;
    }

    const query = firestore()
      .collection(COLLECTIONS.CHAPTERS)
      .where('subjectId', '==', subjectId)
      .where('isDeleted', '==', false);

    const unsubscribe = query.onSnapshot(
      snapshot => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Chapter[];
        data.sort((a, b) => (a.order || 0) - (b.order || 0));
        setChapters(data);
        setLoading(false);
        setError(null);
      },
      err => {
        setError(err.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [subjectId, refreshTrigger]);

  const chaptersWithProgress = useMemo(() => {
    if (!chapters.length) {return [];}
    return chapters.map(ch => ({
      ...ch,
      isCompleted: progressMap[ch.id]?.isCompleted ?? false,
      lastOpenedAt: progressMap[ch.id]?.lastOpenedAt ?? null,
    }));
  }, [chapters, progressMap]);

  return {chapters: chaptersWithProgress, loading, error, refresh};
}
