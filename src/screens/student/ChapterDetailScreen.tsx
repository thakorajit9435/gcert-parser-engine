import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Linking, Alert, ScrollView } from 'react-native';
import { useChapterDetail } from '../../hooks/useChapterDetail';
import { studentColors, typography, spacing, borderRadius, shadows } from '../../theme';
import { useAuth } from '../../hooks/useAuth';
import { useUserProgress } from '../../hooks/useUserProgress';
import { updateChapterLastOpened, markChapterCompleted } from '../../services/firebase/progress.service';
import { useBookmarks } from '../../hooks/useBookmarks';

export function ChapterDetailScreen({ route, navigation }: { route: any; navigation: any }): React.JSX.Element {
    const { chapterId } = route.params || {};
    const { chapter, loading, error } = useChapterDetail(chapterId);
    const { userProfile } = useAuth();
    const isPremiumUser = userProfile?.premium ?? false;

    // Use subjectId from chapter once it loads
    const { progressMap } = useUserProgress(chapter?.subjectId);
    const chapterProgress = progressMap[chapterId];
    const isCompleted = chapterProgress?.isCompleted ?? false;
    const { isBookmarked, toggle: toggleBookmark } = useBookmarks(userProfile?.uid);
    const isChapterBookmarked = isBookmarked(chapterId);

    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        // Record last opened timestamp when chapter is loaded
        if (chapter && userProfile?.uid) {
            updateChapterLastOpened(userProfile.uid, chapter.id, chapter.subjectId, chapter.standardId);
        }
    }, [chapter?.id, userProfile?.uid]);

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={studentColors.primary} />
            </View>
        );
    }

    if (error || !chapter) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>⚠️ Failed to load chapter</Text>
            </View>
        );
    }

    const isLocked = chapter.isPremium && !isPremiumUser;

    const handleMarkCompleted = async () => {
        if (!userProfile?.uid || isCompleted || updating) return;
        setUpdating(true);
        const success = await markChapterCompleted(userProfile.uid, chapter.id, chapter.subjectId, chapter.standardId);
        if (success) {
            Alert.alert('Success', 'Chapter marked as completed! 🎉');
        } else {
            Alert.alert('Error', 'Failed to update progress.');
        }
        setUpdating(false);
    };

    const handleToggleBookmark = async () => {
        if (!userProfile?.uid || updating) return;
        setUpdating(true);
        await toggleBookmark(chapter.id, {
            standardId: chapter.standardId,
            subjectId: chapter.subjectId,
            chapterTitle: chapter.title
        });
        setUpdating(false);
    };

    const openPDF = async () => {
        if (!chapter.pdfUrl) {
            Alert.alert('Notice', 'No PDF available for this chapter.');
            return;
        }
        navigation.navigate('PdfViewer', {
            url: chapter.pdfUrl,
            title: chapter.title
        });
    };

    const openVideo = async () => {
        if (!chapter.videoUrl) {
            Alert.alert('Notice', 'No Video available for this chapter.');
            return;
        }
        try {
            const canOpen = await Linking.canOpenURL(chapter.videoUrl).catch(() => false);
            if (canOpen) {
                await Linking.openURL(chapter.videoUrl);
            } else {
                // Fallback attempt
                await Linking.openURL(chapter.videoUrl).catch(e => console.log(e));
            }
        } catch (err) {
            console.error('Video Open Error:', err);
            Alert.alert('Error', 'Failed to open Video. Please try again later.');
        }
    };

    const openSwadhyayAction = () => {
        if (chapter.swadhyayPdfUrl) {
            navigation.navigate('PdfViewer', {
                url: chapter.swadhyayPdfUrl,
                title: `${chapter.title} - Swadhyay`
            });
        } else {
            navigateToQuiz(false);
        }
    };

    const navigateToQuiz = (isMixed: boolean) => {
        navigation.navigate('QuizList', {
            chapterId: chapter.id,
            subjectId: chapter.subjectId,
            isMixed,
            chapterTitle: chapter.title
        });
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <View style={styles.titleContent}>
                        <Text style={styles.chapterTitle}>{chapter.title}</Text>
                        <Text style={styles.chapterSubtitle}>{chapter.titleGu}</Text>
                    </View>
                    <TouchableOpacity onPress={handleToggleBookmark} style={styles.bookmarkBtn} disabled={updating}>
                        <Text style={[styles.bookmarkIcon, isChapterBookmarked && styles.bookmarkedIcon]}>
                            {isChapterBookmarked ? '🔖' : '📑'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {isLocked && (
                    <View style={styles.lockBadge}>
                        <Text style={styles.lockText}>🔒 Premium</Text>
                    </View>
                )}

                {isCompleted && (
                    <View style={styles.completedBadge}>
                        <Text style={styles.completedText}>✅ Completed</Text>
                    </View>
                )}
            </View>

            {isLocked ? (
                <View style={styles.lockedContainer}>
                    <View style={styles.lockedCard}>
                        <Text style={styles.lockedIcon}>🔒</Text>
                        <Text style={styles.lockedTitle}>This is Premium Content</Text>
                        <Text style={styles.lockedMessage}>Upgrade to access this feature</Text>
                        <TouchableOpacity
                            style={styles.upgradeButton}
                            onPress={() => navigation.navigate('PremiumAccess')}
                        >
                            <Text style={styles.upgradeButtonText}>💎 Upgrade to Premium</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <>
                    <View style={styles.actionsContainer}>
                        {/* PDF */}
                        {chapter.pdfUrl && (
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={openPDF}
                            >
                                <Text style={styles.actionIcon}>📘</Text>
                                <Text style={styles.actionText}>Read PDF</Text>
                            </TouchableOpacity>
                        )}

                        {/* Video */}
                        {chapter.videoUrl && (
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={openVideo}
                            >
                                <Text style={styles.actionIcon}>🎥</Text>
                                <Text style={styles.actionText}>Watch Video</Text>
                            </TouchableOpacity>
                        )}

                        {/* Swadhyay */}
                        {chapter.hasSwadhyay !== false && (
                            <TouchableOpacity
                                style={[styles.actionButton, styles.swadhyay]}
                                onPress={openSwadhyayAction}
                            >
                                <Text style={styles.actionIcon}>📝</Text>
                                <Text style={styles.actionText}>Swadhyay</Text>
                            </TouchableOpacity>
                        )}

                        {/* MCQ */}
                        {chapter.hasMcq !== false && (
                            <TouchableOpacity
                                style={[styles.actionButton, styles.mcq]}
                                onPress={() => navigateToQuiz(false)}
                            >
                                <Text style={styles.actionIcon}>❓</Text>
                                <Text style={styles.actionText}>MCQ Quiz</Text>
                            </TouchableOpacity>
                        )}

                        {/* Mixed Quiz */}
                        {chapter.hasMixedQuiz !== false && (
                            <TouchableOpacity
                                style={[styles.actionButton, styles.mixed]}
                                onPress={() => navigateToQuiz(true)}
                            >
                                <Text style={styles.actionIcon}>🔀</Text>
                                <Text style={styles.actionText}>Mixed Quiz</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Mark as Complete Button */}
                    {!isCompleted && (
                        <View style={styles.completeWrap}>
                            <TouchableOpacity
                                style={styles.completeButton}
                                onPress={handleMarkCompleted}
                                disabled={updating}
                            >
                                <Text style={styles.completeButtonText}>✨ Mark as Completed</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: studentColors.background,
    },
    scrollContent: {
        paddingBottom: spacing.xxl,
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
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    titleContent: {
        flex: 1,
    },
    chapterTitle: {
        fontSize: typography.size.xxl,
        fontWeight: typography.weight.bold,
        color: studentColors.textPrimary,
    },
    chapterSubtitle: {
        fontSize: typography.size.md,
        color: studentColors.textSecondary,
        marginTop: spacing.xs,
    },
    bookmarkBtn: {
        padding: spacing.xs,
        marginLeft: spacing.md,
        backgroundColor: studentColors.surfaceHover,
        borderRadius: borderRadius.md,
    },
    bookmarkIcon: {
        fontSize: 24,
        opacity: 0.5,
    },
    bookmarkedIcon: {
        opacity: 1,
    },
    lockBadge: {
        marginTop: spacing.md,
        backgroundColor: 'rgba(0,0,0,0.05)',
        alignSelf: 'flex-start',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
    },
    lockText: {
        color: studentColors.textMuted,
        fontWeight: typography.weight.bold,
    },
    completedBadge: {
        marginTop: spacing.md,
        backgroundColor: '#DCFCE7',
        alignSelf: 'flex-start',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
    },
    completedText: {
        color: studentColors.success,
        fontWeight: typography.weight.bold,
    },
    actionsContainer: {
        padding: spacing.xl,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    actionButton: {
        backgroundColor: studentColors.surface,
        width: '48%',
        paddingVertical: spacing.xl,
        alignItems: 'center',
        borderRadius: borderRadius.xl,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: studentColors.border,
        ...shadows.sm,
    },
    disabledButton: {
        opacity: 0.5,
    },
    actionIcon: {
        fontSize: 36,
        marginBottom: spacing.sm,
    },
    actionText: {
        fontSize: typography.size.md,
        fontWeight: typography.weight.semibold,
        color: studentColors.textPrimary,
    },
    swadhyay: {
        backgroundColor: '#e3f2fd',
    },
    mcq: {
        backgroundColor: '#f3e5f5',
    },
    mixed: {
        backgroundColor: '#fff3e0',
    },
    vadhu: {
        backgroundColor: '#e8f5e9',
    },
    completeWrap: {
        paddingHorizontal: spacing.xl,
        marginTop: spacing.sm,
    },
    completeButton: {
        backgroundColor: studentColors.surface,
        borderWidth: 2,
        borderColor: studentColors.primary,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.xl,
        alignItems: 'center',
        ...shadows.sm,
    },
    completeButtonText: {
        fontSize: typography.size.md,
        fontWeight: typography.weight.bold,
        color: studentColors.primary,
    },
    lockedContainer: {
        padding: spacing.xl,
    },
    lockedCard: {
        backgroundColor: studentColors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.xxl,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: studentColors.border,
        ...shadows.sm,
    },
    lockedIcon: {
        fontSize: 56,
        marginBottom: spacing.lg,
    },
    lockedTitle: {
        fontSize: typography.size.xl,
        fontWeight: typography.weight.bold,
        color: studentColors.textPrimary,
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    lockedMessage: {
        fontSize: typography.size.md,
        color: studentColors.textMuted,
        marginBottom: spacing.xl,
        textAlign: 'center',
    },
    upgradeButton: {
        backgroundColor: '#FFD54F',
        paddingHorizontal: spacing.xxl,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.xl,
    },
    upgradeButtonText: {
        fontSize: typography.size.md,
        fontWeight: typography.weight.bold,
        color: '#1A1A1A',
    },
});
