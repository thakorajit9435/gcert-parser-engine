import {useState, useEffect, useCallback, useRef} from 'react';
import {DashboardStats} from '../types';
import {DASHBOARD_CACHE_TTL_MS, COLLECTIONS} from '../constants';
import {
  getTotalUserCount,
  getPremiumUserCount,
  getActiveUsersTodayCount,
} from '../services/firebase/users.service';
import {
  getTotalStandards,
  getTotalSubjects,
  getTotalChapters,
  getTotalQuizzes,
  getTotalQuizAttempts,
} from '../services/firebase/content.service';
import {getRevenueSummary} from '../services/firebase/subscriptions.service';

interface UseDashboardStatsReturn {
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Dashboard stats hook with caching.
 */
export function useDashboardStats(): UseDashboardStatsReturn {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const lastFetchRef = useRef<number>(0);

  const fetchStats = useCallback(
    async (force: boolean = false): Promise<void> => {
      const now = Date.now();
      if (
        !force &&
        now - lastFetchRef.current < DASHBOARD_CACHE_TTL_MS &&
        stats
      ) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [
          totalUsers,
          premiumUsers,
          activeUsersToday,
          totalStandards,
          totalSubjects,
          totalChapters,
          totalQuizzes,
          totalQuizAttempts,
          revenueResult,
        ] = await Promise.all([
          getTotalUserCount(),
          getPremiumUserCount(),
          getActiveUsersTodayCount(),
          getTotalStandards(),
          getTotalSubjects(),
          getTotalChapters(),
          getTotalQuizzes(),
          getTotalQuizAttempts(),
          getRevenueSummary(),
        ]);

        const dashboardStats: DashboardStats = {
          totalUsers,
          premiumUsers,
          activeUsersToday,
          totalStandards,
          totalSubjects,
          totalChapters,
          totalQuizzes,
          totalQuizAttempts,
          revenue: revenueResult.success ? revenueResult.data ?? 0 : 0,
          topPerformingStandard: null, // Would require aggregation query
          systemHealthy: true,
          lastUpdated: new Date(),
        };

        setStats(dashboardStats);
        lastFetchRef.current = now;
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [stats],
  );

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = useCallback(async (): Promise<void> => {
    await fetchStats(true);
  }, [fetchStats]);

  return {stats, loading, error, refresh};
}

// Suppress unused import warnings
void COLLECTIONS;
