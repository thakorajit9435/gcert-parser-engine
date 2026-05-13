import { useState, useCallback } from 'react';
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { PaginatedResult, ServiceResult } from '../types';

interface UsePaginationReturn<T> {
    data: T[];
    loading: boolean;
    loadingMore: boolean;
    error: string | null;
    hasMore: boolean;
    loadFirst: () => Promise<void>;
    loadMore: () => Promise<void>;
    refresh: () => Promise<void>;
}

type FetchFn<T> = (
    pageSize: number,
    startAfterDoc?: FirebaseFirestoreTypes.QueryDocumentSnapshot | null,
) => Promise<ServiceResult<PaginatedResult<T>>>;

/**
 * Generic Firestore pagination hook.
 */
export function usePagination<T>(
    fetchFn: FetchFn<T>,
    pageSize: number = 20,
): UsePaginationReturn<T> {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [loadingMore, setLoadingMore] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const [lastDoc, setLastDoc] = useState<FirebaseFirestoreTypes.QueryDocumentSnapshot | null>(null);

    const loadFirst = useCallback(async (): Promise<void> => {
        setLoading(true);
        setError(null);

        const result = await fetchFn(pageSize);

        if (result.success && result.data) {
            setData(result.data.data);
            setLastDoc(result.data.lastDoc);
            setHasMore(result.data.hasMore);
        } else {
            setError(result.error ?? 'Failed to load data.');
        }

        setLoading(false);
    }, [fetchFn, pageSize]);

    const loadMore = useCallback(async (): Promise<void> => {
        if (!hasMore || loadingMore || loading) {
            return;
        }

        setLoadingMore(true);
        setError(null);

        const result = await fetchFn(pageSize, lastDoc);

        if (result.success && result.data) {
            setData((prev) => [...prev, ...result.data!.data]);
            setLastDoc(result.data.lastDoc);
            setHasMore(result.data.hasMore);
        } else {
            setError(result.error ?? 'Failed to load more data.');
        }

        setLoadingMore(false);
    }, [fetchFn, pageSize, lastDoc, hasMore, loadingMore, loading]);

    const refresh = useCallback(async (): Promise<void> => {
        setLastDoc(null);
        setHasMore(true);
        await loadFirst();
    }, [loadFirst]);

    return {
        data,
        loading,
        loadingMore,
        error,
        hasMore,
        loadFirst,
        loadMore,
        refresh,
    };
}
