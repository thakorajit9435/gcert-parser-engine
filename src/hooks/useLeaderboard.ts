import { useState, useEffect, useCallback } from 'react';
import { LeaderboardEntry } from '../types';
import { getLeaderboard } from '../services/firebase/users.service';

interface UseLeaderboardReturn {
    entries: LeaderboardEntry[];
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

export function useLeaderboard(limit: number = 10): UseLeaderboardReturn {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLeaderboard = useCallback(async (): Promise<void> => {
        setLoading(true);
        setError(null);

        try {
            const result = await getLeaderboard(limit);

            if (result.success && result.data) {
                const ranked: LeaderboardEntry[] = result.data.map((user, index) => ({
                    uid: user.uid,
                    name: user.name || 'Student',
                    standard: user.standard,
                    points: user.points,
                    rank: index + 1,
                    streak: user.streak,
                    premium: user.premium,
                }));
                setEntries(ranked);
            } else {
                setError(result.error ?? 'Failed to load leaderboard.');
            }
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }, [limit]);

    useEffect(() => {
        fetchLeaderboard();
    }, [fetchLeaderboard]);

    return { entries, loading, error, refresh: fetchLeaderboard };
}
