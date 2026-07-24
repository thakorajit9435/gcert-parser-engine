import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Animated, ScrollView, Alert } from 'react-native';
import { studentColors, typography, spacing, borderRadius, shadows } from '../../theme';
import { useAuth } from '../../hooks/useAuth';
import { usePracticeMCQs } from '../../hooks/usePracticeMCQs';
import { useStandardContext } from '../../context/StandardContext';
import firestore from '@react-native-firebase/firestore';
import { COLLECTIONS } from '../../constants';
import { aiTutorService } from '../../services/aiTutor.service';

export function PracticeQuizScreen({ route, navigation }: { route: any; navigation: any }): React.JSX.Element {
    const { session, subjectId, subjectName, chapterId, mode, count } = route.params;
    const { selectedStandard } = useStandardContext();
    const standardId = selectedStandard;
    const { userProfile } = useAuth();

    const { mcqs, loading, fetchPracticeMCQs, error } = usePracticeMCQs();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
    const [isFinished, setIsFinished] = useState(false);
    const [saving, setSaving] = useState(false);

    // AI Explanation States
    const [explainModalVisible, setExplainModalVisible] = useState(false);
    const [explanationText, setExplanationText] = useState('');
    const [explainingId, setExplainingId] = useState<string | null>(null);

    const handleExplainWithAI = async (q: any, userIndex?: number) => {
        setExplainingId(q.id);
        try {
            const explanation = await aiTutorService.explainQuizQuestion(
                q.question,
                q.options,
                q.correctAnswer,
                userIndex !== undefined ? userIndex : -1
            );
            setExplanationText(explanation);
            setExplainModalVisible(true);
        } catch (err) {
            console.error('Quiz explanation fetch failed:', err);
            Alert.alert('Error', 'સમજૂતી મેળવવામાં નિષ્ફળ. કૃપા કરીને ફરીથી પ્રયાસ કરો.');
        } finally {
            setExplainingId(null);
        }
    };

    // Timer
    const [timeLeft, setTimeLeft] = useState(count * 60); // 1 minute per round roughly

    const progressAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        fetchPracticeMCQs({
            standardId,
            sessionId: session,
            subjectId,
            chapterId,
            count,
        });
    }, []);

    // Set initial timer based on actual loaded MCQs
    useEffect(() => {
        if (!loading && mcqs.length > 0) {
            setTimeLeft(mcqs.length * 60);
        }
    }, [loading, mcqs.length]);

    useEffect(() => {
        if (loading || isFinished || mcqs.length === 0) {return;}

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleFinishTest();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [loading, isFinished, mcqs.length]);

    useEffect(() => {
        if (mcqs.length > 0) {
            Animated.timing(progressAnim, {
                toValue: (currentIndex + 1) / mcqs.length,
                duration: 300,
                useNativeDriver: false,
            }).start();
        }
    }, [currentIndex, mcqs.length]);

    const handleSelectOption = (index: number) => {
        const currentQ = mcqs[currentIndex];
        if (currentQ) {
            setSelectedAnswers(prev => ({
                ...prev,
                [currentQ.id]: index,
            }));
        }
    };

    const handleNext = () => {
        if (currentIndex < mcqs.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            handleFinishTest();
        }
    };

    const handleFinishTest = async () => {
        if (!userProfile?.uid) {
            Alert.alert('Error', 'User not logged in');
            return;
        }

        setIsFinished(true);
        setSaving(true);

        try {
            let correctAnswers = 0;
            const mappedAnswers: Record<string, string> = {};

            mcqs.forEach(q => {
                const userChoiceIndex = selectedAnswers[q.id];
                if (userChoiceIndex !== undefined) {
                    mappedAnswers[q.id] = String(userChoiceIndex);
                    if (userChoiceIndex === q.correctAnswer) {
                        correctAnswers++;
                    }
                }
            });

            const attemptRef = firestore().collection(COLLECTIONS.QUIZ_ATTEMPTS).doc();
            await attemptRef.set({
                id: attemptRef.id,
                userId: userProfile.uid,
                quizId: 'practice',
                type: mode === 'mix' ? 'mix_practice' : 'chapter_practice',
                subjectId,
                chapterId: chapterId || '',
                standardId,
                score: correctAnswers, // 1 point per question
                totalQuestions: mcqs.length,
                correctAnswers,
                timeTakenSeconds: (mcqs.length * 60) - timeLeft,
                answers: mappedAnswers,
                passed: true,
                createdAt: firestore.FieldValue.serverTimestamp(),
            });

            // Grant XP purely based on correct answers in practice
            if (correctAnswers > 0) {
                const userRef = firestore().collection(COLLECTIONS.USERS).doc(userProfile.uid);
                await userRef.update({
                    points: firestore.FieldValue.increment(correctAnswers * 2), // 2 points per correct practice
                });
            }

        } catch (err) {
            console.error('Failed to save attempt', err);
            Alert.alert('Error', 'Failed to save results. But you can still review them.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={studentColors.primary} />
                <Text style={styles.loadingText}>Loading Practice Questions...</Text>
            </View>
        );
    }

    if (error || (mcqs.length === 0 && !loading)) {
        return (
            <View style={[styles.container, styles.center]}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{error || 'કોઈ MCQ ઉપલબ્ધ નથી'}</Text>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.backBtnText}>પાછા જાવ</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    if (isFinished) {
        // Simple Results View
        const correctCount = mcqs.reduce((acc, q) => acc + (selectedAnswers[q.id] === q.correctAnswer ? 1 : 0), 0);

        return (
            <View style={styles.container}>
                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: spacing.huge }}>
                    <View style={styles.resultHeader}>
                        <Text style={styles.resultEmoji}>🎯</Text>
                        <Text style={styles.resultTitle}>Practice Complete!</Text>
                        <Text style={styles.resultSub}>{subjectName} - {mode === 'mix' ? 'Mix Test' : 'Chapter Test'}</Text>
                    </View>

                    <View style={styles.scoreBoard}>
                        <View style={styles.scoreItem}>
                            <Text style={styles.scoreValue}>{correctCount}</Text>
                            <Text style={styles.scoreLabel}>Correct</Text>
                        </View>
                        <View style={styles.scoreDivider} />
                        <View style={styles.scoreItem}>
                            <Text style={styles.scoreValue}>{mcqs.length - correctCount}</Text>
                            <Text style={styles.scoreLabel}>Incorrect</Text>
                        </View>
                        <View style={styles.scoreDivider} />
                        <View style={styles.scoreItem}>
                            <Text style={[styles.scoreValue, { color: studentColors.success }]}>+{correctCount * 2}</Text>
                            <Text style={styles.scoreLabel}>XP Earned</Text>
                        </View>
                    </View>

                    <Text style={{ fontSize: typography.size.lg, fontWeight: typography.weight.bold, marginHorizontal: spacing.xl, marginTop: spacing.xl, marginBottom: spacing.md, color: studentColors.textPrimary }}>
                        📝 પ્રશ્નોત્તરી સમીક્ષા (Quiz Review):
                    </Text>

                    {mcqs.map((q, idx) => {
                        const userIndex = selectedAnswers[q.id];
                        const isCorrect = userIndex === q.correctAnswer;
                        return (
                            <View key={q.id} style={[styles.questionCard, { marginHorizontal: spacing.xl, borderColor: isCorrect ? studentColors.success + '40' : studentColors.error + '40', borderWidth: 1 }]}>
                                <Text style={[styles.questionText, { fontSize: typography.size.md }]}>
                                    {idx + 1}. {q.question}
                                </Text>
                                <View style={{ marginTop: spacing.md, gap: spacing.xs }}>
                                    {q.options.map((opt, oIdx) => {
                                        let optStyle = {};
                                        let textStyle = {};
                                        if (oIdx === q.correctAnswer) {
                                            optStyle = { backgroundColor: studentColors.success + '15', borderColor: studentColors.success };
                                            textStyle = { color: studentColors.success, fontWeight: 'bold' };
                                        } else if (oIdx === userIndex && !isCorrect) {
                                            optStyle = { backgroundColor: studentColors.error + '15', borderColor: studentColors.error };
                                            textStyle = { color: studentColors.error };
                                        }
                                        return (
                                            <View key={oIdx} style={[{ padding: spacing.sm, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: studentColors.border }, optStyle]}>
                                                <Text style={[{ fontSize: typography.size.sm }, textStyle]}>
                                                    {opt} {oIdx === q.correctAnswer ? ' (સાચો જવાબ)' : oIdx === userIndex ? ' (તમારો જવાબ)' : ''}
                                                </Text>
                                            </View>
                                        );
                                    })}
                                </View>
                                
                                <TouchableOpacity 
                                    style={{ 
                                        flexDirection: 'row', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        backgroundColor: studentColors.primary + '10', 
                                        padding: spacing.md, 
                                        borderRadius: borderRadius.md, 
                                        marginTop: spacing.md 
                                    }}
                                    onPress={() => handleExplainWithAI(q, userIndex)}
                                    disabled={explainingId === q.id}
                                >
                                    {explainingId === q.id ? (
                                        <ActivityIndicator size="small" color={studentColors.primary} />
                                    ) : (
                                        <>
                                            <Text style={{ marginRight: 8 }}>🤖</Text>
                                            <Text style={{ color: studentColors.primary, fontWeight: 'bold', fontSize: typography.size.sm }}>
                                                Explain with AI (ગુજરાતીમાં સમજો)
                                            </Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        );
                    })}

                    {saving ? (
                        <ActivityIndicator color={studentColors.primary} style={{ marginTop: spacing.xl }} />
                    ) : (
                        <TouchableOpacity
                            style={styles.doneBtn}
                            onPress={() => navigation.goBack()}
                        >
                            <Text style={styles.doneBtnText}>પૂરું કરો</Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>

                {/* AI Explanation Modal */}
                {explainModalVisible && (
                    <View style={StyleSheet.absoluteFillObject}>
                        <TouchableOpacity 
                            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} 
                            onPress={() => setExplainModalVisible(false)} 
                        />
                        <View style={{ 
                            position: 'absolute', 
                            bottom: 0, 
                            left: 0, 
                            right: 0, 
                            backgroundColor: '#FFF', 
                            borderTopLeftRadius: borderRadius.xl, 
                            borderTopRightRadius: borderRadius.xl, 
                            padding: spacing.xl,
                            paddingBottom: spacing.xxxl,
                            ...shadows.lg
                        }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
                                <Text style={{ fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: studentColors.primary }}>
                                    🤖 AI શિક્ષક સમજૂતી
                                </Text>
                                <TouchableOpacity onPress={() => setExplainModalVisible(false)}>
                                    <Text style={{ fontSize: 18, color: studentColors.textSecondary }}>✕</Text>
                                </TouchableOpacity>
                            </View>
                            <Text style={{ fontSize: typography.size.md, color: studentColors.textPrimary, lineHeight: 24 }}>
                                {explanationText}
                            </Text>
                        </View>
                    </View>
                )}
            </View>
        );
    }

    const currentQ = mcqs[currentIndex];

    if (!currentQ) {return <></>;}

    const isAnswered = selectedAnswers[currentQ.id] !== undefined;

    return (
        <View style={styles.container}>
            {/* Header / Timer */}
            <View style={styles.header}>
                <Text style={styles.questionCountText}>
                    પ્રશ્ન {currentIndex + 1} / {mcqs.length}
                </Text>
                <View style={styles.timerBadge}>
                    <Text style={styles.timerIcon}>⏱️</Text>
                    <Text style={[styles.timerText, timeLeft < 60 && styles.timerDanger]}>
                        {formatTime(timeLeft)}
                    </Text>
                </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarBg}>
                <Animated.View
                    style={[
                        styles.progressBarFill,
                        { width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
                    ]}
                />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.questionCard}>
                    <Text style={styles.questionText}>{currentQ.question}</Text>
                </View>

                <View style={styles.optionsContainer}>
                    {currentQ.options.map((opt, idx) => {
                        const isSelected = selectedAnswers[currentQ.id] === idx;

                        return (
                            <TouchableOpacity
                                key={idx}
                                style={[
                                    styles.optionBtn,
                                    isSelected && styles.optionSelected,
                                ]}
                                onPress={() => handleSelectOption(idx)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.optionDot, isSelected && styles.optionDotSelected]}>
                                    {isSelected && <View style={styles.optionDotInner} />}
                                </View>
                                <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                                    {opt}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.nextBtn, !isAnswered && styles.nextBtnDisabled]}
                    disabled={!isAnswered}
                    onPress={handleNext}
                >
                    <Text style={styles.nextBtnText}>
                        {currentIndex === mcqs.length - 1 ? 'પૂરું કરો' : 'આગળ'}
                    </Text>
                </TouchableOpacity>
            </View>
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
        padding: spacing.xl,
    },
    loadingText: {
        marginTop: spacing.md,
        color: studentColors.textSecondary,
        fontSize: typography.size.md,
    },
    errorIcon: {
        fontSize: 48,
        marginBottom: spacing.md,
    },
    errorText: {
        fontSize: typography.size.md,
        color: studentColors.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.xl,
    },
    backBtn: {
        backgroundColor: studentColors.primary,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
    },
    backBtnText: {
        color: studentColors.surface,
        fontWeight: typography.weight.semibold,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.xl,
        paddingBottom: spacing.sm,
    },
    questionCountText: {
        fontSize: typography.size.md,
        fontWeight: typography.weight.bold,
        color: studentColors.textSecondary,
    },
    timerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: studentColors.surface,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
        ...shadows.sm,
    },
    timerIcon: {
        fontSize: 16,
        marginRight: 4,
    },
    timerText: {
        fontSize: typography.size.md,
        fontWeight: typography.weight.bold,
        color: studentColors.textPrimary,
    },
    timerDanger: {
        color: studentColors.error,
    },
    progressBarBg: {
        height: 6,
        backgroundColor: studentColors.border,
        marginHorizontal: spacing.xl,
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: spacing.md,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: studentColors.primary,
    },
    scrollContent: {
        padding: spacing.xl,
        paddingBottom: 100, // Space for footer
    },
    questionCard: {
        backgroundColor: studentColors.surface,
        padding: spacing.xl,
        borderRadius: borderRadius.xl,
        ...shadows.sm,
        marginBottom: spacing.xl,
    },
    questionText: {
        fontSize: typography.size.lg,
        color: studentColors.textPrimary,
        lineHeight: 28,
        fontWeight: typography.weight.medium,
    },
    optionsContainer: {
        gap: spacing.md,
    },
    optionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: studentColors.surface,
        padding: spacing.lg,
        borderRadius: borderRadius.md,
        borderWidth: 2,
        borderColor: 'transparent',
        ...shadows.sm,
    },
    optionSelected: {
        borderColor: studentColors.primary,
        backgroundColor: studentColors.primaryLight + '10',
    },
    optionDot: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: studentColors.border,
        marginRight: spacing.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionDotSelected: {
        borderColor: studentColors.primary,
    },
    optionDotInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: studentColors.primary,
    },
    optionText: {
        flex: 1,
        fontSize: typography.size.md,
        color: studentColors.textPrimary,
        lineHeight: 22,
    },
    optionTextSelected: {
        fontWeight: typography.weight.semibold,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: spacing.xl,
        backgroundColor: studentColors.surface,
        borderTopWidth: 1,
        borderTopColor: studentColors.border,
    },
    nextBtn: {
        backgroundColor: studentColors.primary,
        paddingVertical: spacing.lg,
        borderRadius: borderRadius.md,
        alignItems: 'center',
    },
    nextBtnDisabled: {
        backgroundColor: studentColors.border,
    },
    nextBtnText: {
        fontSize: typography.size.md,
        fontWeight: typography.weight.bold,
        color: studentColors.surface,
    },
    // Results
    resultHeader: {
        alignItems: 'center',
        paddingVertical: spacing.huge,
    },
    resultEmoji: {
        fontSize: 64,
        marginBottom: spacing.md,
    },
    resultTitle: {
        fontSize: typography.size.xxl,
        fontWeight: typography.weight.bold,
        color: studentColors.textPrimary,
        marginBottom: spacing.xs,
    },
    resultSub: {
        fontSize: typography.size.md,
        color: studentColors.textSecondary,
    },
    scoreBoard: {
        flexDirection: 'row',
        backgroundColor: studentColors.surface,
        marginHorizontal: spacing.xl,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        ...shadows.md,
        justifyContent: 'space-around',
    },
    scoreItem: {
        alignItems: 'center',
        flex: 1,
    },
    scoreValue: {
        fontSize: 32,
        fontWeight: typography.weight.bold,
        color: studentColors.textPrimary,
    },
    scoreLabel: {
        fontSize: typography.size.xs,
        color: studentColors.textMuted,
        textTransform: 'uppercase',
        marginTop: 4,
    },
    scoreDivider: {
        width: 1,
        backgroundColor: studentColors.border,
        marginVertical: spacing.sm,
    },
    doneBtn: {
        backgroundColor: studentColors.primary,
        marginHorizontal: spacing.xl,
        marginTop: spacing.xxl,
        paddingVertical: spacing.lg,
        borderRadius: borderRadius.md,
        alignItems: 'center',
    },
    doneBtnText: {
        fontSize: typography.size.md,
        fontWeight: typography.weight.bold,
        color: studentColors.surface,
    },
});
