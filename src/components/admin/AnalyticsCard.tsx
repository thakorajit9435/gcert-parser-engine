import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { adminColors, typography, spacing, borderRadius } from '../../theme';

interface AnalyticsOverviewProps {
    activeUsers: number;
    pdfReads: number;
    chapterOpens: number;
    quizAttempts: number;
}

export function AnalyticsOverview({
    activeUsers,
    pdfReads,
    chapterOpens,
    quizAttempts,
}: AnalyticsOverviewProps): React.JSX.Element {
    const metrics = [
        { label: 'Active Users', value: activeUsers, icon: '👥', color: '#6366F1' },
        { label: 'PDF Reads', value: pdfReads, icon: '📘', color: '#3B82F6' },
        { label: 'Chapter Opens', value: chapterOpens, icon: '📖', color: '#10B981' },
        { label: 'Quiz Attempts', value: quizAttempts, icon: '✍️', color: '#F59E0B' },
    ];

    return (
        <View style={styles.metricsContainer}>
            {metrics.map((metric) => (
                <View key={metric.label} style={styles.metricCard}>
                    <View style={[styles.iconContainer, { backgroundColor: metric.color + '15' }]}>
                        <Text style={[styles.iconText, { color: metric.color }]}>{metric.icon}</Text>
                    </View>
                    <Text style={styles.metricValue}>{metric.value}</Text>
                    <Text style={styles.metricLabel}>{metric.label}</Text>
                </View>
            ))}
        </View>
    );
}

interface PopularItemProps {
    title: string;
    value: string | number;
    percentage: number;
    color: string;
}

function PopularItem({ title, value, percentage, color }: PopularItemProps): React.JSX.Element {
    return (
        <View style={styles.popularItem}>
            <View style={styles.popularItemHeader}>
                <Text style={styles.popularItemTitle} numberOfLines={1}>{title}</Text>
                <Text style={styles.popularItemValue}>{value}</Text>
            </View>
            <View style={styles.progressTrack}>
                <View style={[styles.progressBar, { width: `${percentage}%`, backgroundColor: color }]} />
            </View>
        </View>
    );
}

interface PopularListCardProps {
    title: string;
    items: Array<{ id: string; name: string; count: number }>;
    icon: string;
    color: string;
}

export function PopularListCard({ title, items, icon, color }: PopularListCardProps): React.JSX.Element {
    const maxCount = items.length > 0 ? Math.max(...items.map(i => i.count)) : 1;

    return (
        <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{icon} {title}</Text>
            {items.length === 0 ? (
                <Text style={styles.emptyText}>No data available for this range</Text>
            ) : (
                <View style={styles.itemsList}>
                    {items.map((item) => {
                        const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                        return (
                            <PopularItem
                                key={item.id}
                                title={item.name}
                                value={item.count}
                                percentage={percentage}
                                color={color}
                            />
                        );
                    })}
                </View>
            )}
        </View>
    );
}

interface DailyTrendProps {
    trend: Array<{ date: string; count: number }>;
}

export function TrendChart({ trend }: DailyTrendProps): React.JSX.Element {
    const maxCount = trend.length > 0 ? Math.max(...trend.map(t => t.count)) : 1;

    return (
        <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>📈 Daily Active Users Trend</Text>
            {trend.length === 0 ? (
                <Text style={styles.emptyText}>No trend data available</Text>
            ) : (
                <View style={styles.chartContainer}>
                    <View style={styles.barWrapper}>
                        {trend.map((item, index) => {
                            const barHeight = maxCount > 0 ? (item.count / maxCount) * 120 : 0;
                            return (
                                <View key={item.date + index} style={styles.barColumn}>
                                    <View style={styles.barTextWrapper}>
                                        {item.count > 0 && (
                                            <Text style={styles.barValText}>{item.count}</Text>
                                        )}
                                    </View>
                                    <View style={[styles.chartBar, { height: Math.max(barHeight, 4), backgroundColor: '#6366F1' }]} />
                                    <Text style={styles.barLabel} numberOfLines={1}>{item.date}</Text>
                                </View>
                            );
                        })}
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    metricsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: spacing.lg,
    },
    metricCard: {
        backgroundColor: adminColors.surface,
        width: '48%',
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: adminColors.border,
    },
    iconContainer: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    iconText: {
        fontSize: 18,
    },
    metricValue: {
        fontSize: typography.size.xxl,
        fontWeight: typography.weight.bold,
        color: adminColors.textPrimary,
        marginBottom: spacing.xxs,
    },
    metricLabel: {
        fontSize: typography.size.sm,
        color: adminColors.textSecondary,
    },
    sectionCard: {
        backgroundColor: adminColors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: adminColors.border,
    },
    sectionTitle: {
        fontSize: typography.size.md,
        fontWeight: typography.weight.bold,
        color: adminColors.textPrimary,
        marginBottom: spacing.lg,
    },
    emptyText: {
        fontSize: typography.size.sm,
        color: adminColors.textMuted,
        textAlign: 'center',
        paddingVertical: spacing.xl,
    },
    itemsList: {
        gap: spacing.md,
    },
    popularItem: {
        marginBottom: spacing.xs,
    },
    popularItemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    popularItemTitle: {
        fontSize: typography.size.sm,
        fontWeight: typography.weight.medium,
        color: adminColors.textPrimary,
        flex: 1,
        marginRight: spacing.md,
    },
    popularItemValue: {
        fontSize: typography.size.sm,
        fontWeight: typography.weight.bold,
        color: adminColors.textSecondary,
    },
    progressTrack: {
        height: 6,
        backgroundColor: adminColors.background,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        borderRadius: 3,
    },
    chartContainer: {
        height: 160,
        justifyContent: 'flex-end',
        paddingTop: spacing.lg,
    },
    barWrapper: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: '100%',
    },
    barColumn: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 2,
    },
    barTextWrapper: {
        height: 20,
        justifyContent: 'center',
    },
    barValText: {
        fontSize: 9,
        color: adminColors.textMuted,
        fontWeight: 'bold',
    },
    chartBar: {
        width: '75%',
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
    },
    barLabel: {
        fontSize: 9,
        color: adminColors.textMuted,
        marginTop: spacing.xs,
        textAlign: 'center',
        width: '100%',
    },
});
