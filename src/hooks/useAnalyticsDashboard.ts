import { useState, useEffect, useCallback, useRef } from 'react';
import { getAnalyticsStats, EngagementStats } from '../services/firebase/analyticsStats.service';

interface UseAnalyticsDashboardReturn {
    data: EngagementStats | null;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

/**
 * Custom hook to manage date range selection and data fetching for the admin analytics dashboard.
 */
export function useAnalyticsDashboard(daysRange: number = 7): UseAnalyticsDashboardReturn {
    const [data, setData] = useState<EngagementStats | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    
    // Store range reference to prevent unnecessary updates
    const daysRangeRef = useRef(daysRange);
    daysRangeRef.current = daysRange;

    const fetchStats = useCallback(async (): Promise<void> => {
        setLoading(true);
        setError(null);
        try {
            const endDate = new Date();
            // Start of today minus N days
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - daysRangeRef.current);
            startDate.setHours(0, 0, 0, 0);

            const stats = await getAnalyticsStats(startDate, endDate);
            setData(stats);
        } catch (err) {
            setError((err as Error).message || 'Failed to load analytics dashboard data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [daysRange, fetchStats]);

    const refresh = useCallback(async (): Promise<void> => {
        await fetchStats();
    }, [fetchStats]);

    return { data, loading, error, refresh };
}
