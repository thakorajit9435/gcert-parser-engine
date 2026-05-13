import {useState, useEffect} from 'react';
import firestore from '@react-native-firebase/firestore';
import {COLLECTIONS} from '../constants';
import {Standard} from '../types';

interface UseStandardsReturn {
  standards: Standard[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useStandards(): UseStandardsReturn {
  const [standards, setStandards] = useState<Standard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refresh = () => setRefreshTrigger(prev => prev + 1);

  useEffect(() => {
    const query = firestore()
      .collection(COLLECTIONS.STANDARDS)
      .where('isDeleted', '==', false)
      .orderBy('order', 'asc');

    const unsubscribe = query.onSnapshot(
      snapshot => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Standard[];

        setStandards(data);
        setLoading(false);
        setError(null);
      },
      err => {
        setError(err.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [refreshTrigger]);

  return {standards, loading, error, refresh};
}
