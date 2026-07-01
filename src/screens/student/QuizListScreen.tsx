import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useQuizzes } from '../../hooks/useQuizzes';
import { studentColors, typography, spacing, borderRadius, shadows } from '../../theme';
import { Quiz } from '../../types';
import { useTranslation } from 'react-i18next';
import { EmptyState, Skeleton, QuizCardSkeleton } from '../../components/common';
import { PremiumModal } from '../../components/student/PremiumModal';
import { useAuth } from '../../hooks/useAuth';

export function QuizListScreen({ route, navigation }: { route: any; navigation: any }): React.JSX.Element {
    const { t } = useTranslation();
    const { chapterId, subjectId, isMixed, chapterTitle } = route.params || {};

    // For chapter wise quizzes, we pass chapterId. 
    // For mixed quizzes, we pass subjectId and isMixed = true.
    const filters = isMixed ? { subjectId, isMixed: true } : { chapterId };

    const { quizzes, loading, error } = useQuizzes(filters);
    const { userProfile } = useAuth();
    const isPremiumUser = userProfile?.premium ?? false;
    const [premiumModalVisible, setPremiumModalVisible] = React.useState(false);

    const handleQuizPress = (quiz: Quiz) => {
        if (quiz.isPremium && !isPremiumUser) {
            setPremiumModalVisible(true);
            return;
        }
        navigation.navigate('Quiz', { quizId: quiz.id });
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'easy': return '#4caf50';
            case 'medium': return '#fb8c00';
            case 'hard': return '#e53935';
            default: return studentColors.textMuted;
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Skeleton width="40%" height={24} borderRadius={4} />
                </View>
                <View style={styles.listContent}>
                    <QuizCardSkeleton />
                    <QuizCardSkeleton />
                    <QuizCardSkeleton />
                </View>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>⚠️ Failed to load quizzes</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>
                    {isMixed ? '🔀 Mixed Quizzes' : '📝 Quizzes'}
                </Text>
                {chapterTitle && (
                    <Text style={styles.headerSubtitle}>{chapterTitle}</Text>
                )}
            </View>

            {quizzes.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <EmptyState
                        icon="📭"
                        title={t('common.noData')}
                        message="No quizzes available right now."
                    />
                </View>
            ) : (
                <FlatList
                    data={quizzes}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    initialNumToRender={10}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                    renderItem={({ item }: { item: Quiz }) => (
                        <TouchableOpacity
                            style={styles.quizCard}
                            activeOpacity={0.7}
                            onPress={() => handleQuizPress(item)}
                        >
                            <View style={styles.quizInfo}>
                                <Text style={styles.quizTitle}>{item.title}</Text>
                                <Text style={styles.quizSubtitle}>{item.titleGu}</Text>
                                <View style={styles.metaRow}>
                                    <Text style={styles.metaText}>
                                        ⏱ {Math.floor(item.timeLimitSeconds / 60)} mins
                                    </Text>
                                    <Text style={styles.metaText}>
                                        📊 {item.totalQuestions} Questions
                                    </Text>
                                    <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(item.difficulty) + '20' }]}>
                                        <Text style={[styles.difficultyText, { color: getDifficultyColor(item.difficulty) }]}>
                                            {item.difficulty.toUpperCase()}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                            <Text style={styles.chevron}>›</Text>
                        </TouchableOpacity>
                    )}
                />
            )}

            <PremiumModal
                visible={premiumModalVisible}
                onClose={() => setPremiumModalVisible(false)}
                onUpgrade={() => {
                    setPremiumModalVisible(false);
                    navigation.navigate('PremiumAccess');
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: studentColors.background,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: typography.size.lg,
        color: studentColors.error,
        fontWeight: typography.weight.semibold,
    },
    header: {
        padding: spacing.xl,
        backgroundColor: studentColors.surface,
        borderBottomWidth: 1,
        borderBottomColor: studentColors.border,
    },
    headerTitle: {
        fontSize: typography.size.xxl,
        fontWeight: typography.weight.bold,
        color: studentColors.textPrimary,
    },
    headerSubtitle: {
        fontSize: typography.size.md,
        color: studentColors.textSecondary,
        marginTop: spacing.xs,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: spacing.huge,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: spacing.md,
    },
    emptyText: {
        fontSize: typography.size.md,
        color: studentColors.textMuted,
    },
    listContent: {
        padding: spacing.xl,
    },
    quizCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: studentColors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: studentColors.border,
        ...shadows.sm,
    },
    quizInfo: {
        flex: 1,
    },
    quizTitle: {
        fontSize: typography.size.lg,
        fontWeight: typography.weight.semibold,
        color: studentColors.textPrimary,
    },
    quizSubtitle: {
        fontSize: typography.size.sm,
        color: studentColors.textSecondary,
        marginTop: spacing.xxs,
        marginBottom: spacing.sm,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: spacing.md,
    },
    metaText: {
        fontSize: typography.size.xs,
        color: studentColors.textMuted,
        fontWeight: typography.weight.medium,
    },
    difficultyBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.sm,
    },
    difficultyText: {
        fontSize: typography.size.xs,
        fontWeight: typography.weight.bold,
    },
    chevron: {
        fontSize: 24,
        color: studentColors.textMuted,
        fontWeight: typography.weight.bold,
        marginLeft: spacing.md,
    },
});
