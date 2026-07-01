import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Switch,
} from 'react-native';
import { adminColors, typography, spacing, borderRadius } from '../../theme';
import { Button, TextInput } from '../../components/common';
import { useStandards } from '../../hooks/useStandards';
import { useSubjects } from '../../hooks/useSubjects';
import { useChapters } from '../../hooks/useChapters';
import { MCQ, QuizDifficulty } from '../../types';
import firestore from '@react-native-firebase/firestore';
import { COLLECTIONS } from '../../constants';

const DIFFICULTY_OPTIONS: { value: QuizDifficulty; label: string; color: string; bg: string }[] = [
    { value: 'easy', label: 'Easy', color: '#2E7D32', bg: '#E8F5E9' },
    { value: 'medium', label: 'Medium', color: '#F57F17', bg: '#FFF8E1' },
    { value: 'hard', label: 'Hard', color: '#C62828', bg: '#FFEBEE' },
];

export function AddEditMCQScreen({ route, navigation }: { route: any; navigation: any }): React.JSX.Element {
    const { subjectId: paramSubjectId, chapterId: paramChapterId, mcqId, standardId: paramStandardId, sessionId: paramSessionId } = route.params || {};

    const isEditing = !!mcqId;

    // ─── Selectors State ─────────────────────────────────────
    const { standards, loading: standardsLoading, isFallback } = useStandards();
    const [selectedStandard, setSelectedStandard] = useState<string | null>(paramStandardId || null);
    const [selectedSession, setSelectedSession] = useState<string>(paramSessionId || '1');
    const [selectedSubject, setSelectedSubject] = useState<string | null>(paramSubjectId || null);
    const [selectedChapter, setSelectedChapter] = useState<string | null>(paramChapterId || null);

    const { subjects, loading: subjectsLoading } = useSubjects(selectedStandard || undefined, selectedSession);
    const { chapters, loading: chaptersLoading } = useChapters(selectedSubject || undefined);

    // ─── Form State ──────────────────────────────────────────
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState<string[]>(['', '', '', '']);
    const [correctAnswer, setCorrectAnswer] = useState<number>(0);
    const [difficulty, setDifficulty] = useState<QuizDifficulty>('easy');
    const [isActive, setIsActive] = useState(true);
    const [isPremium, setIsPremium] = useState(false);

    // ─── Loading State ───────────────────────────────────────
    const [loadingMCQ, setLoadingMCQ] = useState(false);
    const [saving, setSaving] = useState(false);

    // ─── Load existing MCQ if editing ────────────────────────
    useEffect(() => {
        if (!mcqId) return;

        const loadMCQ = async () => {
            setLoadingMCQ(true);
            try {
                const doc = await firestore().collection(COLLECTIONS.MCQS).doc(mcqId).get();
                if (doc.exists) {
                    const data = doc.data() as MCQ;
                    setSelectedStandard(data.standard);
                    setSelectedSession(data.session);
                    setSelectedSubject(data.subjectId);
                    setSelectedChapter(data.chapterId || null);
                    setQuestion(data.question);
                    setOptions(data.options);
                    setCorrectAnswer(data.correctAnswer);
                    setDifficulty(data.difficulty);
                    setIsActive(data.isActive);
                    setIsPremium(data.isPremium ?? false);
                } else {
                    Alert.alert('Error', 'MCQ not found');
                    navigation.goBack();
                }
            } catch (err) {
                console.error('Failed to load MCQ:', err);
                Alert.alert('Error', 'Failed to load MCQ data');
            } finally {
                setLoadingMCQ(false);
            }
        };

        loadMCQ();
    }, [mcqId, navigation]);

    const handleOptionChange = (index: number, value: string) => {
        const updated = [...options];
        updated[index] = value;
        setOptions(updated);
    };

    const validate = (): boolean => {
        if (!selectedStandard) {
            Alert.alert('Validation', 'Please select a standard');
            return false;
        }
        if (!selectedSubject) {
            Alert.alert('Validation', 'Please select a subject');
            return false;
        }
        if (!question.trim()) {
            Alert.alert('Validation', 'Please enter the question text');
            return false;
        }
        const filledOptions = options.filter(o => o.trim().length > 0);
        if (filledOptions.length < 4) {
            Alert.alert('Validation', 'Please fill all 4 options');
            return false;
        }
        return true;
    };

    const handleSave = async () => {
        if (!validate()) return;

        setSaving(true);
        try {
            const mcqData = {
                standard: selectedStandard,
                session: selectedSession,
                subjectId: selectedSubject,
                chapterId: selectedChapter || '',
                question: question.trim(),
                options: options.map(o => o.trim()),
                correctAnswer,
                difficulty,
                isActive,
                isPremium,
                isDeleted: false,
                updatedAt: firestore.FieldValue.serverTimestamp(),
            };

            if (isEditing && mcqId) {
                await firestore().collection(COLLECTIONS.MCQS).doc(mcqId).update(mcqData);
                Alert.alert('Success', 'MCQ updated successfully');
            } else {
                const newDoc = firestore().collection(COLLECTIONS.MCQS).doc();
                await newDoc.set({
                    ...mcqData,
                    id: newDoc.id,
                    createdAt: firestore.FieldValue.serverTimestamp(),
                });
                Alert.alert('Success', 'MCQ added successfully');
            }

            navigation.goBack();
        } catch (err) {
            console.error('Save MCQ error:', err);
            Alert.alert('Error', 'Failed to save MCQ');
        } finally {
            setSaving(false);
        }
    };

    if (loadingMCQ) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={adminColors.primary} />
                <Text style={styles.loadingText}>Loading MCQ...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={styles.pageTitle}>{isEditing ? '✏️ Edit MCQ' : '➕ Add MCQ'}</Text>

            <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Standard <Text style={styles.required}>*</Text></Text>
                {standardsLoading ? (
                    <ActivityIndicator size="small" color={adminColors.primary} style={styles.inlineLoader} />
                ) : (
                    <>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                            {standards.map((s) => (
                                <TouchableOpacity
                                    key={s.id}
                                    style={[styles.chip, selectedStandard === s.id && styles.chipActive]}
                                    onPress={() => {
                                        setSelectedStandard(s.id);
                                        setSelectedSubject(null);
                                        setSelectedChapter(null);
                                    }}
                                >
                                    <Text style={[styles.chipText, selectedStandard === s.id && styles.chipTextActive]}>
                                        {s.label} {s.labelGu ? `(${s.labelGu})` : ''}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        {isFallback && (
                            <Text style={styles.emptyStateText}>⚠️ No Standards Found. Please add standards first.</Text>
                        )}
                    </>
                )}
            </View>

            {/* ─── Session Selector ──────────────────────────── */}
            <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Session <Text style={styles.required}>*</Text></Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                    {['1', '2'].map((s) => (
                        <TouchableOpacity
                            key={s}
                            style={[styles.chip, selectedSession === s && styles.chipActive]}
                            onPress={() => setSelectedSession(s)}
                        >
                            <Text style={[styles.chipText, selectedSession === s && styles.chipTextActive]}>
                                સત્ર {s}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* ─── Subject Selector ──────────────────────────── */}
            <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Subject <Text style={styles.required}>*</Text></Text>
                {subjectsLoading ? (
                    <ActivityIndicator size="small" color={adminColors.primary} style={styles.inlineLoader} />
                ) : subjects.length === 0 ? (
                    <Text style={styles.emptyText}>
                        {selectedStandard ? 'No subjects found' : 'Select a standard first'}
                    </Text>
                ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                        {subjects.map((s) => (
                            <TouchableOpacity
                                key={s.id}
                                style={[styles.chip, selectedSubject === s.id && styles.chipActive]}
                                onPress={() => {
                                    setSelectedSubject(s.id);
                                    setSelectedChapter(null);
                                }}
                            >
                                <Text style={[styles.chipText, selectedSubject === s.id && styles.chipTextActive]}>
                                    {s.name} {s.nameGu ? `(${s.nameGu})` : ''}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}
            </View>

            {/* ─── Chapter Selector (Optional) ───────────────── */}
            <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Chapter <Text style={styles.optional}>(Optional)</Text></Text>
                {chaptersLoading ? (
                    <ActivityIndicator size="small" color={adminColors.primary} style={styles.inlineLoader} />
                ) : chapters.length === 0 ? (
                    <Text style={styles.emptyText}>
                        {selectedSubject ? 'No chapters found' : 'Select a subject first'}
                    </Text>
                ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                        <TouchableOpacity
                            style={[styles.chip, selectedChapter === null && styles.chipActive]}
                            onPress={() => setSelectedChapter(null)}
                        >
                            <Text style={[styles.chipText, selectedChapter === null && styles.chipTextActive]}>
                                None
                            </Text>
                        </TouchableOpacity>
                        {chapters.map((c) => (
                            <TouchableOpacity
                                key={c.id}
                                style={[styles.chip, selectedChapter === c.id && styles.chipActive]}
                                onPress={() => setSelectedChapter(c.id)}
                            >
                                <Text style={[styles.chipText, selectedChapter === c.id && styles.chipTextActive]}>
                                    {c.title} {c.titleGu ? `(${c.titleGu})` : ''}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}
            </View>

            {/* ─── Question ──────────────────────────────────── */}
            <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Question <Text style={styles.required}>*</Text></Text>
                <TextInput
                    label="Question"
                    placeholder="Enter question text..."
                    value={question}
                    onChangeText={setQuestion}
                    multiline
                    numberOfLines={3}
                    style={styles.textAreaContainer}
                />
            </View>

            {/* ─── Options ───────────────────────────────────── */}
            <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Options <Text style={styles.required}>*</Text></Text>
                {options.map((opt, idx) => (
                    <View key={idx} style={styles.optionRow}>
                        <TouchableOpacity
                            style={[
                                styles.optionRadio,
                                correctAnswer === idx && styles.optionRadioSelected,
                            ]}
                            onPress={() => setCorrectAnswer(idx)}
                        >
                            {correctAnswer === idx && <View style={styles.optionRadioInner} />}
                        </TouchableOpacity>
                        <TextInput
                            label={`Option ${idx + 1}`}
                            placeholder={`Option ${idx + 1}`}
                            value={opt}
                            onChangeText={(val: string) => handleOptionChange(idx, val)}
                            style={styles.optionInput}
                        />
                        {correctAnswer === idx && (
                            <Text style={styles.correctBadge}>✓ Correct</Text>
                        )}
                    </View>
                ))}
                <Text style={styles.hintText}>Tap the circle to mark the correct answer</Text>
            </View>

            {/* ─── Difficulty ────────────────────────────────── */}
            <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Difficulty</Text>
                <View style={styles.difficultyRow}>
                    {DIFFICULTY_OPTIONS.map((d) => (
                        <TouchableOpacity
                            key={d.value}
                            style={[
                                styles.difficultyChip,
                                { backgroundColor: difficulty === d.value ? d.bg : adminColors.surface, borderColor: difficulty === d.value ? d.color : adminColors.border },
                            ]}
                            onPress={() => setDifficulty(d.value)}
                        >
                            <Text style={[styles.difficultyText, { color: difficulty === d.value ? d.color : adminColors.textSecondary }]}>
                                {d.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* ─── Active Toggle ─────────────────────────────── */}
            <View style={styles.toggleRow}>
                <View style={styles.toggleInfo}>
                    <Text style={styles.toggleLabel}>Active</Text>
                    <Text style={styles.toggleDesc}>Only active MCQs appear in student practice tests</Text>
                </View>
                <Switch
                    value={isActive}
                    onValueChange={setIsActive}
                    trackColor={{ false: adminColors.border, true: adminColors.primary }}
                    thumbColor={adminColors.surface}
                />
            </View>

            {/* ─── Premium Toggle ───────────────────────────── */}
            <View style={styles.toggleRow}>
                <View style={styles.toggleInfo}>
                    <Text style={styles.toggleLabel}>💎 Premium Content</Text>
                    <Text style={styles.toggleDesc}>Only premium users can access this MCQ</Text>
                </View>
                <Switch
                    value={isPremium}
                    onValueChange={setIsPremium}
                    trackColor={{ false: adminColors.border, true: '#FFD54F' }}
                    thumbColor={isPremium ? '#E65100' : adminColors.surface}
                />
            </View>

            {/* ─── Save Button ───────────────────────────────── */}
            <Button
                title={isEditing ? 'Update MCQ' : 'Save MCQ'}
                onPress={handleSave}
                loading={saving}
                style={styles.saveBtn}
            />

            <View style={styles.bottomSpacer} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: adminColors.background,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: spacing.xl,
        paddingBottom: 100,
    },
    pageTitle: {
        fontSize: typography.size.xxl,
        fontWeight: typography.weight.bold,
        color: adminColors.textPrimary,
        marginBottom: spacing.xxl,
    },
    loadingText: {
        marginTop: spacing.md,
        color: adminColors.textSecondary,
        fontSize: typography.size.md,
    },
    fieldGroup: {
        marginBottom: spacing.xl,
    },
    fieldLabel: {
        fontSize: typography.size.sm,
        fontWeight: typography.weight.semibold,
        color: adminColors.textSecondary,
        textTransform: 'uppercase',
        marginBottom: spacing.sm,
    },
    required: {
        color: adminColors.error,
    },
    optional: {
        color: adminColors.textMuted,
        textTransform: 'none',
        fontWeight: typography.weight.regular,
    },
    inlineLoader: {
        alignSelf: 'flex-start',
        padding: spacing.md,
    },
    emptyText: {
        fontSize: typography.size.sm,
        color: adminColors.textMuted,
        fontStyle: 'italic',
        paddingVertical: spacing.sm,
    },
    chipRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        paddingBottom: spacing.xs,
    },
    chip: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        backgroundColor: adminColors.surface,
        borderWidth: 1,
        borderColor: adminColors.border,
    },
    chipActive: {
        backgroundColor: adminColors.primary,
        borderColor: adminColors.primary,
    },
    chipText: {
        fontSize: typography.size.sm,
        color: adminColors.textSecondary,
        fontWeight: typography.weight.medium,
    },
    chipTextActive: {
        color: adminColors.surface,
        fontWeight: typography.weight.bold,
    },
    textAreaContainer: {
        minHeight: 80,
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
        gap: spacing.md,
    },
    optionRadio: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: adminColors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionRadioSelected: {
        borderColor: adminColors.accentGreen,
    },
    optionRadioInner: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: adminColors.accentGreen,
    },
    optionInput: {
        flex: 1,
    },
    correctBadge: {
        fontSize: typography.size.xs,
        fontWeight: typography.weight.bold,
        color: adminColors.accentGreen,
    },
    hintText: {
        fontSize: typography.size.xs,
        color: adminColors.textMuted,
        marginTop: spacing.xs,
    },
    difficultyRow: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    difficultyChip: {
        flex: 1,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1.5,
        alignItems: 'center',
    },
    difficultyText: {
        fontSize: typography.size.sm,
        fontWeight: typography.weight.bold,
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: adminColors.surface,
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.xxl,
        borderWidth: 1,
        borderColor: adminColors.border,
    },
    toggleInfo: {
        flex: 1,
        paddingRight: spacing.lg,
    },
    toggleLabel: {
        fontSize: typography.size.md,
        fontWeight: typography.weight.semibold,
        color: adminColors.textPrimary,
        marginBottom: 2,
    },
    toggleDesc: {
        fontSize: typography.size.xs,
        color: adminColors.textSecondary,
    },
    saveBtn: {
        marginTop: spacing.md,
    },
    bottomSpacer: {
        height: spacing.huge,
    },
    emptyStateText: {
        color: adminColors.accentRed,
        fontSize: typography.size.xs,
        marginTop: spacing.xs,
        fontWeight: typography.weight.medium,
    },
});
