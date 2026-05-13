import {useState, useEffect} from 'react';
import firestore from '@react-native-firebase/firestore';
import {COLLECTIONS} from '../constants';
import {Session} from '../types';

interface UseSessionsReturn {
  sessions: Session[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useSessions(standardId?: string): UseSessionsReturn {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refresh = () => setRefreshTrigger(prev => prev + 1);

  useEffect(() => {
    if (!standardId) {
      setLoading(false);
      return;
    }

    const query = firestore()
      .collection(COLLECTIONS.SESSIONS)
      .where('standardId', '==', standardId)
      .where('isDeleted', '==', false);

    const unsubscribe = query.onSnapshot(
      snapshot => {
        if (snapshot.empty) {
          setSessions([]);
        } else {
          const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          })) as Session[];
          data.sort((a, b) => (a.order || 0) - (b.order || 0));
          setSessions(data);
        }
        setLoading(false);
        setError(null);
      },
      err => {
        setError(err.message);
        setSessions([]);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [standardId, refreshTrigger]);

  return {sessions, loading, error, refresh};
}
