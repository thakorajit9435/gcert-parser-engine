import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { studentColors, typography, spacing, shadows } from '../../theme';
import { usePracticeSettings } from '../../hooks/usePracticeSettings';
import { useMCQCount } from '../../hooks/useMCQCount';
import { useStandardContext } from '../../context/StandardContext';
import { PracticeModeModal } from '../../components/student/PracticeModeModal';

export function SubjectMCQScreen({ route, navigation }: { route: any; navigation: any }): React.JSX.Element {
    const { subjectId, subjectName, session, sessionTitle } = route.params;
    const { selectedStandard } = useStandardContext();
    const standardId = selectedStandard;

    const { settings, loading: settingsLoading } = usePracticeSettings(standardId, session);
    const { count, loading: countLoading } = useMCQCount(standardId, session, subjectId);

    const [modalVisible, setModalVisible] = useState(false);
    const [selectedMode, setSelectedMode] = useState<'mix' | 'chapter' | null>(null);

    const handleMixTest = () => {
        setSelectedMode('mix');
        setModalVisible(true);
    };

    const handleChapterTest = () => {
        navigation.navigate('ChapterSelectionScreen', {
            subjectId,
            subjectName,
            standardId,
            session,
        });
    };

    const handleStartTest = (questionCount: number) => {
        setModalVisible(false);
        if (selectedMode === 'mix') {
            navigation.navigate('PracticeQuizScreen', {
                standardId,
                session,
                subjectId,
                subjectName,
                mode: 'mix',
                count: questionCount,
            });
        }
    };

    if (settingsLoading || countLoading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={studentColors.primary} />
            </View>
        );
    }

    const allowMix = settings?.allowMixTest ?? true;
    const allowChapter = settings?.allowChapterTest ?? true;
    const availableCounts = settings?.questionCounts?.length ? settings.questionCounts : [10, 25, 40, 50, 100];

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{subjectName}</Text>
                <Text style={styles.headerSub}>MCQ Practice • {sessionTitle || `સત્ર ${session}`}</Text>
            </View>

            <View style={styles.statsCard}>
                <Text style={styles.statsCount}>{count}</Text>
                <Text style={styles.statsLabel}>Total MCQs Available</Text>
            </View>

            <View style={styles.actionsContainer}>
                {allowMix && (
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.mixBtn]}
                        activeOpacity={0.8}
                        onPress={handleMixTest}
                        disabled={count === 0}
                    >
                        <Text style={styles.btnIcon}>🔵</Text>
                        <View style={styles.btnTextContainer}>
                            <Text style={styles.btnTitle}>મિક્ષ ટેસ્ટ</Text>
                            <Text style={styles.btnDesc}>બધા ચેપ્ટરમાંથી random પ્રશ્નો</Text>
                        </View>
                        <Text style={styles.btnArrow}>→</Text>
                    </TouchableOpacity>
                )}

                {allowChapter && (
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.chapterBtn]}
                        activeOpacity={0.8}
                        onPress={handleChapterTest}
                    >
                        <Text style={styles.btnIcon}>🟡</Text>
                        <View style={styles.btnTextContainer}>
                            <Text style={styles.btnTitle}>ચેપ્ટર મુજબ ટેસ્ટ</Text>
                            <Text style={styles.btnDesc}>પસંદ કરેલા ચેપ્ટરમાંથી પ્રશ્નો</Text>
                        </View>
                        <Text style={styles.btnArrow}>→</Text>
                    </TouchableOpacity>
                )}
            </View>

            <PracticeModeModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                availableCounts={availableCounts.filter(c => c <= count)}
                onSelectCount={handleStartTest}
            />
        </ScrollView>
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
    content: {
        padding: spacing.xl,
    },
    header: {
        marginBottom: spacing.xxl,
    },
    headerTitle: {
        fontSize: typography.size.xxl,
        fontWeight: typography.weight.bold,
        color: studentColors.textPrimary,
        marginBottom: spacing.xs,
    },
    headerSub: {
        fontSize: typography.size.md,
        color: studentColors.textSecondary,
    },
    statsCard: {
        backgroundColor: studentColors.surface,
        borderRadius: 16,
        padding: spacing.xl,
        alignItems: 'center',
        marginBottom: spacing.xxl,
        ...shadows.sm,
    },
    statsCount: {
        fontSize: 48,
        fontWeight: typography.weight.bold,
        color: studentColors.primary,
        marginVertical: spacing.sm,
    },
    statsLabel: {
        fontSize: typography.size.sm,
        color: studentColors.textMuted,
        fontWeight: typography.weight.medium,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    actionsContainer: {
        gap: spacing.lg,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.xl,
        borderRadius: 16,
        ...shadows.md,
    },
    mixBtn: {
        backgroundColor: studentColors.surface,
        borderWidth: 2,
        borderColor: '#1976D2' + '20', // Secondary color tint
    },
    chapterBtn: {
        backgroundColor: studentColors.surface,
        borderWidth: 2,
        borderColor: '#FFD54F' + '40', // Primary color tint
    },
    btnIcon: {
        fontSize: 32,
        marginRight: spacing.lg,
    },
    btnTextContainer: {
        flex: 1,
    },
    btnTitle: {
        fontSize: typography.size.lg,
        fontWeight: typography.weight.bold,
        color: studentColors.textPrimary,
        marginBottom: spacing.xs,
    },
    btnDesc: {
        fontSize: typography.size.sm,
        color: studentColors.textSecondary,
    },
    btnArrow: {
        fontSize: 24,
        color: studentColors.textMuted,
        fontWeight: typography.weight.regular,
    },
});
