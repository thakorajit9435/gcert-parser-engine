import {useState, useEffect} from 'react';
import firestore from '@react-native-firebase/firestore';
import {COLLECTIONS} from '../constants';
import {Subject} from '../types';

interface UseSubjectsReturn {
  subjects: Subject[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useSubjects(
  standardId?: string,
  sessionId?: string,
): UseSubjectsReturn {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refresh = () => setRefreshTrigger(prev => prev + 1);

  useEffect(() => {
    if (!standardId) {
      setLoading(false);
      return;
    }

    let query = firestore()
      .collection(COLLECTIONS.SUBJECTS)
      .where('standardId', '==', standardId)
      .where('isDeleted', '==', false);

    const unsubscribe = query.onSnapshot(
      snapshot => {
        if (snapshot.empty) {
          setSubjects([]);
        } else {
          let data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          })) as Subject[];

          // Client-side sorting to resolve missing composite index constraint
          data.sort((a, b) => (a.order || 0) - (b.order || 0));

          if (sessionId) {
            // Client-side filter to resolve missing composite index
            data = data.filter(s => !s.session || s.session === sessionId);
          }

          setSubjects(data);
        }
        setLoading(false);
        setError(null);
      },
      err => {
        setError(err.message);
        setSubjects([]);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [standardId, sessionId, refreshTrigger]);

  return {subjects, loading, error, refresh};
}
