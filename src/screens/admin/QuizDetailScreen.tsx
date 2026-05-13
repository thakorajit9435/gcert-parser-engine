import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    Switch,
    Alert,
    ActivityIndicator,
    RefreshControl,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { adminColors, typography, spacing, borderRadius, shadows } from '../../theme';
import { useAdminQuizzes } from '../../hooks/useAdminQuizzes';
import { Quiz, Question } from '../../types';
import { COLLECTIONS } from '../../constants';

interface Props {
    navigation: any;
    route: any;
}

// ── Add Question Form ─────────────────────────────────────────

interface AddQuestionFormProps {
    quizId: string;
    questionsCount: number;
    onSaved: () => void;
    onCancel: () => void;
}

function AddQuestionForm({ quizId, questionsCount, onSaved, onCancel }: AddQuestionFormProps): React.JSX.Element {
    const [questionText, setQuestionText] = useState('');
    const [opts, setOpts] = useState(['', '', '', '']);
    const [correctIndex, setCorrectIndex] = useState(0);
    const [saving, setSaving] = useState(false);

    const updateOpt = useCallback((i: number, val: string) => {
        setOpts((prev) => { const next = [...prev]; next[i] = val; return next; });
    }, []);

    const handleSave = useCallback(async () => {
        if (!questionText.trim()) {
            Alert.alert('Validation', 'Question text is required.');
            return;
        }
        const filledOpts = opts.filter((o) => o.trim());
        if (filledOpts.length < 2) {
            Alert.alert('Validation', 'At least 2 options are required.');
            return;
        }

        setSaving(true);
        try {
            const optionIds = opts.map(() => firestore().collection('_tmp').doc().id);
            const formattedOptions = opts
                .map((text, i) => ({ id: optionIds[i] ?? '', text: text.trim() }))
                .filter((o) => o.text);

            const batch = firestore().batch();

            const qRef = firestore()
                .collection(COLLECTIONS.QUIZZES)
                .doc(quizId)
                .collection(COLLECTIONS.QUESTIONS)
                .doc();

            batch.set(qRef, {
                quizId,
                questionText: questionText.trim(),
                options: formattedOptions,
                correctOptionId: optionIds[correctIndex] ?? optionIds[0],
                points: 10,
                order: questionsCount + 1,
                isDeleted: false,
                createdAt: firestore.FieldValue.serverTimestamp(),
                updatedAt: firestore.FieldValue.serverTimestamp(),
            });

            batch.update(
                firestore().collection(COLLECTIONS.QUIZZES).doc(quizId),
                {
                    totalQuestions: firestore.FieldValue.increment(1),
                    updatedAt: firestore.FieldValue.serverTimestamp(),
                },
            );

            await batch.commit();
            onSaved();
        } catch (err) {
            Alert.alert('Error', (err as Error).message);
        } finally {
            setSaving(false);
        }
    }, [questionText, opts, correctIndex, quizId, questionsCount, onSaved]);

    const LABELS = ['A', 'B', 'C', 'D'];

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.questionForm}>
                <Text style={styles.formHeading}>Add New Question</Text>

                <Text style={styles.fieldLabel}>Question Text *</Text>
                <TextInput
                    style={[styles.input, styles.inputMulti]}
                    value={questionText}
                    onChangeText={setQuestionText}
                    multiline
                    numberOfLines={3}
                    placeholder="Type your question here…"
                    placeholderTextColor={adminColors.textMuted}
                />

                {LABELS.map((lbl, i) => (
                    <View key={lbl} style={styles.optRow}>
                        <TouchableOpacity
                            style={[styles.correctBtn, correctIndex === i && styles.correctBtnActive]}
                            onPress={() => setCorrectIndex(i)}
                        >
                            <Text style={[styles.correctBtnText, correctIndex === i && styles.correctBtnTextActive]}>
                                {correctIndex === i ? '✓' : lbl}
                            </Text>
                        </TouchableOpacity>
                        <TextInput
                            style={[styles.input, styles.optInput]}
                            value={opts[i]}
                            onChangeText={(v) => updateOpt(i, v)}
                            placeholder={`Option ${lbl}`}
                            placeholderTextColor={adminColors.textMuted}
                        />
                    </View>
                ))}

                <Text style={styles.correctHint}>
                    Tap the letter to mark the correct answer (currently: {LABELS[correctIndex]})
                </Text>

                <View style={styles.formBtns}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        {saving
                            ? <ActivityIndicator size="small" color="#FFF" />
                            : <Text style={styles.saveBtnText}>Save Question</Text>
                        }
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

// ── QuizDetailScreen ──────────────────────────────────────────

export function QuizDetailScreen({ route }: Props): React.JSX.Element {
    const { quizId } = route.params;
    const { quizzes, updateQuiz } = useAdminQuizzes();

    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loadingQ, setLoadingQ] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [togglingDaily, setTogglingDaily] = useState(false);
    const [togglingActive, setTogglingActive] = useState(false);

    // ── Inline Edit State ──
    const [editing, setEditing] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editTotalMarks, setEditTotalMarks] = useState('');
    const [savingEdit, setSavingEdit] = useState(false);

    // Sync quiz from live hook data
    useEffect(() => {
        const found = quizzes.find((q) => q.id === quizId);
        if (found) {
            setQuiz(found);
            if (!editing) {
                setEditTitle(found.title);
                setEditTotalMarks(String(found.totalMarks));
            }
        }
    }, [quizzes, quizId, editing]);

    const fetchQuestions = useCallback(async () => {
        try {
            const snap = await firestore()
                .collection(COLLECTIONS.QUIZZES)
                .doc(quizId)
                .collection(COLLECTIONS.QUESTIONS)
                .orderBy('order', 'asc')
                .get();
            const data = snap.docs
                .map((doc) => ({ id: doc.id, ...doc.data() }) as Question)
                .filter((q) => !q.isDeleted);
            setQuestions(data);
        } catch (err) {
            Alert.alert('Error', (err as Error).message);
        } finally {
            setLoadingQ(false);
            setRefreshing(false);
        }
    }, [quizId]);

    useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchQuestions();
    }, [fetchQuestions]);

    const handleDailyToggle = useCallback(async (value: boolean) => {
        if (!quiz) { return; }

        if (value) {
            Alert.alert(
                'Set as Daily Quiz',
                `This will unset the current daily quiz for Std ${quiz.standardId} and set this one. Continue?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Set Daily',
                        onPress: async () => {
                            setTogglingDaily(true);
                            await updateQuiz(quizId, { isDailyQuiz: true, standardId: quiz.standardId });
                            setTogglingDaily(false);
                        },
                    },
                ],
            );
        } else {
            setTogglingDaily(true);
            await updateQuiz(quizId, { isDailyQuiz: false });
            setTogglingDaily(false);
        }
    }, [quiz, quizId, updateQuiz]);

    const handleActiveToggle = useCallback(async (value: boolean) => {
        setTogglingActive(true);
        await updateQuiz(quizId, { isActive: value });
        setTogglingActive(false);
    }, [quizId, updateQuiz]);

    const handleQuestionSaved = useCallback(() => {
        setShowAddForm(false);
        fetchQuestions();
    }, [fetchQuestions]);

    const handleStartEdit = useCallback(() => {
        if (quiz) {
            setEditTitle(quiz.title);
            setEditTotalMarks(String(quiz.totalMarks));
            setEditing(true);
        }
    }, [quiz]);

    const handleCancelEdit = useCallback(() => {
        setEditing(false);
        if (quiz) {
            setEditTitle(quiz.title);
            setEditTotalMarks(String(quiz.totalMarks));
        }
    }, [quiz]);

    const handleSaveEdit = useCallback(async () => {
        if (!editTitle.trim()) {
            Alert.alert('Validation', 'Quiz title cannot be empty.');
            return;
        }
        const marks = parseInt(editTotalMarks, 10);
        if (isNaN(marks) || marks <= 0) {
            Alert.alert('Validation', 'Total marks must be a positive number.');
            return;
        }

        setSavingEdit(true);
        const ok = await updateQuiz(quizId, {
            title: editTitle.trim(),
            totalMarks: marks,
        });
        setSavingEdit(false);

        if (ok) {
            setEditing(false);
            Alert.alert('✅ Updated', 'Quiz details saved successfully.');
        } else {
            Alert.alert('Error', 'Failed to save changes.');
        }
    }, [editTitle, editTotalMarks, quizId, updateQuiz]);

    const renderQuestion = useCallback(({ item, index }: { item: Question; index: number }) => (
        <View style={styles.qCard}>
            <Text style={styles.qNum}>Q{index + 1}</Text>
            <Text style={styles.qText}>{item.questionText}</Text>
            <View style={styles.qOptions}>
                {item.options.map((opt, oIdx) => {
                    const isCorrect = opt.id === item.correctOptionId;
                    return (
                        <View key={opt.id} style={[styles.optPill, isCorrect && styles.optPillCorrect]}>
                            <View style={[styles.optLabel, isCorrect && styles.optLabelCorrect]}>
                                <Text style={[styles.optLabelText, isCorrect && styles.optLabelTextCorrect]}>
                                    {String.fromCharCode(65 + oIdx)}
                                </Text>
                            </View>
                            <Text style={[styles.optText, isCorrect && styles.optTextCorrect]}>
                                {opt.text}
                            </Text>
                            {isCorrect && <Text style={styles.optCorrectTick}>✓</Text>}
                        </View>
                    );
                })}
            </View>
        </View>
    ), []);

    if (!quiz) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={adminColors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={questions}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.listPad, questions.length === 0 && !showAddForm && styles.listFlex]}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={adminColors.primary} />
                }
                ListHeaderComponent={
                    <>
                        {/* Quiz Info Card */}
                        <View style={styles.infoCard}>
                            {editing ? (
                                <>
                                    <Text style={styles.editSectionLabel}>Quiz Title</Text>
                                    <TextInput
                                        style={styles.editInput}
                                        value={editTitle}
                                        onChangeText={setEditTitle}
                                        placeholder="Quiz title"
                                        placeholderTextColor={adminColors.textMuted}
                                    />
                                    <Text style={styles.editSectionLabel}>Total Marks</Text>
                                    <TextInput
                                        style={styles.editInput}
                                        value={editTotalMarks}
                                        onChangeText={setEditTotalMarks}
                                        placeholder="Total marks"
                                        placeholderTextColor={adminColors.textMuted}
                                        keyboardType="number-pad"
                                    />
                                    <View style={styles.editBtnRow}>
                                        <TouchableOpacity style={styles.editCancelBtn} onPress={handleCancelEdit}>
                                            <Text style={styles.editCancelBtnText}>Cancel</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.editSaveBtn, savingEdit && styles.saveBtnDisabled]}
                                            onPress={handleSaveEdit}
                                            disabled={savingEdit}
                                        >
                                            {savingEdit ? (
                                                <ActivityIndicator size="small" color="#FFF" />
                                            ) : (
                                                <Text style={styles.editSaveBtnText}>Save Changes</Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </>
                            ) : (
                                <>
                                    <View style={styles.infoTitleRow}>
                                        <Text style={styles.infoTitle}>{quiz.title}</Text>
                                        <TouchableOpacity style={styles.editPencilBtn} onPress={handleStartEdit}>
                                            <Text style={styles.editPencilText}>✏️</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <Text style={styles.infoStd}>Standard {quiz.standardId}</Text>
                                </>
                            )}

                            <View style={styles.infoMetaRow}>
                                <Text style={styles.infoMeta}>📝 {quiz.totalQuestions} Q</Text>
                                <Text style={styles.infoMeta}>⏱ {Math.floor(quiz.timeLimitSeconds / 60)}m</Text>
                                <Text style={styles.infoMeta}>🎯 {quiz.passingScore}%</Text>
                                <Text style={styles.infoMeta}>🏆 {quiz.totalMarks} marks</Text>
                            </View>

                            {/* Daily Toggle */}
                            <View style={styles.infoToggleRow}>
                                <View style={styles.infoToggleInfo}>
                                    <Text style={styles.infoToggleLabel}>⚡ Daily Quiz Challenge</Text>
                                    <Text style={styles.infoToggleSub}>
                                        One per standard. Enabling will unset others.
                                    </Text>
                                </View>
                                {togglingDaily ? (
                                    <ActivityIndicator size="small" color={adminColors.primary} />
                                ) : (
                                    <Switch
                                        value={quiz.isDailyQuiz ?? false}
                                        onValueChange={handleDailyToggle}
                                        trackColor={{ true: '#FFD54F', false: adminColors.border }}
                                        thumbColor={quiz.isDailyQuiz ? '#E65100' : adminColors.textMuted}
                                    />
                                )}
                            </View>

                            <View style={styles.infoToggleDivider} />

                            {/* Active Toggle */}
                            <View style={styles.infoToggleRow}>
                                <View style={styles.infoToggleInfo}>
                                    <Text style={styles.infoToggleLabel}>🟢 Active</Text>
                                    <Text style={styles.infoToggleSub}>
                                        Students can only take active quizzes.
                                    </Text>
                                </View>
                                {togglingActive ? (
                                    <ActivityIndicator size="small" color={adminColors.accentGreen} />
                                ) : (
                                    <Switch
                                        value={quiz.isActive ?? true}
                                        onValueChange={handleActiveToggle}
                                        trackColor={{ true: adminColors.accentGreen, false: adminColors.border }}
                                        thumbColor={quiz.isActive ? '#FFFFFF' : adminColors.textMuted}
                                    />
                                )}
                            </View>
                        </View>

                        {/* Questions Header */}
                        <View style={styles.qHeader}>
                            <Text style={styles.qHeaderTitle}>
                                Questions ({questions.length})
                            </Text>
                            {!showAddForm && (
                                <TouchableOpacity
                                    style={styles.addQBtn}
                                    onPress={() => setShowAddForm(true)}
                                >
                                    <Text style={styles.addQBtnText}>＋ Add Question</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Add Question Form (inline) */}
                        {showAddForm && (
                            <AddQuestionForm
                                quizId={quizId}
                                questionsCount={questions.length}
                                onSaved={handleQuestionSaved}
                                onCancel={() => setShowAddForm(false)}
                            />
                        )}

                        {/* Loading */}
                        {loadingQ && (
                            <View style={styles.loadingQ}>
                                <ActivityIndicator size="small" color={adminColors.primary} />
                                <Text style={styles.loadingQText}>Loading questions…</Text>
                            </View>
                        )}
                    </>
                }
                renderItem={renderQuestion}
                ListEmptyComponent={
                    !loadingQ && !showAddForm ? (
                        <View style={styles.emptyQ}>
                            <Text style={styles.emptyQEmoji}>❓</Text>
                            <Text style={styles.emptyQTitle}>No Questions Yet</Text>
                            <Text style={styles.emptyQMsg}>Tap "+ Add Question" to get started.</Text>
                        </View>
                    ) : null
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: adminColors.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: adminColors.background },
    listPad: { padding: spacing.lg, paddingBottom: spacing.huge },
    listFlex: { flex: 1 },

    // Info card
    infoCard: {
        backgroundColor: adminColors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: adminColors.border,
        ...shadows.md,
    },
    infoTitle: {
        fontSize: typography.size.xl,
        fontWeight: typography.weight.bold,
        color: adminColors.textPrimary,
    },
    infoStd: {
        fontSize: typography.size.sm,
        color: adminColors.textMuted,
        marginTop: spacing.xxs,
        marginBottom: spacing.md,
    },
    infoMetaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
        marginBottom: spacing.lg,
    },
    infoMeta: {
        fontSize: typography.size.sm,
        color: adminColors.textSecondary,
    },
    infoToggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
    },
    infoToggleInfo: { flex: 1, marginRight: spacing.md },
    infoToggleLabel: {
        fontSize: typography.size.md,
        fontWeight: typography.weight.semibold,
        color: adminColors.textPrimary,
    },
    infoToggleSub: {
        fontSize: typography.size.sm,
        color: adminColors.textMuted,
        marginTop: 2,
    },
    infoToggleDivider: {
        height: 1,
        backgroundColor: adminColors.border,
    },

    // Questions section
    qHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    qHeaderTitle: {
        fontSize: typography.size.lg,
        fontWeight: typography.weight.semibold,
        color: adminColors.textPrimary,
    },
    addQBtn: {
        backgroundColor: adminColors.primary,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
    },
    addQBtnText: {
        fontSize: typography.size.sm,
        fontWeight: typography.weight.bold,
        color: '#FFFFFF',
    },

    // Question card
    qCard: {
        backgroundColor: adminColors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: adminColors.border,
        ...shadows.sm,
    },
    qNum: {
        fontSize: typography.size.sm,
        fontWeight: typography.weight.bold,
        color: adminColors.primary,
        marginBottom: spacing.xs,
    },
    qText: {
        fontSize: typography.size.md,
        color: adminColors.textPrimary,
        lineHeight: typography.lineHeight.lg,
        marginBottom: spacing.md,
    },
    qOptions: { gap: spacing.xs },
    optPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: adminColors.surfaceElevated,
        borderRadius: borderRadius.sm,
        padding: spacing.sm,
        paddingHorizontal: spacing.md,
        gap: spacing.sm,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    optPillCorrect: {
        backgroundColor: adminColors.accentGreen + '18',
        borderColor: adminColors.accentGreen,
    },
    optLabel: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: adminColors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    optLabelCorrect: { backgroundColor: adminColors.accentGreen },
    optLabelText: {
        fontSize: typography.size.xs,
        fontWeight: typography.weight.bold,
        color: adminColors.textMuted,
    },
    optLabelTextCorrect: { color: '#FFFFFF' },
    optText: {
        flex: 1,
        fontSize: typography.size.sm,
        color: adminColors.textSecondary,
    },
    optTextCorrect: {
        color: adminColors.accentGreen,
        fontWeight: typography.weight.semibold,
    },
    optCorrectTick: {
        fontSize: typography.size.md,
        color: adminColors.accentGreen,
    },

    // Add question form
    questionForm: {
        backgroundColor: adminColors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: adminColors.primary + '44',
        ...shadows.md,
    },
    formHeading: {
        fontSize: typography.size.lg,
        fontWeight: typography.weight.bold,
        color: adminColors.textPrimary,
        marginBottom: spacing.lg,
    },
    fieldLabel: {
        fontSize: typography.size.sm,
        fontWeight: typography.weight.semibold,
        color: adminColors.textSecondary,
        marginBottom: spacing.xs,
        textTransform: 'uppercase',
        letterSpacing: 0.4,
    },
    input: {
        backgroundColor: adminColors.surfaceElevated,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        fontSize: typography.size.md,
        color: adminColors.textPrimary,
        borderWidth: 1,
        borderColor: adminColors.border,
    },
    inputMulti: {
        minHeight: 80,
        textAlignVertical: 'top',
        marginBottom: spacing.lg,
    },
    optRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.sm,
    },
    correctBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: adminColors.surfaceElevated,
        borderWidth: 1,
        borderColor: adminColors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    correctBtnActive: {
        backgroundColor: adminColors.accentGreen,
        borderColor: adminColors.accentGreen,
    },
    correctBtnText: {
        fontSize: typography.size.sm,
        fontWeight: typography.weight.bold,
        color: adminColors.textMuted,
    },
    correctBtnTextActive: { color: '#FFFFFF' },
    optInput: { flex: 1 },
    correctHint: {
        fontSize: typography.size.xs,
        color: adminColors.textMuted,
        marginTop: spacing.xs,
        marginBottom: spacing.lg,
        fontStyle: 'italic',
    },
    formBtns: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: adminColors.border,
        alignItems: 'center',
    },
    cancelBtnText: {
        fontSize: typography.size.md,
        color: adminColors.textSecondary,
        fontWeight: typography.weight.medium,
    },
    saveBtn: {
        flex: 2,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        backgroundColor: adminColors.primary,
        alignItems: 'center',
    },
    saveBtnDisabled: { opacity: 0.5 },
    saveBtnText: {
        fontSize: typography.size.md,
        fontWeight: typography.weight.bold,
        color: '#FFFFFF',
    },

    // Loading / Empty
    loadingQ: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xl,
        gap: spacing.sm,
    },
    loadingQText: { fontSize: typography.size.sm, color: adminColors.textMuted },
    emptyQ: {
        alignItems: 'center',
        paddingVertical: spacing.huge,
    },
    emptyQEmoji: { fontSize: 48, marginBottom: spacing.md },
    emptyQTitle: {
        fontSize: typography.size.xl,
        fontWeight: typography.weight.semibold,
        color: adminColors.textPrimary,
        marginBottom: spacing.xs,
    },
    emptyQMsg: { fontSize: typography.size.md, color: adminColors.textMuted },

    // ── Inline Edit Styles ──
    infoTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    editPencilBtn: {
        padding: spacing.sm,
    },
    editPencilText: {
        fontSize: 18,
    },
    editSectionLabel: {
        fontSize: typography.size.sm,
        fontWeight: typography.weight.semibold,
        color: adminColors.textSecondary,
        marginBottom: spacing.xs,
        marginTop: spacing.md,
        textTransform: 'uppercase',
        letterSpacing: 0.4,
    },
    editInput: {
        backgroundColor: adminColors.surfaceElevated,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        fontSize: typography.size.md,
        color: adminColors.textPrimary,
        borderWidth: 1,
        borderColor: adminColors.borderFocus,
    },
    editBtnRow: {
        flexDirection: 'row',
        gap: spacing.md,
        marginTop: spacing.lg,
    },
    editCancelBtn: {
        flex: 1,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: adminColors.border,
        alignItems: 'center',
    },
    editCancelBtnText: {
        fontSize: typography.size.md,
        color: adminColors.textSecondary,
        fontWeight: typography.weight.medium,
    },
    editSaveBtn: {
        flex: 2,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        backgroundColor: adminColors.accentGreen,
        alignItems: 'center',
    },
    editSaveBtnText: {
        fontSize: typography.size.md,
        fontWeight: typography.weight.bold,
        color: '#FFFFFF',
    },
});
