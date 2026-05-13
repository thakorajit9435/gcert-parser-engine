import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Animated,
} from 'react-native';
import { studentColors, typography, spacing, borderRadius, shadows } from '../../theme';
import { useAuth } from '../../hooks/useAuth';
import { useQuiz } from '../../hooks/useQuiz';
import { Question } from '../../types';

type QuizPhase = 'loading' | 'empty' | 'error' | 'ready' | 'active' | 'finished' | 'review';

interface QuizSummary {
    score: number;
    correct: number;
    total: number;
    passed: boolean;
    pointsEarned: number;
    timeTaken: number;
}

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

export function QuizScreen({ route, navigation }: { route: any; navigation: any }): React.JSX.Element {
    const quizId: string | undefined = route?.params?.quizId;
    const { userProfile } = useAuth();
    const { quiz, questions, loading, error, submitting, submitQuiz } = useQuiz(quizId);

    const [phase, setPhase] = useState<QuizPhase>('loading');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [lockedOption, setLockedOption] = useState<string | null>(null);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [summary, setSummary] = useState<QuizSummary | null>(null);

    const startTimeRef = useRef<number>(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Animated progress
    const progressAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!loading && error) { setPhase('error'); return; }
        if (!loading && quiz && questions.length === 0) { setPhase('empty'); return; }
        if (!loading && quiz && questions.length > 0) {
            setPhase('ready');
            setTimeLeft(quiz.timeLimitSeconds);
        }
    }, [loading, error, quiz, questions]);

    const clearTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const handleFinish = useCallback(async (finalAnswers: Record<string, string>) => {
        clearTimer();
        setPhase('finished');

        if (!userProfile?.uid) { return; }

        const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000);
        const result = await submitQuiz({
            userId: userProfile.uid,
            answers: finalAnswers,
            timeTakenSeconds: timeTaken,
        });

        if (result) {
            setSummary({ ...result, total: questions.length, timeTaken });
        }
    }, [clearTimer, submitQuiz, userProfile, questions.length]);

    useEffect(() => {
        if (phase !== 'active') { return; }
        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearTimer();
                    handleFinish(answers);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return clearTimer;
    }, [phase, answers, clearTimer, handleFinish]);

    useEffect(() => {
        if (phase === 'active' && questions.length > 0) {
            const progress = ((currentIndex + 1) / questions.length) * 100;
            Animated.spring(progressAnim, {
                toValue: progress,
                useNativeDriver: false,
                bounciness: 0,
            }).start();
        }
    }, [currentIndex, phase, questions.length, progressAnim]);

    const startQuiz = useCallback(() => {
        setPhase('active');
        setCurrentIndex(0);
        setAnswers({});
        setSelectedOption(null);
        setLockedOption(null);
        startTimeRef.current = Date.now();
        progressAnim.setValue((1 / questions.length) * 100);
    }, [progressAnim, questions.length]);

    const handleSelectOption = useCallback((optId: string) => {
        if (lockedOption) { return; }
        setSelectedOption(optId);
        setLockedOption(optId);
    }, [lockedOption]);

    const handleNext = useCallback(() => {
        const currentQuestion: Question | undefined = questions[currentIndex];
        if (!currentQuestion) { return; }
        const newAnswers = lockedOption
            ? { ...answers, [currentQuestion.id]: lockedOption }
            : answers;

        setAnswers(newAnswers);

        if (currentIndex < questions.length - 1) {
            setCurrentIndex((prev) => prev + 1);
            setSelectedOption(null);
            setLockedOption(null);
        } else {
            handleFinish(newAnswers);
        }
    }, [currentIndex, questions, lockedOption, answers, handleFinish]);

    // ── Phase: loading ──────────────────────────────────────────
    if (phase === 'loading') {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={studentColors.secondary} />
                <Text style={styles.centeredText}>Loading quiz…</Text>
            </View>
        );
    }

    // ── Phase: error ────────────────────────────────────────────
    if (phase === 'error') {
        return (
            <View style={styles.centered}>
                <Text style={styles.bigEmoji}>❌</Text>
                <Text style={styles.centeredTitle}>Something went wrong</Text>
                <Text style={styles.centeredSub}>{error}</Text>
                <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.primaryBtnText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // ── Phase: empty ────────────────────────────────────────────
    if (phase === 'empty') {
        return (
            <View style={styles.centered}>
                <Text style={styles.bigEmoji}>❓</Text>
                <Text style={styles.centeredTitle}>No Questions Yet</Text>
                <Text style={styles.centeredSub}>This quiz has no questions. Check back later.</Text>
                <TouchableOpacity style={styles.outlineBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.outlineBtnText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // ── Phase: ready ────────────────────────────────────────────
    if (phase === 'ready' && quiz) {
        return (
            <View style={styles.centered}>
                <Text style={styles.bigEmoji}>📝</Text>
                <Text style={styles.centeredTitle}>{quiz.title}</Text>
                {quiz.titleGu ? <Text style={styles.centeredSub}>{quiz.titleGu}</Text> : null}
                <View style={styles.pillRow}>
                    <View style={styles.pill}>
                        <Text style={styles.pillText}>❓ {questions.length} Questions</Text>
                    </View>
                    <View style={styles.pill}>
                        <Text style={styles.pillText}>⏱ {formatTime(quiz.timeLimitSeconds)}</Text>
                    </View>
                    <View style={styles.pill}>
                        <Text style={styles.pillText}>🎯 Pass {quiz.passingScore}%</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.primaryBtn} onPress={startQuiz}>
                    <Text style={styles.primaryBtnText}>Start Quiz</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // ── Phase: finished ─────────────────────────────────────────
    if (phase === 'finished') {
        return (
            <ScrollView style={styles.container} contentContainerStyle={styles.resultContent}>
                {(submitting || !summary) ? (
                    <View style={styles.savingWrap}>
                        <ActivityIndicator size="large" color={studentColors.secondary} />
                        <Text style={styles.centeredText}>Saving your result…</Text>
                    </View>
                ) : (
                    <>
                        <View style={styles.resultHeaderWrap}>
                            <Text style={styles.bigEmoji}>{summary.passed ? '🎉' : '😔'}</Text>
                            <Text style={styles.centeredTitle}>
                                {summary.passed ? 'Congratulations!' : 'Keep Trying!'}
                            </Text>
                            <Text style={styles.centeredSub}>
                                {summary.passed ? 'You passed the quiz!' : 'Better luck next time!'}
                            </Text>
                        </View>

                        <View style={styles.scoreCircleWrap}>
                            <View style={[styles.scoreCircle, summary.passed && styles.scoreCirclePassed]}>
                                <Text style={styles.scoreValue}>{summary.score}%</Text>
                                <Text style={styles.scoreLabel}>Score</Text>
                            </View>
                        </View>

                        <View style={styles.statsCard}>
                            <View style={styles.statBlock}>
                                <Text style={styles.statVal}>{summary.correct}/{summary.total}</Text>
                                <Text style={styles.statLbl}>Correct</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statBlock}>
                                <Text style={styles.statVal}>{formatTime(summary.timeTaken)}</Text>
                                <Text style={styles.statLbl}>Time</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statBlock}>
                                <Text style={[styles.statVal, styles.statValPoints]}>+{summary.pointsEarned}</Text>
                                <Text style={styles.statLbl}>XP Earned</Text>
                            </View>
                        </View>

                        <TouchableOpacity style={styles.primaryBtn} onPress={() => setPhase('review')}>
                            <Text style={styles.primaryBtnText}>Review Answers</Text>
                        </TouchableOpacity>

                        <View style={{ flexDirection: 'row', gap: spacing.md, width: '100%', marginTop: spacing.md }}>
                            <TouchableOpacity style={[styles.outlineBtn, { flex: 1 }]} onPress={startQuiz}>
                                <Text style={styles.outlineBtnText}>Retry</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.outlineBtn, { flex: 1 }]} onPress={() => navigation.goBack()}>
                                <Text style={styles.outlineBtnText}>Done</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </ScrollView>
        );
    }

    // ── Phase: review ───────────────────────────────────────────
    if (phase === 'review' && summary) {
        return (
            <View style={styles.container}>
                <View style={styles.quizHeader}>
                    <Text style={styles.centeredTitle}>Review Answers</Text>
                </View>
                <ScrollView contentContainerStyle={styles.questionPad}>
                    {questions.map((q, idx) => {
                        const userAns = answers[q.id];
                        return (
                            <View key={q.id} style={{ marginBottom: spacing.xl }}>
                                <Text style={styles.counter}>Question {idx + 1}</Text>
                                <Text style={styles.questionText}>{q.questionText}</Text>
                                {q.questionTextGu ? (
                                    <Text style={styles.questionTextGu}>{q.questionTextGu}</Text>
                                ) : null}
                                <View style={styles.optionList}>
                                    {q.options.map((opt, oIdx) => {
                                        const isSelected = opt.id === userAns;
                                        const isCorrect = opt.id === q.correctOptionId;

                                        return (
                                            <View
                                                key={opt.id}
                                                style={[
                                                    styles.optionCard,
                                                    isSelected && !isCorrect && styles.optionWrong,
                                                    isCorrect && styles.optionCorrect,
                                                ]}
                                            >
                                                <View style={[
                                                    styles.optionBadge,
                                                    isSelected && !isCorrect && styles.optionBadgeWrong,
                                                    isCorrect && styles.optionBadgeCorrect,
                                                ]}>
                                                    <Text style={[
                                                        styles.optionBadgeText,
                                                        (isSelected || isCorrect) && styles.optionBadgeTextActive,
                                                    ]}>
                                                        {OPTION_LABELS[oIdx]}
                                                    </Text>
                                                </View>
                                                <View style={styles.optionTextWrap}>
                                                    <Text style={[
                                                        styles.optionText,
                                                        isCorrect && styles.optionTextCorrect,
                                                        isSelected && !isCorrect && styles.optionTextWrong,
                                                    ]}>{opt.text}</Text>
                                                    {opt.textGu ? <Text style={styles.optionTextGu}>{opt.textGu}</Text> : null}
                                                </View>
                                                {isCorrect && <Text style={styles.resultIcon}>✓</Text>}
                                                {isSelected && !isCorrect && <Text style={styles.resultIcon}>✗</Text>}
                                            </View>
                                        );
                                    })}
                                </View>
                            </View>
                        );
                    })}
                    <TouchableOpacity style={styles.primaryBtn} onPress={() => setPhase('finished')}>
                        <Text style={styles.primaryBtnText}>Back to Result</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        );
    }

    // ── Phase: active ───────────────────────────────────────────
    const currentQuestion: Question | undefined = questions[currentIndex];
    if (!currentQuestion) {
        return <View style={styles.centered}><Text style={styles.centeredSub}>No question data.</Text></View>;
    }

    const timerDanger = timeLeft <= 30;
    const isLast = currentIndex === questions.length - 1;

    return (
        <View style={styles.container}>
            <View style={styles.quizHeader}>
                <View style={styles.timerRow}>
                    <Text style={[styles.timer, timerDanger && styles.timerDanger]}>
                        ⏱ {formatTime(timeLeft)}
                    </Text>
                    <Text style={styles.counter}>{currentIndex + 1} / {questions.length}</Text>
                </View>
                <View style={styles.progressBar}>
                    <Animated.View style={[
                        styles.progressFill,
                        {
                            width: progressAnim.interpolate({
                                inputRange: [0, 100],
                                outputRange: ['0%', '100%'],
                            })
                        }
                    ]} />
                </View>
            </View>

            <ScrollView style={styles.questionArea} contentContainerStyle={styles.questionPad}>
                <Text style={styles.questionText}>{currentQuestion.questionText}</Text>
                {currentQuestion.questionTextGu ? (
                    <Text style={styles.questionTextGu}>{currentQuestion.questionTextGu}</Text>
                ) : null}

                <View style={styles.optionList}>
                    {currentQuestion.options.map((opt, idx) => {
                        const isSelected = selectedOption === opt.id;
                        const isCorrect = lockedOption !== null && opt.id === currentQuestion.correctOptionId;
                        const isWrong = lockedOption !== null && isSelected && opt.id !== currentQuestion.correctOptionId;

                        return (
                            <TouchableOpacity
                                key={opt.id}
                                style={[
                                    styles.optionCard,
                                    isSelected && !isWrong && !isCorrect && styles.optionSelected,
                                    isCorrect && styles.optionCorrect,
                                    isWrong && styles.optionWrong,
                                ]}
                                onPress={() => handleSelectOption(opt.id)}
                                activeOpacity={lockedOption ? 1 : 0.7}
                            >
                                <View style={[
                                    styles.optionBadge,
                                    isSelected && !isWrong && !isCorrect && styles.optionBadgeSelected,
                                    isCorrect && styles.optionBadgeCorrect,
                                    isWrong && styles.optionBadgeWrong,
                                ]}>
                                    <Text style={[
                                        styles.optionBadgeText,
                                        (isSelected || isCorrect || isWrong) && styles.optionBadgeTextActive,
                                    ]}>
                                        {OPTION_LABELS[idx]}
                                    </Text>
                                </View>
                                <View style={styles.optionTextWrap}>
                                    <Text style={[
                                        styles.optionText,
                                        isCorrect && styles.optionTextCorrect,
                                        isWrong && styles.optionTextWrong,
                                    ]}>
                                        {opt.text}
                                    </Text>
                                    {opt.textGu ? <Text style={styles.optionTextGu}>{opt.textGu}</Text> : null}
                                </View>
                                {isCorrect && <Text style={styles.resultIcon}>✓</Text>}
                                {isWrong && <Text style={styles.resultIcon}>✗</Text>}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>

            <View style={styles.quizFooter}>
                <TouchableOpacity
                    style={[styles.nextBtn, !lockedOption && styles.nextBtnDisabled]}
                    onPress={handleNext}
                    disabled={!lockedOption}
                    activeOpacity={0.8}
                >
                    <Text style={styles.nextBtnText}>{isLast ? 'Finish' : 'Next →'}</Text>
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
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: studentColors.background,
        padding: spacing.xxl,
    },
    bigEmoji: {
        fontSize: 64,
        marginBottom: spacing.lg,
    },
    centeredTitle: {
        fontSize: typography.size.xxl,
        fontWeight: typography.weight.bold,
        color: studentColors.textPrimary,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    centeredSub: {
        fontSize: typography.size.md,
        color: studentColors.textMuted,
        textAlign: 'center',
        marginBottom: spacing.xl,
        lineHeight: typography.lineHeight.lg,
    },
    centeredText: {
        fontSize: typography.size.md,
        color: studentColors.textMuted,
        marginTop: spacing.lg,
    },
    pillRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.xxl,
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    pill: {
        backgroundColor: studentColors.surface,
        borderRadius: borderRadius.full,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderWidth: 1,
        borderColor: studentColors.border,
    },
    pillText: {
        fontSize: typography.size.sm,
        color: studentColors.textSecondary,
        fontWeight: typography.weight.medium,
    },
    primaryBtn: {
        backgroundColor: studentColors.secondary,
        borderRadius: borderRadius.xl,
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.xxxl,
        alignItems: 'center',
        alignSelf: 'stretch',
        marginBottom: spacing.md,
        ...shadows.md,
    },
    primaryBtnText: {
        fontSize: typography.size.lg,
        fontWeight: typography.weight.bold,
        color: '#FFFFFF',
    },
    outlineBtn: {
        borderRadius: borderRadius.xl,
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.xxxl,
        alignItems: 'center',
        alignSelf: 'stretch',
        borderWidth: 2,
        borderColor: studentColors.border,
    },
    outlineBtnText: {
        fontSize: typography.size.lg,
        fontWeight: typography.weight.semibold,
        color: studentColors.textSecondary,
    },
    quizHeader: {
        backgroundColor: studentColors.surface,
        padding: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: studentColors.border,
        ...shadows.sm,
    },
    timerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    timer: {
        fontSize: typography.size.xl,
        fontWeight: typography.weight.bold,
        color: studentColors.secondary,
    },
    timerDanger: {
        color: studentColors.error,
    },
    counter: {
        fontSize: typography.size.md,
        fontWeight: typography.weight.semibold,
        color: studentColors.textSecondary,
    },
    progressBar: {
        height: 6,
        backgroundColor: studentColors.border,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: studentColors.secondary,
        borderRadius: 3,
    },
    questionArea: {
        flex: 1,
    },
    questionPad: {
        padding: spacing.xl,
        paddingBottom: spacing.xxxl,
    },
    questionText: {
        fontSize: typography.size.xl,
        fontWeight: typography.weight.semibold,
        color: studentColors.textPrimary,
        lineHeight: typography.lineHeight.xxl,
        marginBottom: spacing.sm,
    },
    questionTextGu: {
        fontSize: typography.size.md,
        color: studentColors.textSecondary,
        lineHeight: typography.lineHeight.lg,
        marginBottom: spacing.sm,
    },
    optionList: {
        marginTop: spacing.md,
        gap: spacing.md,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: studentColors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        borderWidth: 2,
        borderColor: studentColors.border,
        ...shadows.sm,
    },
    optionSelected: {
        borderColor: studentColors.secondary,
        backgroundColor: '#E3F2FD',
    },
    optionCorrect: {
        borderColor: studentColors.accentGreen,
        backgroundColor: '#F0FDF4',
    },
    optionWrong: {
        borderColor: studentColors.error,
        backgroundColor: '#FEF2F2',
    },
    optionBadge: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: studentColors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionBadgeSelected: {
        backgroundColor: studentColors.secondary,
    },
    optionBadgeCorrect: {
        backgroundColor: studentColors.accentGreen,
    },
    optionBadgeWrong: {
        backgroundColor: studentColors.error,
    },
    optionBadgeText: {
        fontSize: typography.size.md,
        fontWeight: typography.weight.bold,
        color: studentColors.textSecondary,
    },
    optionBadgeTextActive: {
        color: '#FFFFFF',
    },
    optionTextWrap: {
        flex: 1,
        marginLeft: spacing.md,
    },
    optionText: {
        fontSize: typography.size.md,
        color: studentColors.textPrimary,
        fontWeight: typography.weight.medium,
    },
    optionTextCorrect: {
        color: studentColors.accentGreen,
        fontWeight: typography.weight.semibold,
    },
    optionTextWrong: {
        color: studentColors.error,
    },
    optionTextGu: {
        fontSize: typography.size.sm,
        color: studentColors.textMuted,
        marginTop: spacing.xxs,
    },
    resultIcon: {
        fontSize: typography.size.xl,
        fontWeight: typography.weight.bold,
        marginLeft: spacing.sm,
    },
    quizFooter: {
        backgroundColor: studentColors.surface,
        padding: spacing.lg,
        borderTopWidth: 1,
        borderTopColor: studentColors.border,
    },
    nextBtn: {
        backgroundColor: studentColors.secondary,
        borderRadius: borderRadius.xl,
        paddingVertical: spacing.lg,
        alignItems: 'center',
        ...shadows.md,
    },
    nextBtnDisabled: {
        opacity: 0.35,
    },
    nextBtnText: {
        fontSize: typography.size.lg,
        fontWeight: typography.weight.bold,
        color: '#FFFFFF',
    },
    savingWrap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: spacing.huge,
    },
    resultContent: {
        padding: spacing.xl,
        paddingBottom: spacing.huge,
        alignItems: 'center',
    },
    resultHeaderWrap: {
        alignItems: 'center',
        marginBottom: spacing.xxl,
    },
    scoreCircleWrap: {
        marginBottom: spacing.xxl,
    },
    scoreCircle: {
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: studentColors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 5,
        borderColor: studentColors.border,
        ...shadows.lg,
    },
    scoreCirclePassed: {
        borderColor: studentColors.accentGreen,
    },
    scoreValue: {
        fontSize: typography.size.hero,
        fontWeight: typography.weight.bold,
        color: studentColors.textPrimary,
    },
    scoreLabel: {
        fontSize: typography.size.sm,
        color: studentColors.textMuted,
        marginTop: spacing.xxs,
    },
    statsCard: {
        flexDirection: 'row',
        backgroundColor: studentColors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        marginBottom: spacing.xxl,
        borderWidth: 1,
        borderColor: studentColors.border,
        alignSelf: 'stretch',
        ...shadows.sm,
    },
    statBlock: {
        flex: 1,
        alignItems: 'center',
    },
    statVal: {
        fontSize: typography.size.xl,
        fontWeight: typography.weight.bold,
        color: studentColors.textPrimary,
    },
    statValPoints: {
        color: studentColors.accentGreen,
    },
    statLbl: {
        fontSize: typography.size.sm,
        color: studentColors.textMuted,
        marginTop: spacing.xxs,
    },
    statDivider: {
        width: 1,
        backgroundColor: studentColors.border,
    },
});
