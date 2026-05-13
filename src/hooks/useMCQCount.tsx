import { useState, useEffect, useCallback } from 'react';
import firestore from '@react-native-firebase/firestore';
import { COLLECTIONS } from '../constants';

export function useMCQCount(standardId?: string, sessionId?: string, subjectId?: string) {
    const [count, setCount] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const refresh = useCallback(() => setRefreshTrigger(prev => prev + 1), []);

    useEffect(() => {
        if (!standardId || !sessionId || !subjectId) {
            setLoading(false);
            return;
        }

        const fetchCount = async () => {
            setLoading(true);
            setError(null);
            try {
                const snap = await firestore()
                    .collection(COLLECTIONS.MCQS)
                    .where('standard', '==', standardId)
                    .where('session', '==', sessionId)
                    .where('subjectId', '==', subjectId)
                    .where('isActive', '==', true)
                    .count()
                    .get();

                setCount(snap.data().count);
            } catch (err) {
                console.warn('Failed to get MCQ count:', err);
                setError((err as Error).message);
                setCount(0);
            } finally {
                setLoading(false);
            }
        };

        fetchCount();
    }, [standardId, sessionId, subjectId, refreshTrigger]);

    return { count, loading, error, refresh };
}
