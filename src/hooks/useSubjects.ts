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
      setSubjects([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // 1. Normalize standardId to handle "std_7", "7", 7, "std_07" etc.
    const rawStr = String(standardId).trim();
    const numericStr = rawStr.replace(/[^0-9]/g, '');
    const possibleIds = Array.from(
      new Set(
        [
          rawStr,
          numericStr,
          numericStr ? Number(numericStr) : null,
          numericStr ? `std_${numericStr}` : null,
        ].filter((val): val is string | number => val !== null && val !== '')
      )
    );

    // 2. Query Firestore using 'in' operator (supports up to 10 candidates)
    // We avoid composite orderBy in Firestore query to prevent missing composite index crashes on real devices
    const query = firestore()
      .collection(COLLECTIONS.SUBJECTS)
      .where('standardId', 'in', possibleIds.slice(0, 10));

    const unsubscribe = query.onSnapshot(
      snapshot => {
        if (!snapshot || snapshot.empty) {
          setSubjects([]);
        } else {
          let data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          })) as Subject[];

          // Client-side filter for active subjects (isDeleted is false or undefined)
          data = data.filter(s => s.isDeleted !== true);

          // Client-side filter for session if specified
          if (sessionId) {
            const cleanSession = String(sessionId).toLowerCase().trim();
            data = data.filter(s => {
              if (!s.session) return true;
              const subSession = String(s.session).toLowerCase().trim();
              return (
                subSession === cleanSession ||
                subSession.includes(cleanSession) ||
                cleanSession.includes(subSession)
              );
            });
          }

          // Client-side sort by order ascending
          data.sort((a, b) => (Number(a.order) || 999) - (Number(b.order) || 999));

          setSubjects(data);
        }
        setLoading(false);
        setError(null);
      },
      err => {
        console.warn('[useSubjects] Firestore subscription error:', err.message);
        setError(err.message);
        setSubjects([]);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [standardId, sessionId, refreshTrigger]);

  return {subjects, loading, error, refresh};
}
