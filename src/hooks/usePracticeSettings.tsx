import { useState, useEffect } from 'react';
import firestore from '@react-native-firebase/firestore';
import { COLLECTIONS } from '../constants';
import { PracticeSettings } from '../types';

export function usePracticeSettings(standardId?: string, sessionId?: string) {
    const [settings, setSettings] = useState<PracticeSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tick, setTick] = useState(0);

    const refresh = () => setTick(t => t + 1);

    useEffect(() => {
        if (!standardId || !sessionId) {
            setSettings(null);
            setLoading(false);
            return;
        }

        setLoading(true);

        const unsubscribe = firestore()
            .collection(COLLECTIONS.PRACTICE_SETTINGS)
            .where('standard', '==', standardId)
            .where('session', '==', sessionId)
            .limit(1)
            .onSnapshot(
                (snap) => {
                    if (snap.empty || !snap.docs[0]) {
                        setSettings(null);
                    } else {
                        const doc = snap.docs[0];
                        setSettings({ id: doc.id, ...doc.data() } as PracticeSettings);
                    }
                    setLoading(false);
                },
                (err) => {
                    console.error('Error fetching settings:', err);
                    setError((err as Error).message);
                    setLoading(false);
                }
            );

        return () => unsubscribe();
    }, [standardId, sessionId, tick]);

    return { settings, loading, error, refresh };
}
