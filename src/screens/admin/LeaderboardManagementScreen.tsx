import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { adminColors, typography, spacing, borderRadius } from '../../theme';
import { LoadingState, EmptyState, Badge, Button } from '../../components/common';
import { useAuth } from '../../hooks/useAuth';
import * as UsersService from '../../services/firebase/users.service';
import { logAuditAction } from '../../services/logging/audit.service';
import { UserProfile, LeaderboardEntry } from '../../types';
import { formatNumber } from '../../utils';

export function LeaderboardManagementScreen(): React.JSX.Element {
    const { userProfile: currentUser } = useAuth();
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [standardFilter, setStandardFilter] = useState<number | undefined>(undefined);

    const loadLeaderboard = useCallback(async (): Promise<void> => {
        setLoading(true);
        const result = await UsersService.getLeaderboard(50, standardFilter);
        if (result.success && result.data) {
            setLeaderboard(result.data.map((u: UserProfile, idx: number) => ({
                uid: u.uid,
                name: u.name,
                standard: u.standard,
                points: u.points,
                rank: idx + 1,
                streak: u.streak,
                premium: u.premium,
            })));
        }
        setLoading(false);
    }, [standardFilter]);

    useEffect(() => { loadLeaderboard(); }, [loadLeaderboard]);

    const handleReset = (): void => {
        Alert.alert('Reset Leaderboard', 'This will set all user points to 0. Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Reset All',
                style: 'destructive',
                onPress: async () => {
                    const result = await UsersService.resetAllPoints();
                    if (result.success && currentUser) {
                        await logAuditAction({
                            action: 'leaderboard_reset',
                            performedBy: currentUser.uid,
                            performedByName: currentUser.name,
                            metadata: { timestamp: new Date().toISOString() },
                        });
                        loadLeaderboard();
                    }
                },
            },
        ]);
    };

    const handleAdjustPoints = (entry: LeaderboardEntry): void => {
        Alert.prompt('Adjust Points', `Current: ${entry.points} pts\nEnter delta:`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Adjust',
                onPress: async (val) => {
                    const delta = parseInt(val ?? '0', 10);
                    if (isNaN(delta) || delta === 0) return;
                    await UsersService.adjustUserPoints(entry.uid, delta);
                    if (currentUser) {
                        await logAuditAction({
                            action: 'user_points_adjusted',
                            performedBy: currentUser.uid,
                            targetId: entry.uid,
                            metadata: { delta, oldPoints: entry.points },
                        });
                    }
                    loadLeaderboard();
                },
            },
        ]);
    };

    const getMedalIcon = (rank: number): string => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return `#${rank}`;
    };

    const renderItem = ({ item }: { item: LeaderboardEntry }): React.JSX.Element => (
        <TouchableOpacity style={styles.entryCard} onPress={() => handleAdjustPoints(item)}>
            <Text style={[styles.rank, item.rank <= 3 && styles.rankTop]}>{getMedalIcon(item.rank)}</Text>
            <View style={styles.entryInfo}>
                <Text style={styles.entryName}>{item.name}</Text>
                <Text style={styles.entryMeta}>Std {item.standard} • 🔥 {item.streak} streak</Text>
            </View>
            <View style={styles.entryRight}>
                <Text style={styles.entryPoints}>{formatNumber(item.points)}</Text>
                <Text style={styles.entryPtsLabel}>points</Text>
                {item.premium ? <Badge label="💎" variant="premium" /> : null}
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>🏆 Leaderboard</Text>
                    <Text style={styles.subtitle}>{leaderboard.length} top performers</Text>
                </View>
                <View style={styles.headerActions}>
                    <Button title="Reset All" variant="danger" size="sm" onPress={handleReset} />
                    <Button title="Export" variant="secondary" size="sm" onPress={() => Alert.alert('Export', 'CSV export placeholder — implement with file system API.')} />
                </View>
            </View>

            {/* Standard Filter */}
            <View style={styles.filterRow}>
                <TouchableOpacity
                    style={[styles.filterChip, !standardFilter && styles.filterChipActive]}
                    onPress={() => setStandardFilter(undefined)}
                >
                    <Text style={[styles.filterText, !standardFilter && styles.filterTextActive]}>All</Text>
                </TouchableOpacity>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(std => (
                    <TouchableOpacity
                        key={std}
                        style={[styles.filterChip, standardFilter === std && styles.filterChipActive]}
                        onPress={() => setStandardFilter(std)}
                    >
                        <Text style={[styles.filterText, standardFilter === std && styles.filterTextActive]}>Std {std}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {loading ? <LoadingState message="Loading leaderboard…" /> : leaderboard.length === 0 ? (
                <EmptyState icon="🏆" title="No Data" message="No leaderboard entries found." />
            ) : (
                <FlatList
                    data={leaderboard}
                    keyExtractor={item => item.uid}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={loading} onRefresh={loadLeaderboard} tintColor={adminColors.primary} />}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: adminColors.background },
    header: { padding: spacing.xl, paddingBottom: spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    title: { fontSize: typography.size.xxl, fontWeight: typography.weight.bold, color: adminColors.textPrimary },
    subtitle: { fontSize: typography.size.sm, color: adminColors.textMuted, marginTop: spacing.xxs },
    headerActions: { flexDirection: 'row', gap: spacing.sm },
    filterRow: { flexDirection: 'row', paddingHorizontal: spacing.xl, marginBottom: spacing.md, gap: spacing.xs, flexWrap: 'wrap' },
    filterChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full, borderWidth: 1, borderColor: adminColors.border },
    filterChipActive: { backgroundColor: adminColors.primary, borderColor: adminColors.primary },
    filterText: { fontSize: typography.size.xs, color: adminColors.textSecondary },
    filterTextActive: { color: '#FFFFFF', fontWeight: typography.weight.semibold },
    listContent: { padding: spacing.xl, paddingTop: 0 },
    entryCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: adminColors.surface, padding: spacing.lg, borderRadius: borderRadius.lg, marginBottom: spacing.sm, borderWidth: 1, borderColor: adminColors.border },
    rank: { fontSize: 18, width: 40, textAlign: 'center', color: adminColors.textMuted },
    rankTop: { fontSize: 24 },
    entryInfo: { flex: 1, marginLeft: spacing.md },
    entryName: { fontSize: typography.size.lg, fontWeight: typography.weight.semibold, color: adminColors.textPrimary },
    entryMeta: { fontSize: typography.size.sm, color: adminColors.textSecondary, marginTop: spacing.xxs },
    entryRight: { alignItems: 'flex-end' },
    entryPoints: { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: adminColors.accentOrange },
    entryPtsLabel: { fontSize: typography.size.xs, color: adminColors.textMuted },
});
