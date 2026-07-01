import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, useWindowDimensions, TouchableOpacity } from 'react-native';
import { adminColors, typography, spacing } from '../../theme';
import { StatCard } from '../../components/admin/StatCard';
import { LoadingState } from '../../components/common/LoadingState';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import { useUserRole } from '../../hooks/useUserRole';
import { formatNumber } from '../../utils';
import { useAnalyticsDashboard } from '../../hooks/useAnalyticsDashboard';
import { AnalyticsOverview, PopularListCard, TrendChart } from '../../components/admin/AnalyticsCard';
import { DashboardStatSkeleton } from '../../components/common';

/**
 * Admin Dashboard with analytics grid cards.
 */
export function DashboardScreen({ navigation }: { navigation: any }): React.JSX.Element {
    const { stats, loading, error, refresh } = useDashboardStats();
    const { canManageContent, canManageUsers } = useUserRole();
    const { width } = useWindowDimensions();

    const [selectedRange, setSelectedRange] = useState<number>(7);
    const {
        data: analyticsData,
        loading: analyticsLoading,
        error: analyticsError,
        refresh: refreshAnalytics
    } = useAnalyticsDashboard(selectedRange);

    const isTablet = width >= 768;
    const cardColumns = isTablet ? 4 : 2;

    const handleRefresh = async () => {
        await Promise.all([refresh(), refreshAnalytics()]);
    };

    useEffect(() => {
        handleRefresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedRange]);


    if (loading && !stats) {
        return <LoadingState message="Loading dashboard…" />;
    }

    const statCards = [
        { title: 'Total Users', value: formatNumber(stats?.totalUsers ?? 0), icon: '👥', color: adminColors.primary },
        { title: 'Premium Users', value: formatNumber(stats?.premiumUsers ?? 0), icon: '💎', color: adminColors.accentPink },
        { title: 'Active Today', value: formatNumber(stats?.activeUsersToday ?? 0), icon: '🟢', color: adminColors.accentGreen },
        { title: 'Total Standards', value: formatNumber(stats?.totalStandards ?? 0), icon: '🏫', color: adminColors.primaryLight },
        { title: 'Total Subjects', value: formatNumber(stats?.totalSubjects ?? 0), icon: '📚', color: adminColors.accent },
        { title: 'Total Chapters', value: formatNumber(stats?.totalChapters ?? 0), icon: '📖', color: adminColors.accentOrange },
        { title: 'Total Quizzes', value: formatNumber(stats?.totalQuizzes ?? 0), icon: '❓', color: adminColors.info },
        { title: 'Quiz Attempts', value: formatNumber(stats?.totalQuizAttempts ?? 0), icon: '📝', color: adminColors.primaryLight },
        { title: 'Top Standard', value: stats?.topPerformingStandard ?? '—', icon: '🏆', color: adminColors.accentOrange },
        { title: 'System Health', value: stats?.systemHealthy ? 'Healthy' : 'Issue', icon: stats?.systemHealthy ? '✅' : '⚠️', color: stats?.systemHealthy ? adminColors.accentGreen : adminColors.accentRed },
    ];

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Dashboard</Text>
                <Text style={styles.subtitle}>
                    {stats?.lastUpdated
                        ? `Last updated: ${stats.lastUpdated.toLocaleTimeString()}`
                        : ''}
                </Text>
            </View>

            {error ? (
                <View style={styles.errorBanner}>
                    <Text style={styles.errorText}>⚠️ {error}</Text>
                </View>
            ) : null}

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={loading || analyticsLoading}
                        onRefresh={handleRefresh}
                        tintColor={adminColors.primary}
                    />
                }
            >
                {/* Stats Grid */}
                <View style={[styles.grid, { flexDirection: 'row', flexWrap: 'wrap' }]}>
                    {statCards.map((card) => (
                        <View
                            key={card.title}
                            style={[
                                styles.gridItem,
                                { width: `${100 / cardColumns}%` as unknown as number },
                                // Simplified: use percentage approximation
                                isTablet ? styles.gridItemTablet : styles.gridItemPhone,
                            ]}
                        >
                            <StatCard
                                title={card.title}
                                value={String(card.value)}
                                icon={card.icon}
                                color={card.color}
                            />
                        </View>
                    ))}
                </View>

                {/* Analytics Date Selector */}
                <View style={styles.rangeSelectorContainer}>
                    <Text style={styles.rangeSelectorTitle}>Analytics Period:</Text>
                    <View style={styles.rangePillsRow}>
                        {[7, 30, 90].map((days) => (
                            <TouchableOpacity
                                key={days}
                                style={[
                                    styles.rangePill,
                                    selectedRange === days && styles.rangePillActive,
                                ]}
                                onPress={() => setSelectedRange(days)}
                            >
                                <Text
                                    style={[
                                        styles.rangePillText,
                                        selectedRange === days && styles.rangePillTextActive,
                                    ]}
                                >
                                    {days} Days
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Analytics Data */}
                {analyticsError ? (
                    <View style={styles.errorBanner}>
                        <Text style={styles.errorText}>⚠️ {analyticsError}</Text>
                    </View>
                ) : analyticsLoading && !analyticsData ? (
                    <View style={styles.analyticsLoadingContainer}>
                        <Text style={styles.loadingText}>Fetching range analytics...</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 10 }}>
                            <DashboardStatSkeleton />
                            <DashboardStatSkeleton />
                            <DashboardStatSkeleton />
                            <DashboardStatSkeleton />
                        </View>
                    </View>
                ) : analyticsData ? (
                    <>
                        <AnalyticsOverview
                            activeUsers={analyticsData.activeUsers}
                            pdfReads={analyticsData.pdfReads}
                            chapterOpens={analyticsData.chapterOpens}
                            quizAttempts={analyticsData.quizAttempts}
                        />

                        <TrendChart trend={analyticsData.dailyActiveTrend} />

                        <View style={styles.popularRow}>
                            <View style={styles.popularCol}>
                                <PopularListCard
                                    title="Popular Subjects"
                                    items={analyticsData.popularSubjects.map(s => ({ id: s.subjectId, name: s.subjectName, count: s.count }))}
                                    icon="📚"
                                    color="#10B981"
                                />
                            </View>
                            <View style={styles.popularCol}>
                                <PopularListCard
                                    title="Popular Quizzes"
                                    items={analyticsData.popularQuizzes.map(q => ({ id: q.quizId, name: q.title, count: q.count }))}
                                    icon="❓"
                                    color="#F59E0B"
                                />
                            </View>
                        </View>
                    </>
                ) : null}

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickScrollWrap}>
                        {canManageContent && (
                            <TouchableOpacity
                                style={styles.quickCard}
                                onPress={() => navigation.navigate('QuizStack')}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.quickIcon}>📝</Text>
                                <Text style={styles.quickLabel}>Manage{`\n`}Quizzes</Text>
                            </TouchableOpacity>
                        )}
                        {canManageContent && (
                            <TouchableOpacity
                                style={styles.quickCard}
                                onPress={() => navigation.navigate('ContentStack')}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.quickIcon}>📚</Text>
                                <Text style={styles.quickLabel}>Content{`\n`}& Subjects</Text>
                            </TouchableOpacity>
                        )}
                        {canManageUsers && (
                            <TouchableOpacity
                                style={styles.quickCard}
                                onPress={() => navigation.navigate('UsersStack')}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.quickIcon}>👥</Text>
                                <Text style={styles.quickLabel}>Manage{`\n`}Users</Text>
                            </TouchableOpacity>
                        )}
                    </ScrollView>
                </View>

                {/* Quick Overview */}
                <View style={styles.section}>
                    <View style={styles.overviewCard}>
                        <View style={styles.overviewRow}>
                            <Text style={styles.overviewLabel}>📊 Content Coverage</Text>
                            <Text style={styles.overviewValue}>
                                {stats?.totalSubjects ?? 0} subjects across 8 standards
                            </Text>
                        </View>
                        <View style={styles.overviewDivider} />
                        <View style={styles.overviewRow}>
                            <Text style={styles.overviewLabel}>📈 User Engagement</Text>
                            <Text style={styles.overviewValue}>
                                {stats?.totalUsers
                                    ? `${Math.round(((stats?.activeUsersToday ?? 0) / stats.totalUsers) * 100)}% active today`
                                    : 'No data'}
                            </Text>
                        </View>
                        <View style={styles.overviewDivider} />
                        <View style={styles.overviewRow}>
                            <Text style={styles.overviewLabel}>💎 Premium Rate</Text>
                            <Text style={styles.overviewValue}>
                                {stats?.totalUsers
                                    ? `${Math.round(((stats?.premiumUsers ?? 0) / stats.totalUsers) * 100)}% premium`
                                    : 'No data'}
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: adminColors.background,
    },
    header: {
        padding: spacing.xl,
        paddingBottom: spacing.md,
    },
    title: {
        fontSize: typography.size.heading,
        fontWeight: typography.weight.bold,
        color: adminColors.textPrimary,
    },
    subtitle: {
        fontSize: typography.size.sm,
        color: adminColors.textMuted,
        marginTop: spacing.xxs,
    },
    errorBanner: {
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        padding: spacing.md,
        marginHorizontal: spacing.xl,
        borderRadius: 8,
    },
    errorText: {
        color: adminColors.accentRed,
        fontSize: typography.size.sm,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: spacing.xl,
        paddingTop: spacing.sm,
    },
    grid: {
        marginHorizontal: -spacing.xs,
    },
    gridItem: {
        padding: spacing.xs,
    },
    gridItemPhone: {
        width: '50%',
    },
    gridItemTablet: {
        width: '25%',
    },
    section: {
        marginTop: spacing.xxl,
    },
    sectionTitle: {
        fontSize: typography.size.lg,
        fontWeight: typography.weight.semibold,
        color: adminColors.textPrimary,
        marginBottom: spacing.md,
    },
    overviewCard: {
        backgroundColor: adminColors.surface,
        borderRadius: 12,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: adminColors.border,
    },
    overviewRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.md,
    },
    overviewLabel: {
        fontSize: typography.size.md,
        color: adminColors.textSecondary,
    },
    overviewValue: {
        fontSize: typography.size.md,
        color: adminColors.textPrimary,
        fontWeight: typography.weight.medium,
    },
    overviewDivider: {
        height: 1,
        backgroundColor: adminColors.border,
    },
    quickScrollWrap: {
        flexDirection: 'row',
        gap: spacing.md,
        paddingBottom: spacing.sm,
    },
    quickCard: {
        width: 110,
        backgroundColor: adminColors.surface,
        borderRadius: 16,
        padding: spacing.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: adminColors.border,
    },
    quickIcon: {
        fontSize: 28,
        marginBottom: spacing.sm,
    },
    quickLabel: {
        fontSize: typography.size.sm,
        color: adminColors.textSecondary,
        fontWeight: typography.weight.semibold,
        textAlign: 'center',
        lineHeight: 18,
    },
    rangeSelectorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: spacing.xl,
        marginBottom: spacing.lg,
    },
    rangeSelectorTitle: {
        fontSize: typography.size.md,
        fontWeight: typography.weight.semibold,
        color: adminColors.textPrimary,
    },
    rangePillsRow: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    rangePill: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: 20,
        backgroundColor: adminColors.surface,
        borderWidth: 1,
        borderColor: adminColors.border,
    },
    rangePillActive: {
        backgroundColor: adminColors.primary,
        borderColor: adminColors.primary,
    },
    rangePillText: {
        fontSize: typography.size.sm,
        color: adminColors.textSecondary,
        fontWeight: typography.weight.medium,
    },
    rangePillTextActive: {
        color: adminColors.textInverse,
        fontWeight: typography.weight.bold,
    },
    popularRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    popularCol: {
        width: '48%',
        minWidth: 150,
    },
    analyticsLoadingContainer: {
        backgroundColor: adminColors.surface,
        padding: spacing.lg,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: adminColors.border,
        marginBottom: spacing.lg,
    },
    loadingText: {
        fontSize: typography.size.sm,
        color: adminColors.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
});
