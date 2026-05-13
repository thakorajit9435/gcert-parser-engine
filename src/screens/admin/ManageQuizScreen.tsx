import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    Alert,
    ActivityIndicator,
    useWindowDimensions,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { adminColors, typography, spacing, borderRadius, shadows } from '../../theme';
import { useAdminQuizzes } from '../../hooks/useAdminQuizzes';
import { Quiz } from '../../types';
import { COLLECTIONS } from '../../constants';

interface Props {
    navigation: any;
    route: any;
}

/** Lightweight subject name lookup map */
function useSubjectNames(): Record<string, string> {
    const [map, setMap] = useState<Record<string, string>>({});

    useEffect(() => {
        const unsubscribe = firestore()
            .collection(COLLECTIONS.SUBJECTS)
            .where('isDeleted', '==', false)
            .onSnapshot(
                (snapshot) => {
                    const m: Record<string, string> = {};
                    snapshot.docs.forEach((doc) => {
                        const data = doc.data();
                        m[doc.id] = data.name || '';
                    });
                    setMap(m);
                },
                () => { /* silent — non-critical */ },
            );
        return unsubscribe;
    }, []);

    return map;
}

function EmptyState({ onAdd }: { onAdd: () => void }): React.JSX.Element {
    return (
        <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📝</Text>
            <Text style={styles.emptyTitle}>No Quizzes Yet</Text>
            <Text style={styles.emptyMsg}>Tap the button below to create your first quiz.</Text>
            <TouchableOpacity style={styles.createBtn} onPress={onAdd}>
                <Text style={styles.createBtnText}>+ Create Quiz</Text>
            </TouchableOpacity>
        </View>
    );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }): React.JSX.Element {
    return (
        <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>⚠️</Text>
            <Text style={styles.emptyTitle}>Failed to Load</Text>
            <Text style={styles.emptyMsg}>{message}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
                <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
        </View>
    );
}

export function ManageQuizScreen({ navigation }: Props): React.JSX.Element {
    const { quizzes, loading, error, softDelete, refresh } = useAdminQuizzes();
    const subjectNames = useSubjectNames();
    const [refreshing, setRefreshing] = useState(false);
    const { width } = useWindowDimensions();
    const isTablet = width >= 768;

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        refresh();
        setTimeout(() => setRefreshing(false), 800);
    }, [refresh]);

    const handleDelete = useCallback((quiz: Quiz) => {
        Alert.alert(
            'Deactivate Quiz',
            `"${quiz.title}" will be hidden from students. Continue?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Deactivate',
                    style: 'destructive',
                    onPress: async () => {
                        const ok = await softDelete(quiz.id);
                        if (!ok) { Alert.alert('Error', 'Could not deactivate quiz.'); }
                    },
                },
            ],
        );
    }, [softDelete]);

    const handleViewDetail = useCallback((quiz: Quiz) => {
        navigation.navigate('QuizDetail', { quizId: quiz.id, quizTitle: quiz.title });
    }, [navigation]);

    const handleAddQuiz = useCallback(() => {
        navigation.navigate('AddQuiz');
    }, [navigation]);

    const renderQuizCard = useCallback(({ item }: { item: Quiz }) => {
        const subjectLabel = subjectNames[item.subjectId] || '';
        return (
            <View style={[styles.card, isTablet && styles.cardTablet]}>
                <TouchableOpacity
                    style={styles.cardMain}
                    onPress={() => handleViewDetail(item)}
                    activeOpacity={0.75}
                >
                    <View style={styles.cardTop}>
                        <View style={styles.cardTitleWrap}>
                            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                            <Text style={styles.cardStd}>
                                Std {item.standardId}{subjectLabel ? ` • ${subjectLabel}` : ''}
                            </Text>
                        </View>
                        <View style={styles.badgeRow}>
                            {item.isDailyQuiz && (
                                <View style={styles.dailyBadge}>
                                    <Text style={styles.dailyBadgeText}>⚡ Daily</Text>
                                </View>
                            )}
                            <View style={[styles.statusBadge, item.isActive && styles.statusBadgeActive]}>
                                <Text style={[styles.statusBadgeText, item.isActive && styles.statusBadgeTextActive]}>
                                    {item.isActive ? 'Active' : 'Inactive'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.cardMeta}>
                        <Text style={styles.metaItem}>📝 {item.totalQuestions} Q</Text>
                        <Text style={styles.metaItem}>⏱ {Math.floor(item.timeLimitSeconds / 60)}m</Text>
                        <Text style={styles.metaItem}>🎯 {item.passingScore}%</Text>
                        <Text style={styles.metaItem}>🏆 {item.totalMarks} marks</Text>
                        <View style={[styles.diffChip,
                        item.difficulty === 'medium' && styles.diffMed,
                        item.difficulty === 'hard' && styles.diffHard,
                        ]}>
                            <Text style={styles.diffChipText}>{item.difficulty}</Text>
                        </View>
                    </View>
                </TouchableOpacity>

                <View style={styles.cardActions}>
                    <TouchableOpacity
                        style={styles.actionEdit}
                        onPress={() => handleViewDetail(item)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.actionEditText}>✏️ Edit / Questions</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionDelete}
                        onPress={() => handleDelete(item)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.actionDeleteText}>🚫 Deactivate</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }, [isTablet, handleViewDetail, handleDelete, subjectNames]);

    return (
        <View style={styles.container}>
            {error ? (
                <View style={styles.errorBanner}>
                    <Text style={styles.errorBannerText}>⚠️ {error}</Text>
                </View>
            ) : null}

            {loading && quizzes.length === 0 ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={adminColors.primary} />
                    <Text style={styles.centeredMsg}>Loading quizzes…</Text>
                </View>
            ) : error && quizzes.length === 0 ? (
                <ErrorState message={error} onRetry={refresh} />
            ) : (
                <FlatList
                    data={quizzes}
                    keyExtractor={(item) => item.id}
                    numColumns={isTablet ? 2 : 1}
                    key={isTablet ? 'tablet' : 'phone'}
                    contentContainerStyle={[styles.listPad, quizzes.length === 0 && styles.listFlex]}
                    columnWrapperStyle={isTablet ? styles.tabletRow : undefined}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={adminColors.primary}
                            colors={[adminColors.primary]}
                        />
                    }
                    renderItem={renderQuizCard}
                    ListEmptyComponent={<EmptyState onAdd={handleAddQuiz} />}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* FAB — always visible so admin can always create a quiz */}
            <TouchableOpacity style={styles.fab} onPress={handleAddQuiz} activeOpacity={0.85}>
                <Text style={styles.fabText}>＋</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: adminColors.background,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: adminColors.background,
        gap: spacing.md,
    },
    centeredMsg: {
        fontSize: typography.size.md,
        color: adminColors.textMuted,
        marginTop: spacing.sm,
    },
    errorBanner: {
        backgroundColor: adminColors.error + '22',
        padding: spacing.md,
        marginHorizontal: spacing.xl,
        marginTop: spacing.sm,
        borderRadius: borderRadius.md,
    },
    errorBannerText: {
        color: adminColors.error,
        fontSize: typography.size.sm,
    },
    listPad: {
        padding: spacing.lg,
        paddingBottom: 100,
    },
    listFlex: {
        flex: 1,
    },
    tabletRow: {
        gap: spacing.md,
    },
    card: {
        backgroundColor: adminColors.surface,
        borderRadius: borderRadius.xl,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: adminColors.border,
        overflow: 'hidden',
        ...shadows.md,
    },
    cardTablet: {
        flex: 1,
    },
    cardMain: {
        padding: spacing.lg,
    },
    cardTop: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: spacing.sm,
    },
    cardTitleWrap: {
        flex: 1,
        marginRight: spacing.sm,
    },
    cardTitle: {
        fontSize: typography.size.lg,
        fontWeight: typography.weight.semibold,
        color: adminColors.textPrimary,
    },
    cardStd: {
        fontSize: typography.size.sm,
        color: adminColors.textMuted,
        marginTop: spacing.xxs,
    },
    badgeRow: {
        flexDirection: 'row',
        gap: spacing.xs,
        flexWrap: 'wrap',
        alignItems: 'center',
    },
    dailyBadge: {
        backgroundColor: '#FFD54F22',
        borderRadius: borderRadius.sm,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xxs,
        borderWidth: 1,
        borderColor: '#FFD54F',
    },
    dailyBadgeText: {
        fontSize: typography.size.xs,
        fontWeight: typography.weight.bold,
        color: '#E65100',
    },
    statusBadge: {
        backgroundColor: adminColors.surfaceElevated,
        borderRadius: borderRadius.sm,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xxs,
        borderWidth: 1,
        borderColor: adminColors.border,
    },
    statusBadgeActive: {
        backgroundColor: adminColors.accentGreen + '22',
        borderColor: adminColors.accentGreen,
    },
    statusBadgeText: {
        fontSize: typography.size.xs,
        fontWeight: typography.weight.bold,
        color: adminColors.textMuted,
    },
    statusBadgeTextActive: {
        color: adminColors.accentGreen,
    },
    cardMeta: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
        alignItems: 'center',
    },
    metaItem: {
        fontSize: typography.size.sm,
        color: adminColors.textSecondary,
    },
    diffChip: {
        backgroundColor: adminColors.accentGreen + '22',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xxs,
        borderRadius: borderRadius.xs,
    },
    diffMed: {
        backgroundColor: adminColors.accentOrange + '22',
    },
    diffHard: {
        backgroundColor: adminColors.error + '22',
    },
    diffChipText: {
        fontSize: typography.size.xs,
        textTransform: 'uppercase',
        fontWeight: typography.weight.bold,
        color: adminColors.textSecondary,
    },
    cardActions: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: adminColors.border,
    },
    actionEdit: {
        flex: 1,
        paddingVertical: spacing.md,
        alignItems: 'center',
        borderRightWidth: 1,
        borderRightColor: adminColors.border,
    },
    actionEditText: {
        fontSize: typography.size.sm,
        color: adminColors.primary,
        fontWeight: typography.weight.semibold,
    },
    actionDelete: {
        flex: 1,
        paddingVertical: spacing.md,
        alignItems: 'center',
    },
    actionDeleteText: {
        fontSize: typography.size.sm,
        color: adminColors.error,
        fontWeight: typography.weight.semibold,
    },
    empty: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: spacing.huge,
    },
    emptyEmoji: {
        fontSize: 56,
        marginBottom: spacing.lg,
    },
    emptyTitle: {
        fontSize: typography.size.xl,
        fontWeight: typography.weight.semibold,
        color: adminColors.textPrimary,
        marginBottom: spacing.xs,
    },
    emptyMsg: {
        fontSize: typography.size.md,
        color: adminColors.textMuted,
        textAlign: 'center',
    },
    createBtn: {
        marginTop: spacing.xl,
        backgroundColor: adminColors.primary,
        paddingHorizontal: spacing.xxl,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
    },
    createBtnText: {
        fontSize: typography.size.md,
        fontWeight: typography.weight.bold,
        color: '#FFFFFF',
    },
    retryBtn: {
        marginTop: spacing.xl,
        backgroundColor: adminColors.primary,
        paddingHorizontal: spacing.xxl,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
    },
    retryBtnText: {
        fontSize: typography.size.md,
        fontWeight: typography.weight.bold,
        color: '#FFFFFF',
    },
    fab: {
        position: 'absolute',
        bottom: spacing.xxl,
        right: spacing.xxl,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: adminColors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        ...shadows.lg,
    },
    fabText: {
        fontSize: 32,
        color: '#FFFFFF',
        lineHeight: 36,
        fontWeight: typography.weight.bold,
    },
});
