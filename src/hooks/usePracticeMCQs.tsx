import { useState, useCallback } from 'react';
import firestore from '@react-native-firebase/firestore';
import { COLLECTIONS } from '../constants';
import { MCQ } from '../types';

export function usePracticeMCQs() {
    const [mcqs, setMcqs] = useState<MCQ[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPracticeMCQs = useCallback(async ({
        standardId,
        sessionId,
        subjectId,
        chapterId,
        count,
    }: {
        standardId: string;
        sessionId: string;
        subjectId: string;
        chapterId?: string; // If undefined, it's a mix test
        count: number;
    }) => {
        setLoading(true);
        setError(null);

        try {
            let query = firestore()
                .collection(COLLECTIONS.MCQS)
                .where('standard', '==', standardId)
                .where('session', '==', sessionId)
                .where('subjectId', '==', subjectId)
                .where('isActive', '==', true);

            if (chapterId) {
                query = query.where('chapterId', '==', chapterId);
            }

            // We do not have a robust random selection natively in Firestore without sacrificing cost or setup.
            // Best practice for <500 items is to fetch and shuffle client side.
            // Alternatively, fetch a larger limit and shuffle, then slice in memory.
            const snap = await query.get();
            let data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MCQ));

            // Optional: if size > X, you can do more complex random selection but for typical sizes client-side shuffle is fine
            // Shuffle algorithm (Fisher-Yates) for questions
            for (let i = data.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                const temp = data[i];
                if (temp && data[j]) {
                    data[i] = data[j] as MCQ;
                    data[j] = temp as MCQ;
                }
            }

            // Slice to requested count
            const selected = data.slice(0, count);

            // Also shuffle options within each question
            const finalData = selected.map(q => {
                // Ensure options are exactly 4
                if (!q.options || q.options.length === 0) return q;

                const optionsWithOriginalIndex = q.options.map((opt, i) => ({ opt, index: i }));

                // Shuffle options
                for (let i = optionsWithOriginalIndex.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    const tempOpt = optionsWithOriginalIndex[i];
                    if (tempOpt && optionsWithOriginalIndex[j]) {
                        optionsWithOriginalIndex[i] = optionsWithOriginalIndex[j] as { opt: string, index: number };
                        optionsWithOriginalIndex[j] = tempOpt as { opt: string, index: number };
                    }
                }

                // Find new index of the originally correct option
                const newCorrectAnswerIndex = optionsWithOriginalIndex.findIndex(o => o.index === q.correctAnswer);

                return {
                    ...q,
                    options: optionsWithOriginalIndex.map(o => o.opt),
                    correctAnswer: newCorrectAnswerIndex !== -1 ? newCorrectAnswerIndex : 0 // Fallback just in case
                };
            });

            setMcqs(finalData);
            return finalData;

        } catch (err) {
            console.error('Fetch practice MCQs Error:', err);
            setError((err as Error).message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    return { mcqs, loading, error, fetchPracticeMCQs };
}
