import {useState, useEffect} from 'react';
import firestore from '@react-native-firebase/firestore';
import {COLLECTIONS} from '../constants';
import {Chapter} from '../types';

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
        doc => {
          if (doc.exists) {
            setChapter({id: doc.id, ...doc.data()} as Chapter);
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

  return {chapter, loading, error, refresh};
}
