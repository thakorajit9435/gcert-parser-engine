import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../hooks/useAuth';
import { useBooks } from '../../hooks/useBooks';
import { getAllUserBookProgress } from '../../services/firebase/book.service';
import { Book, UserBookProgress } from '../../types';
import { studentColors, typography, spacing, borderRadius, shadows } from '../../theme';

export function BookListScreen(): React.JSX.Element {
    const { userProfile } = useAuth();
    const standardStr = userProfile?.standard ? String(userProfile.standard) : null;

    const { books, loading: booksLoading, fetchBooks, error } = useBooks(standardStr, true);

    const [progressMap, setProgressMap] = useState<Record<string, UserBookProgress>>({});
    const [refreshing, setRefreshing] = useState(false);

    const navigation = useNavigation<StackNavigationProp<any>>();

    const loadProgress = useCallback(async () => {
        if (!userProfile?.uid) return;
        const res = await getAllUserBookProgress(userProfile.uid);
        if (res.success && res.data) {
            setProgressMap(res.data);
        }
    }, [userProfile?.uid]);

    useEffect(() => {
        // Only load if focused to ensure progress updates when returning from reader
        const unsubscribe = navigation.addListener('focus', () => {
            loadProgress();
            fetchBooks();
        });
        return unsubscribe;
    }, [navigation, fetchBooks, loadProgress]);

    // Initial load
    useEffect(() => {
        loadProgress();
    }, [loadProgress]);

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([fetchBooks(), loadProgress()]);
        setRefreshing(false);
    };

    const handlePressBook = (book: Book, progress?: UserBookProgress) => {
        navigation.navigate('PDFReaderScreen', {
            book,
            initialPage: progress?.lastPage || 1
        });
    };

    const renderBookCard = ({ item }: { item: Book }) => {
        const progress = progressMap[item.id];
        const hasStarted = progress && progress.lastPage > 1;
        const progressPercent = hasStarted ? Math.round((progress.lastPage / item.totalPages) * 100) : 0;

        return (
            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => handlePressBook(item, progress)}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.subjectBadge}>
                        <Text style={styles.subjectText}>{item.subjectId}</Text>
                    </View>
                    <Text style={styles.semesterText}>Sem {item.semester}</Text>
                </View>

                <Text style={styles.title} numberOfLines={2}>{item.title}</Text>

                <View style={styles.cardFooter}>
                    <Text style={styles.pagesText}>
                        {item.totalPages} Pages
                    </Text>

                    {hasStarted && (
                        <View style={styles.resumeBadge}>
                            <Text style={styles.resumeIcon}>⏱️</Text>
                            <Text style={styles.resumeText}>
                                Resume Pg {progress.lastPage} ({progressPercent}%)
                            </Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    if (booksLoading && !refreshing && books.length === 0) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={studentColors.primary} />
                <Text style={styles.loadingText}>Loading your books...</Text>
            </View>
        );
    }

    if (error && books.length === 0) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>Oops! Failed to load books.</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchBooks}>
                    <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={books}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={renderBookCard}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[studentColors.primary]} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>📚</Text>
                        <Text style={styles.emptyTitle}>No Books Available</Text>
                        <Text style={styles.emptySub}>We couldn't find any books for standard {standardStr} right now.</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: studentColors.background,
    },
    listContent: {
        padding: spacing.lg,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
        backgroundColor: studentColors.background,
    },
    loadingText: {
        marginTop: spacing.md,
        fontSize: typography.size.md,
        color: studentColors.textSecondary,
    },
    errorText: {
        fontSize: typography.size.lg,
        color: studentColors.error,
        fontWeight: typography.weight.semibold,
        marginBottom: spacing.lg,
    },
    retryButton: {
        backgroundColor: studentColors.primary,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
    },
    retryText: {
        color: studentColors.surface,
        fontSize: typography.size.md,
        fontWeight: typography.weight.bold,
    },
    card: {
        backgroundColor: studentColors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: studentColors.border,
        ...shadows.sm,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    subjectBadge: {
        backgroundColor: studentColors.secondaryLight + '20',
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: borderRadius.sm,
    },
    subjectText: {
        color: studentColors.secondary,
        fontSize: typography.size.xs,
        fontWeight: typography.weight.bold,
        textTransform: 'uppercase',
    },
    semesterText: {
        color: studentColors.textMuted,
        fontSize: typography.size.xs,
        fontWeight: typography.weight.medium,
    },
    title: {
        fontSize: typography.size.lg,
        fontWeight: typography.weight.bold,
        color: studentColors.textPrimary,
        marginBottom: spacing.md,
        lineHeight: typography.lineHeight.lg,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: studentColors.border,
    },
    pagesText: {
        fontSize: typography.size.sm,
        color: studentColors.textSecondary,
    },
    resumeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF8E1', // gentle yellow
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: borderRadius.full,
    },
    resumeIcon: {
        fontSize: 12,
        marginRight: 4,
    },
    resumeText: {
        color: '#F57C00',
        fontSize: typography.size.xs,
        fontWeight: typography.weight.bold,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: spacing.xxxl,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: spacing.lg,
    },
    emptyTitle: {
        fontSize: typography.size.xl,
        fontWeight: typography.weight.bold,
        color: studentColors.textPrimary,
        marginBottom: spacing.sm,
    },
    emptySub: {
        fontSize: typography.size.md,
        color: studentColors.textSecondary,
        textAlign: 'center',
        paddingHorizontal: spacing.xl,
    },
});
