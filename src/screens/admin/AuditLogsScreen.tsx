import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { adminColors, typography, spacing, borderRadius } from '../../theme';
import { LoadingState, EmptyState, Badge, Pagination } from '../../components/common';
import * as AuditService from '../../services/logging/audit.service';
import { AuditLog } from '../../types';
import { DEFAULT_PAGE_SIZE } from '../../constants';
import { formatDateTime } from '../../utils';
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export function AuditLogsScreen(): React.JSX.Element {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [lastDoc, setLastDoc] = useState<FirebaseFirestoreTypes.QueryDocumentSnapshot | null>(null);

    const loadLogs = useCallback(async (): Promise<void> => {
        setLoading(true);
        const result = await AuditService.getAuditLogs(DEFAULT_PAGE_SIZE);
        if (result.success && result.data) {
            setLogs(result.data.data);
            setLastDoc(result.data.lastDoc);
            setHasMore(result.data.hasMore);
        }
        setLoading(false);
    }, []);

    const loadMore = useCallback(async (): Promise<void> => {
        if (!hasMore || loadingMore) {return;}
        setLoadingMore(true);
        const result = await AuditService.getAuditLogs(DEFAULT_PAGE_SIZE, lastDoc);
        if (result.success && result.data) {
            setLogs(prev => [...prev, ...result.data!.data]);
            setLastDoc(result.data.lastDoc);
            setHasMore(result.data.hasMore);
        }
        setLoadingMore(false);
    }, [hasMore, loadingMore, lastDoc]);

    useEffect(() => { loadLogs(); }, [loadLogs]);

    const getActionBadge = (action: string): 'success' | 'error' | 'warning' | 'info' | 'default' => {
        if (action.includes('deleted') || action.includes('blocked') || action.includes('reset')) {return 'error';}
        if (action.includes('created') || action.includes('activated') || action.includes('unblocked')) {return 'success';}
        if (action.includes('updated') || action.includes('changed') || action.includes('toggled')) {return 'warning';}
        return 'info';
    };

    const formatAction = (action: string): string => {
        return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const renderItem = ({ item }: { item: AuditLog }): React.JSX.Element => (
        <View style={styles.logCard}>
            <View style={styles.logHeader}>
                <Badge label={formatAction(item.action)} variant={getActionBadge(item.action)} />
                <Text style={styles.logTime}>{formatDateTime(item.timestamp, 'en-IN')}</Text>
            </View>
            <Text style={styles.logPerformer}>
                👤 {item.performedByName || item.performedBy.substring(0, 12)}
            </Text>
            {item.targetId ? (
                <Text style={styles.logTarget}>
                    🎯 {item.targetType}: {item.targetId.substring(0, 16)}…
                </Text>
            ) : null}
            {Object.keys(item.metadata).length > 0 ? (
                <Text style={styles.logMeta}>
                    📋 {JSON.stringify(item.metadata).substring(0, 100)}
                </Text>
            ) : null}
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>📋 Audit Logs</Text>
                <Text style={styles.subtitle}>All admin actions are recorded</Text>
            </View>

            {loading ? <LoadingState message="Loading audit logs…" /> : logs.length === 0 ? (
                <EmptyState icon="📋" title="No Audit Logs" message="Admin actions will appear here." />
            ) : (
                <FlatList
                    data={logs}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={loading} onRefresh={loadLogs} tintColor={adminColors.primary} />}
                    ListFooterComponent={<Pagination hasMore={hasMore} loadingMore={loadingMore} onLoadMore={loadMore} totalShown={logs.length} />}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: adminColors.background },
    header: { padding: spacing.xl, paddingBottom: spacing.md },
    title: { fontSize: typography.size.xxl, fontWeight: typography.weight.bold, color: adminColors.textPrimary },
    subtitle: { fontSize: typography.size.sm, color: adminColors.textMuted, marginTop: spacing.xxs },
    listContent: { padding: spacing.xl, paddingTop: 0 },
    logCard: {
        backgroundColor: adminColors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: adminColors.border,
        borderLeftWidth: 3,
        borderLeftColor: adminColors.primary,
    },
    logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
    logTime: { fontSize: typography.size.xs, color: adminColors.textMuted },
    logPerformer: { fontSize: typography.size.sm, color: adminColors.textSecondary, marginBottom: spacing.xxs },
    logTarget: { fontSize: typography.size.sm, color: adminColors.textSecondary, marginBottom: spacing.xxs },
    logMeta: { fontSize: typography.size.xs, color: adminColors.textMuted, marginTop: spacing.xs },
});
