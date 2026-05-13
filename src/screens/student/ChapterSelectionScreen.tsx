import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { studentColors, typography, spacing, borderRadius, shadows } from '../../theme';
import { useChapters } from '../../hooks/useChapters';
import { usePracticeSettings } from '../../hooks/usePracticeSettings';
import { PracticeModeModal } from '../../components/student/PracticeModeModal';
import { useStandardContext } from '@/context/StandardContext';

export function ChapterSelectionScreen({ route, navigation }: { route: any; navigation: any }): React.JSX.Element {
    const { subjectId, subjectName, session } = route.params;
    const { selectedStandard } = useStandardContext();
    const standardId = selectedStandard;

    const { chapters, loading: chaptersLoading } = useChapters(subjectId);
    const { settings, loading: settingsLoading } = usePracticeSettings(standardId, session);

    const [modalVisible, setModalVisible] = useState(false);
    const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);

    const handleChapterSelect = (chapterId: string) => {
        setSelectedChapterId(chapterId);
        setModalVisible(true);
    };

    const handleStartTest = (questionCount: number) => {
        setModalVisible(false);
        if (selectedChapterId) {
            navigation.navigate('PracticeQuizScreen', {
                standardId,
                session,
                subjectId,
                subjectName,
                chapterId: selectedChapterId,
                mode: 'chapter',
                count: questionCount
            });
        }
    };

    if (chaptersLoading || settingsLoading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={studentColors.primary} />
            </View>
        );
    }

    const availableCounts = settings?.questionCounts?.length ? settings.questionCounts : [10, 25, 40, 50, 100];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>ચેપ્ટર પસંદ કરો</Text>
                <Text style={styles.headerSub}>{subjectName} • Chapter Test</Text>
            </View>

            {chapters.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>📖</Text>
                    <Text style={styles.emptyText}>કોઈ ચેપ્ટર ઉપલબ્ધ નથી</Text>
                </View>
            ) : (
                <FlatList
                    data={chapters}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item, index }) => (
                        <TouchableOpacity
                            style={styles.chapterCard}
                            activeOpacity={0.7}
                            onPress={() => handleChapterSelect(item.id)}
                        >
                            <View style={styles.chapterNumber}>
                                <Text style={styles.chapterNumberText}>{index + 1}</Text>
                            </View>
                            <View style={styles.chapterInfo}>
                                <Text style={styles.chapterTitle}>{item.title}</Text>
                                <Text style={styles.chapterTitleGu}>{item.titleGu}</Text>
                            </View>
                            <Text style={styles.chevron}>›</Text>
                        </TouchableOpacity>
                    )}
                />
            )}

            <PracticeModeModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                availableCounts={availableCounts} // In a real app we'd fetch specific chapter MCQ counts, but standard fallback is fine per requirements
                onSelectCount={handleStartTest}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: studentColors.background,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        padding: spacing.xl,
        backgroundColor: studentColors.surface,
        borderBottomWidth: 1,
        borderBottomColor: studentColors.border,
        marginBottom: spacing.md,
    },
    headerTitle: {
        fontSize: typography.size.xl,
        fontWeight: typography.weight.bold,
        color: studentColors.textPrimary,
        marginBottom: spacing.xs,
    },
    headerSub: {
        fontSize: typography.size.sm,
        color: studentColors.textSecondary,
    },
    listContent: {
        padding: spacing.xl,
        paddingTop: spacing.sm,
        gap: spacing.md,
    },
    chapterCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: studentColors.surface,
        padding: spacing.md,
        borderRadius: borderRadius.xl,
        ...shadows.sm,
    },
    chapterNumber: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: studentColors.primaryLight + '30',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    chapterNumberText: {
        fontSize: typography.size.md,
        fontWeight: typography.weight.bold,
        color: studentColors.primary,
    },
    chapterInfo: {
        flex: 1,
    },
    chapterTitle: {
        fontSize: typography.size.md,
        fontWeight: typography.weight.semibold,
        color: studentColors.textPrimary,
        marginBottom: 2,
    },
    chapterTitleGu: {
        fontSize: typography.size.sm,
        color: studentColors.textSecondary,
    },
    chevron: {
        fontSize: 24,
        color: studentColors.textMuted,
        fontWeight: typography.weight.regular,
        marginLeft: spacing.md,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: spacing.huge,
        flex: 1,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: spacing.md,
    },
    emptyText: {
        fontSize: typography.size.md,
        color: studentColors.textMuted,
    },
});
