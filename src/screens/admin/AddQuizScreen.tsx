import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Switch,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { adminColors, typography, spacing, borderRadius, shadows } from '../../theme';
import { useAdminQuizzes } from '../../hooks/useAdminQuizzes';
import { useSubjects } from '../../hooks/useSubjects';
import { useChapters } from '../../hooks/useChapters';

const STANDARDS = ['1', '2', '3', '4', '5', '6', '7', '8'];
const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

interface Props {
    navigation: any;
}

export function AddQuizScreen({ navigation }: Props): React.JSX.Element {
    const [title, setTitle] = useState('');
    const [standardId, setStandardId] = useState('5');
    const [subjectId, setSubjectId] = useState('');
    const [chapterId, setChapterId] = useState('');
    const [totalMarks, setTotalMarks] = useState('100');
    const [timeLimitSeconds, setTimeLimitSeconds] = useState('300');
    const [passingScore, setPassingScore] = useState('60');
    const [session, setSession] = useState('1');
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
    const [isMixed, setIsMixed] = useState(false);
    const [isDailyQuiz, setIsDailyQuiz] = useState(false);
    const [isActive, setIsActive] = useState(true);
    const [isPremium, setIsPremium] = useState(false);
    const [saving, setSaving] = useState(false);

    const { addQuiz } = useAdminQuizzes();
    const { subjects, loading: subjectsLoading } = useSubjects(standardId, session);
    const { chapters, loading: chaptersLoading } = useChapters(subjectId || undefined);

    const handleSave = useCallback(async () => {
        if (!title.trim()) {
            Alert.alert('Validation', 'Quiz title is required.');
            return;
        }
        if (!subjectId) {
            Alert.alert('Validation', 'Please select a subject.');
            return;
        }

        setSaving(true);
        try {
            const quizId = await addQuiz({
                title: title.trim(),
                subjectId,
                chapterId: chapterId || undefined,
                standardId,
                session,
                totalMarks: parseInt(totalMarks, 10) || 100,
                timeLimitSeconds: parseInt(timeLimitSeconds, 10) || 300,
                passingScore: parseInt(passingScore, 10) || 60,
                difficulty,
                isMixed,
                isDailyQuiz,
                isActive,
                isPremium,
            });
            console.log(title, subjectId, chapterId, standardId, session, totalMarks, timeLimitSeconds, passingScore, difficulty, isMixed, isDailyQuiz, isActive, isPremium);
            console.log('first quiz id:', quizId);
            if (quizId) {
                Alert.alert(
                    '✅ Quiz Created',
                    isDailyQuiz
                        ? 'Quiz created and set as Daily Quiz for Std ' + standardId + '.'
                        : 'Quiz created successfully.',
                    [{ text: 'OK', onPress: () => navigation.goBack() }],
                );
            } else {
                Alert.alert('Error', 'Failed to create quiz. Please try again.');
            }
        } catch (err) {
            console.error('Quiz creation error:', err);
            Alert.alert('Error', 'Failed to create quiz: ' + (err as Error).message);
        } finally {
            setSaving(false);
        }
    }, [title, subjectId, chapterId, standardId, session, totalMarks, timeLimitSeconds, passingScore, difficulty, isMixed, isDailyQuiz, isActive, isPremium, addQuiz, navigation]);

    return (
        <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Quiz Title */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Quiz Title *</Text>
                    <TextInput
                        style={styles.input}
                        value={title}
                        onChangeText={setTitle}
                        placeholder="Enter quiz title"
                        placeholderTextColor={adminColors.textMuted}
                        returnKeyType="done"
                    />
                </View>

                {/* Standard Picker */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Standard *</Text>
                    <View style={styles.chipRow}>
                        {STANDARDS.map((s) => (
                            <TouchableOpacity
                                key={s}
                                style={[styles.chip, standardId === s && styles.chipActive]}
                                onPress={() => { setStandardId(s); setSubjectId(''); setChapterId(''); }}
                            >
                                <Text style={[styles.chipText, standardId === s && styles.chipTextActive]}>
                                    {s}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Session Picker */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Session *</Text>
                    <View style={styles.chipRow}>
                        {['1', '2'].map((s) => (
                            <TouchableOpacity
                                key={s}
                                style={[styles.chip, session === s && styles.chipActive]}
                                onPress={() => { setSession(s); setSubjectId(''); setChapterId(''); }}
                            >
                                <Text style={[styles.chipText, session === s && styles.chipTextActive]}>
                                    સત્ર {s}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Subject Picker */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Subject *</Text>
                    {subjectsLoading ? (
                        <ActivityIndicator size="small" color={adminColors.primary} />
                    ) : subjects.length === 0 ? (
                        <Text style={styles.noDataText}>No subjects for Std {standardId}</Text>
                    ) : (
                        <View style={styles.chipRow}>
                            {subjects.map((s) => (
                                <TouchableOpacity
                                    key={s.id}
                                    style={[styles.chip, subjectId === s.id && styles.chipActive]}
                                    onPress={() => { setSubjectId(s.id); setChapterId(''); }}
                                >
                                    <Text style={[styles.chipText, subjectId === s.id && styles.chipTextActive]}>
                                        {s.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                {/* Chapter Picker */}
                {subjectId ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Chapter (optional)</Text>
                        {chaptersLoading ? (
                            <ActivityIndicator size="small" color={adminColors.primary} />
                        ) : chapters.length === 0 ? (
                            <Text style={styles.noDataText}>No chapters — quiz covers entire subject</Text>
                        ) : (
                            <View style={styles.chipRow}>
                                <TouchableOpacity
                                    style={[styles.chip, chapterId === '' && styles.chipActive]}
                                    onPress={() => setChapterId('')}
                                >
                                    <Text style={[styles.chipText, chapterId === '' && styles.chipTextActive]}>
                                        All
                                    </Text>
                                </TouchableOpacity>
                                {chapters.map((c) => (
                                    <TouchableOpacity
                                        key={c.id}
                                        style={[styles.chip, chapterId === c.id && styles.chipActive]}
                                        onPress={() => setChapterId(c.id)}
                                    >
                                        <Text style={[styles.chipText, chapterId === c.id && styles.chipTextActive]}>
                                            {c.title}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>
                ) : null}

                {/* Numeric Fields */}
                <View style={styles.row3}>
                    <View style={styles.col}>
                        <Text style={styles.sectionLabel}>Total Marks</Text>
                        <TextInput
                            style={styles.input}
                            value={totalMarks}
                            onChangeText={setTotalMarks}
                            keyboardType="number-pad"
                            placeholderTextColor={adminColors.textMuted}
                        />
                    </View>
                    <View style={styles.col}>
                        <Text style={styles.sectionLabel}>Time (sec)</Text>
                        <TextInput
                            style={styles.input}
                            value={timeLimitSeconds}
                            onChangeText={setTimeLimitSeconds}
                            keyboardType="number-pad"
                            placeholderTextColor={adminColors.textMuted}
                        />
                    </View>
                    <View style={styles.col}>
                        <Text style={styles.sectionLabel}>Pass %</Text>
                        <TextInput
                            style={styles.input}
                            value={passingScore}
                            onChangeText={setPassingScore}
                            keyboardType="number-pad"
                            placeholderTextColor={adminColors.textMuted}
                        />
                    </View>
                </View>

                {/* Difficulty */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Difficulty</Text>
                    <View style={styles.chipRow}>
                        {DIFFICULTIES.map((d) => (
                            <TouchableOpacity
                                key={d}
                                style={[styles.chip, styles.chipWide,
                                difficulty === d && styles.chipActive,
                                difficulty === d && d === 'medium' && styles.chipActiveMed,
                                difficulty === d && d === 'hard' && styles.chipActiveHard,
                                ]}
                                onPress={() => setDifficulty(d)}
                            >
                                <Text style={[styles.chipText, difficulty === d && styles.chipTextActive]}>
                                    {d === 'easy' ? '🟢 Easy' : d === 'medium' ? '🟡 Medium' : '🔴 Hard'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Toggles */}
                <View style={styles.toggleCard}>
                    <View style={styles.toggleRow}>
                        <View style={styles.toggleInfo}>
                            <Text style={styles.toggleLabel}>🔀 Mixed Quiz</Text>
                            <Text style={styles.toggleSub}>
                                Quiz is not tied to a single chapter.
                            </Text>
                        </View>
                        <Switch
                            value={isMixed}
                            onValueChange={(val) => {
                                setIsMixed(val);
                                if (val) {setChapterId('');}
                            }}
                            trackColor={{ true: adminColors.primary, false: adminColors.border }}
                            thumbColor={isMixed ? '#FFFFFF' : adminColors.textMuted}
                        />
                    </View>

                    <View style={styles.toggleDivider} />

                    <View style={styles.toggleRow}>
                        <View style={styles.toggleInfo}>
                            <Text style={styles.toggleLabel}>⚡ Daily Quiz Challenge</Text>
                            <Text style={styles.toggleSub}>
                                Only one per standard — others will be unset automatically.
                            </Text>
                        </View>
                        <Switch
                            value={isDailyQuiz}
                            onValueChange={setIsDailyQuiz}
                            trackColor={{ true: '#FFD54F', false: adminColors.border }}
                            thumbColor={isDailyQuiz ? '#E65100' : adminColors.textMuted}
                        />
                    </View>

                    <View style={styles.toggleDivider} />

                    <View style={styles.toggleRow}>
                        <View style={styles.toggleInfo}>
                            <Text style={styles.toggleLabel}>🟢 Active</Text>
                            <Text style={styles.toggleSub}>
                                Students can only see and take active quizzes.
                            </Text>
                        </View>
                        <Switch
                            value={isActive}
                            onValueChange={setIsActive}
                            trackColor={{ true: adminColors.accentGreen, false: adminColors.border }}
                            thumbColor={isActive ? '#FFFFFF' : adminColors.textMuted}
                        />
                    </View>

                    <View style={styles.toggleDivider} />

                    <View style={styles.toggleRow}>
                        <View style={styles.toggleInfo}>
                            <Text style={styles.toggleLabel}>💎 Premium Content</Text>
                            <Text style={styles.toggleSub}>
                                Only premium users can access this quiz.
                            </Text>
                        </View>
                        <Switch
                            value={isPremium}
                            onValueChange={setIsPremium}
                            trackColor={{ true: '#FFD54F', false: adminColors.border }}
                            thumbColor={isPremium ? '#E65100' : adminColors.textMuted}
                        />
                    </View>
                </View>

                {/* Save Button */}
                <TouchableOpacity
                    style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                    onPress={handleSave}
                    disabled={saving}
                    activeOpacity={0.8}
                >
                    {saving ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <Text style={styles.saveBtnText}>Create Quiz</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
        backgroundColor: adminColors.background,
    },
    container: {
        flex: 1,
        backgroundColor: adminColors.background,
    },
    content: {
        padding: spacing.xl,
        paddingBottom: spacing.huge,
    },
    section: {
        marginBottom: spacing.xl,
    },
    sectionLabel: {
        fontSize: typography.size.sm,
        fontWeight: typography.weight.semibold,
        color: adminColors.textSecondary,
        marginBottom: spacing.sm,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    input: {
        backgroundColor: adminColors.surface,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        fontSize: typography.size.md,
        color: adminColors.textPrimary,
        borderWidth: 1,
        borderColor: adminColors.border,
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    chip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        backgroundColor: adminColors.surface,
        borderWidth: 1,
        borderColor: adminColors.border,
    },
    chipActive: {
        backgroundColor: adminColors.primary + '22',
        borderColor: adminColors.primary,
    },
    chipActiveMed: {
        backgroundColor: adminColors.accentOrange + '22',
        borderColor: adminColors.accentOrange,
    },
    chipActiveHard: {
        backgroundColor: adminColors.error + '22',
        borderColor: adminColors.error,
    },
    chipWide: {
        flex: 1,
        alignItems: 'center',
    },
    chipText: {
        fontSize: typography.size.sm,
        color: adminColors.textMuted,
        fontWeight: typography.weight.medium,
    },
    chipTextActive: {
        color: adminColors.textPrimary,
        fontWeight: typography.weight.bold,
    },
    noDataText: {
        fontSize: typography.size.sm,
        color: adminColors.textMuted,
        fontStyle: 'italic',
    },
    row3: {
        flexDirection: 'row',
        gap: spacing.md,
        marginBottom: spacing.xl,
    },
    col: {
        flex: 1,
    },
    toggleCard: {
        backgroundColor: adminColors.surface,
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        borderColor: adminColors.border,
        marginBottom: spacing.xxl,
        overflow: 'hidden',
        ...shadows.sm,
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.lg,
        gap: spacing.md,
    },
    toggleInfo: {
        flex: 1,
    },
    toggleLabel: {
        fontSize: typography.size.md,
        fontWeight: typography.weight.semibold,
        color: adminColors.textPrimary,
    },
    toggleSub: {
        fontSize: typography.size.sm,
        color: adminColors.textMuted,
        marginTop: spacing.xxs,
        lineHeight: typography.lineHeight.md,
    },
    toggleDivider: {
        height: 1,
        backgroundColor: adminColors.border,
        marginHorizontal: spacing.lg,
    },
    saveBtn: {
        backgroundColor: adminColors.primary,
        borderRadius: borderRadius.xl,
        paddingVertical: spacing.lg,
        alignItems: 'center',
        ...shadows.md,
    },
    saveBtnDisabled: {
        opacity: 0.5,
    },
    saveBtnText: {
        fontSize: typography.size.lg,
        fontWeight: typography.weight.bold,
        color: '#FFFFFF',
    },
});
