import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    Alert,
    RefreshControl,
} from 'react-native';
import { adminColors, typography, spacing, borderRadius } from '../../theme';
import { LoadingState, EmptyState, Badge, Pagination, Button } from '../../components/common';
import { useAuth } from '../../hooks/useAuth';
import * as SubsService from '../../services/firebase/subscriptions.service';
import { logAuditAction } from '../../services/logging/audit.service';
import { Subscription, SubscriptionPlanType } from '../../types';
import { SUBSCRIPTION_PLANS, DEFAULT_PAGE_SIZE } from '../../constants';
import { formatTimestamp, formatCurrency } from '../../utils';
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export function PremiumManagementScreen(): React.JSX.Element {
    const { userProfile } = useAuth();
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [lastDoc, setLastDoc] = useState<FirebaseFirestoreTypes.QueryDocumentSnapshot | null>(null);
    const [totalRevenue, setTotalRevenue] = useState(0);

    const loadSubscriptions = useCallback(async (): Promise<void> => {
        setLoading(true);
        const [subsResult, revResult] = await Promise.all([
            SubsService.getSubscriptions(DEFAULT_PAGE_SIZE),
            SubsService.getRevenueSummary(),
        ]);

        if (subsResult.success && subsResult.data) {
            setSubscriptions(subsResult.data.data);
            setLastDoc(subsResult.data.lastDoc);
            setHasMore(subsResult.data.hasMore);
        }
        if (revResult.success) {
            setTotalRevenue(revResult.data ?? 0);
        }
        setLoading(false);
    }, []);

    const loadMore = useCallback(async (): Promise<void> => {
        if (!hasMore || loadingMore) {return;}
        setLoadingMore(true);
        const result = await SubsService.getSubscriptions(DEFAULT_PAGE_SIZE, lastDoc);
        if (result.success && result.data) {
            setSubscriptions(prev => [...prev, ...result.data!.data]);
            setLastDoc(result.data.lastDoc);
            setHasMore(result.data.hasMore);
        }
        setLoadingMore(false);
    }, [hasMore, loadingMore, lastDoc]);

    useEffect(() => { loadSubscriptions(); }, [loadSubscriptions]);

    const handleManualActivate = (): void => {
        Alert.prompt('Manual Activation', 'Enter User ID:', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Next',
                onPress: (userId) => {
                    if (!userId?.trim()) {return;}
                    showPlanSelection(userId.trim());
                },
            },
        ]);
    };

    const showPlanSelection = (userId: string): void => {
        Alert.alert('Select Plan', 'Choose subscription plan:', [
            ...SUBSCRIPTION_PLANS.map(plan => ({
                text: `${plan.label} (${plan.labelGu})`,
                onPress: async () => {
                    const result = await SubsService.manualActivateSubscription(
                        userId,
                        plan.type as SubscriptionPlanType,
                        plan.durationDays,
                    );
                    if (result.success && userProfile) {
                        await logAuditAction({
                            action: 'subscription_activated',
                            performedBy: userProfile.uid,
                            performedByName: userProfile.name,
                            targetId: userId,
                            targetType: 'subscription',
                            metadata: { planType: plan.type, isManual: true },
                        });
                        loadSubscriptions();
                    }
                },
            })),
            { text: 'Cancel', style: 'cancel' },
        ]);
    };

    const getStatusBadge = (status: string): 'success' | 'error' | 'warning' | 'default' => {
        switch (status) {
            case 'active': return 'success';
            case 'expired': return 'error';
            case 'cancelled': return 'warning';
            default: return 'default';
        }
    };

    const renderItem = ({ item }: { item: Subscription }): React.JSX.Element => (
        <View style={styles.subCard}>
            <View style={styles.subHeader}>
                <Text style={styles.subUserId}>User: {item.userId.substring(0, 12)}…</Text>
                <Badge label={item.status} variant={getStatusBadge(item.status)} />
            </View>
            <View style={styles.subDetails}>
                <Text style={styles.subDetail}>📋 {item.planType.toUpperCase()}</Text>
                <Text style={styles.subDetail}>💰 {formatCurrency(item.amount)}</Text>
                <Text style={styles.subDetail}>📅 {formatTimestamp(item.startDate, 'en-IN')} → {formatTimestamp(item.endDate, 'en-IN')}</Text>
                {item.isManual ? <Badge label="Manual" variant="warning" /> : null}
                {item.razorpayPaymentId ? <Text style={styles.subDetail}>🔗 {item.razorpayPaymentId}</Text> : null}
            </View>
        </View>
    );

    if (loading) {return <LoadingState message="Loading subscriptions…" />;}

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Premium Management</Text>
                    <Text style={styles.subtitle}>Total Revenue: {formatCurrency(totalRevenue)}</Text>
                </View>
                <Button title="+ Manual Activate" onPress={handleManualActivate} size="sm" />
            </View>

            {subscriptions.length === 0 ? (
                <EmptyState icon="💎" title="No Subscriptions" message="No subscription records found." />
            ) : (
                <FlatList
                    data={subscriptions}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={loading} onRefresh={loadSubscriptions} tintColor={adminColors.primary} />}
                    ListFooterComponent={<Pagination hasMore={hasMore} loadingMore={loadingMore} onLoadMore={loadMore} totalShown={subscriptions.length} />}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: adminColors.background },
    header: { padding: spacing.xl, paddingBottom: spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: typography.size.xxl, fontWeight: typography.weight.bold, color: adminColors.textPrimary },
    subtitle: { fontSize: typography.size.md, color: adminColors.accentGreen, marginTop: spacing.xxs },
    listContent: { padding: spacing.xl, paddingTop: 0 },
    subCard: { backgroundColor: adminColors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: adminColors.border },
    subHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
    subUserId: { fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: adminColors.textPrimary },
    subDetails: { gap: spacing.xs },
    subDetail: { fontSize: typography.size.sm, color: adminColors.textSecondary },
});

// void activatingUserId;
