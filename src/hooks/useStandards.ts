import {useState, useEffect} from 'react';
import firestore from '@react-native-firebase/firestore';
import {COLLECTIONS} from '../constants';
import {Standard} from '../types';
import {logCrashError} from '../services/crashlytics';

interface UseStandardsReturn {
  standards: Standard[];
  loading: boolean;
  error: string | null;
  isFallback: boolean;
  refresh: () => void;
}

const FALLBACK_STANDARDS: Standard[] = Array.from({length: 12}, (_, i) => {
  const num = i + 1;
  return {
    id: `std_${num}`,
    number: num,
    label: `Std ${num}`,
    labelGu: `ધોરણ ${num}`,
    order: num,
    isDeleted: false,
    createdAt: {seconds: 0, nanoseconds: 0} as any,
    updatedAt: {seconds: 0, nanoseconds: 0} as any,
  };
});

let isSeeding = false;

async function seedStandards() {
  if (isSeeding) return;
  isSeeding = true;
  console.log('[useStandards] Seeding standards 1-12 in development mode...');
  try {
    const batch = firestore().batch();
    const now = firestore.FieldValue.serverTimestamp();
    for (let i = 1; i <= 12; i++) {
      const docRef = firestore()
        .collection(COLLECTIONS.STANDARDS)
        .doc(`std_${i}`);
      batch.set(docRef, {
        number: i,
        label: `Std ${i}`,
        labelGu: `ધોરણ ${i}`,
        order: i,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
      });
    }
    await batch.commit();
    console.log('[useStandards] Seeding standards completed successfully.');
  } catch (err) {
    console.error('[useStandards] Error seeding standards:', err);
    logCrashError(err, 'firestore_error', {action: 'seedStandards'});
  } finally {
    isSeeding = false;
  }
}

export function useStandards(): UseStandardsReturn {
  const [standards, setStandards] = useState<Standard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refresh = () => setRefreshTrigger(prev => prev + 1);

  useEffect(() => {
    console.log('[useStandards] Fetching standards...');
    setLoading(true);
    const query = firestore()
      .collection(COLLECTIONS.STANDARDS)
      .where('isDeleted', '==', false);

    const unsubscribe = query.onSnapshot(
      snapshot => {
        if (snapshot.empty) {
          console.log('[useStandards] No standards found in Firestore.');
          setStandards(FALLBACK_STANDARDS);
          setIsFallback(true);
          setLoading(false);
          setError(null);

          // Auto-seed in development mode
          if (__DEV__) {
            seedStandards();
          }
        } else {
          const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          })) as Standard[];

          // Client-side sorting to resolve missing composite index constraint
          data.sort((a, b) => (a.order || 0) - (b.order || 0));

          console.log(
            `[useStandards] Loaded ${data.length} standards from Firestore.`,
          );
          setStandards(data);
          setIsFallback(false);
          setLoading(false);
          setError(null);
        }
      },
      err => {
        console.error('[useStandards] Error loading standards:', err);
        logCrashError(err, 'firestore_error', {action: 'useStandards'});
        setError(err.message);
        setStandards(FALLBACK_STANDARDS); // Provide fallback even on error
        setIsFallback(true);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [refreshTrigger]);

  return {standards, loading, error, isFallback, refresh};
}
