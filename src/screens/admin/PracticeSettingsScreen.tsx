import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { adminColors, typography, spacing, borderRadius } from '../../theme';
import { Card, Button, TextInput } from '../../components/common';
import { useStandards } from '../../hooks/useStandards';
import firestore from '@react-native-firebase/firestore';
import { COLLECTIONS } from '../../constants';
import { PracticeSettings } from '../../types';

export function PracticeSettingsScreen(): React.JSX.Element {
    const { standards, loading: standardsLoading } = useStandards();
    console.log("🚀 ~ PracticeSettingsScreen ~ standards:", standards)

    const [selectedStandard, setSelectedStandard] = useState<string | null>(null);
    const [selectedSession, setSelectedSession] = useState<string | null>('1');

    const [settingsId, setSettingsId] = useState<string | null>(null);
    const [allowMixTest, setAllowMixTest] = useState(true);
    const [allowChapterTest, setAllowChapterTest] = useState(true);
    const [questionCounts, setQuestionCounts] = useState<number[]>([10, 25, 50, 100]);
    const [newCount, setNewCount] = useState('');

    const [loadingSettings, setLoadingSettings] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!selectedStandard || !selectedSession) return;

        const fetchSettings = async () => {
            setLoadingSettings(true);
            try {
                const snap = await firestore()
                    .collection(COLLECTIONS.PRACTICE_SETTINGS)
                    .where('standard', '==', selectedStandard)
                    .where('session', '==', selectedSession)
                    .limit(1)
                    .get();

                if (!snap.empty && snap.docs[0]) {
                    const doc = snap.docs[0];
                    const data = doc.data() as PracticeSettings;
                    setSettingsId(doc.id);
                    setAllowMixTest(data.allowMixTest ?? true);
                    setAllowChapterTest(data.allowChapterTest ?? true);
                    setQuestionCounts(data.questionCounts ?? [10, 25, 50, 100]);
                } else {
                    // Defaults for a new config
                    setSettingsId(null);
                    setAllowMixTest(true);
                    setAllowChapterTest(true);
                    setQuestionCounts([10, 25, 50, 100]);
                }
            } catch (err) {
                console.error(err);
                Alert.alert('Error', 'Failed to fetch settings');
            } finally {
                setLoadingSettings(false);
            }
        };

        fetchSettings();
    }, [selectedStandard, selectedSession]);

    const handleAddCount = () => {
        const val = parseInt(newCount.trim(), 10);
        if (isNaN(val) || val <= 0) {
            Alert.alert('Invalid Count', 'Please enter a valid positive number');
            return;
        }
        if (questionCounts.includes(val)) {
            Alert.alert('Duplicate', 'This count already exists');
            return;
        }
        const updated = [...questionCounts, val].sort((a, b) => a - b);
        setQuestionCounts(updated);
        setNewCount('');
    };

    const handleRemoveCount = (countToRemove: number) => {
        setQuestionCounts(prev => prev.filter(c => c !== countToRemove));
    };

    const handleSave = async () => {
        if (!selectedStandard || !selectedSession) {
            Alert.alert('Validation Error', 'Please select standard and session');
            return;
        }

        setSaving(true);
        try {
            const dataToSave = {
                standard: selectedStandard,
                session: selectedSession,
                allowMixTest,
                allowChapterTest,
                questionCounts,
                updatedAt: firestore.FieldValue.serverTimestamp(),
            };

            if (settingsId) {
                await firestore().collection(COLLECTIONS.PRACTICE_SETTINGS).doc(settingsId).update(dataToSave);
            } else {
                const newDoc = firestore().collection(COLLECTIONS.PRACTICE_SETTINGS).doc();
                await newDoc.set({
                    ...dataToSave,
                    id: newDoc.id,
                    createdAt: firestore.FieldValue.serverTimestamp(),
                });
                setSettingsId(newDoc.id);
            }
            Alert.alert('Success', 'MCQ settings saved successfully');
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const renderToggle = (label: string, value: boolean, onToggle: (val: boolean) => void, desc: string) => (
        <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
                <Text style={styles.toggleLabel}>{label}</Text>
                <Text style={styles.toggleDesc}>{desc}</Text>
            </View>
            <Switch
                value={value}
                onValueChange={onToggle}
                trackColor={{ false: adminColors.border, true: adminColors.primary }}
                thumbColor={adminColors.surface}
            />
        </View>
    );

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.pageTitle}>⚙️ Practice MCQ Settings</Text>

            <View style={styles.selectors}>
                <View style={styles.pickerContainer}>
                    <Text style={styles.pickerLabel}>Standard <Text style={styles.required}>*</Text></Text>
                    {standardsLoading ? (
                        <ActivityIndicator size="small" color={adminColors.primary} style={{ padding: spacing.md }} />
                    ) : (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                            {standards.map((s) => (
                                <TouchableOpacity
                                    key={s.id}
                                    style={[styles.chipSelect, selectedStandard === s.id && styles.chipSelectActive]}
                                    onPress={() => setSelectedStandard(s.id)}
                                >
                                    <Text style={[styles.chipSelectText, selectedStandard === s.id && styles.chipSelectTextActive]}>
                                        {s.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}
                </View>

                <View style={styles.pickerContainer}>
                    <Text style={styles.pickerLabel}>Session <Text style={styles.required}>*</Text></Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                        {['1', '2'].map((s) => (
                            <TouchableOpacity
                                key={s}
                                style={[styles.chipSelect, selectedSession === s && styles.chipSelectActive]}
                                onPress={() => setSelectedSession(s)}
                            >
                                <Text style={[styles.chipSelectText, selectedSession === s && styles.chipSelectTextActive]}>
                                    સત્ર {s}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </View>

            {selectedStandard && selectedSession ? (
                loadingSettings ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color={adminColors.primary} />
                        <Text style={styles.loadingText}>Fetching settings...</Text>
                    </View>
                ) : (
                    <View style={styles.settingsSection}>
                        <Card style={styles.card}>
                            <Text style={styles.cardTitle}>Test Modes</Text>
                            {renderToggle(
                                'Allow Mix Test',
                                allowMixTest,
                                setAllowMixTest,
                                'Enable random questions from across all chapters in the subject'
                            )}
                            <View style={styles.divider} />
                            {renderToggle(
                                'Allow Chapter Test',
                                allowChapterTest,
                                setAllowChapterTest,
                                'Enable MCQs explicitly grouped by chapters'
                            )}
                        </Card>

                        <Card style={styles.card}>
                            <Text style={styles.cardTitle}>Question Count Options</Text>
                            <Text style={styles.cardSub}>Control what dropdown values users see when starting a test.</Text>

                            <View style={styles.chipsContainer}>
                                {questionCounts.map((count) => (
                                    <View key={count} style={styles.chip}>
                                        <Text style={styles.chipText}>{count} Questions</Text>
                                        <TouchableOpacity onPress={() => handleRemoveCount(count)} style={styles.chipRemove}>
                                            <Text style={styles.chipRemoveText}>✖</Text>
                                        </TouchableOpacity>
                                    </View>
                                ))}
                                {questionCounts.length === 0 && (
                                    <Text style={styles.emptyChips}>No options added.</Text>
                                )}
                            </View>

                            <View style={styles.addCountRow}>
                                <TextInput
                                    label="Question Count"
                                    placeholder="e.g. 15"
                                    value={newCount}
                                    onChangeText={setNewCount}
                                    keyboardType="number-pad"
                                    style={styles.countInput}
                                />
                                <Button title="Add" onPress={handleAddCount} style={styles.addBtn} />
                            </View>
                        </Card>

                        <Button
                            title="Save Settings"
                            onPress={handleSave}
                            loading={saving}
                            style={styles.saveBtn}
                        />
                    </View>
                )
            ) : (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Select Standard and Session to view settings</Text>
                </View>
            )}

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: adminColors.background,
    },
    content: {
        padding: spacing.xl,
        paddingBottom: 100,
    },
    pageTitle: {
        fontSize: typography.size.xxl,
        fontWeight: typography.weight.bold,
        color: adminColors.textPrimary,
        marginBottom: spacing.xl,
    },
    selectors: {
        flexDirection: 'row',
        gap: spacing.md,
        marginBottom: spacing.xl,
        zIndex: 10, // For picker dropdowns
    },
    pickerContainer: {
        flex: 1,
    },
    pickerLabel: {
        fontSize: typography.size.sm,
        fontWeight: typography.weight.semibold,
        color: adminColors.textSecondary,
        marginBottom: spacing.xs,
    },
    required: {
        color: adminColors.error,
    },
    pickerWrapper: {
        backgroundColor: adminColors.surface,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: adminColors.border,
    },
    center: {
        alignItems: 'center',
        padding: spacing.xxl,
    },
    loadingText: {
        marginTop: spacing.md,
        color: adminColors.textSecondary,
    },
    emptyContainer: {
        backgroundColor: adminColors.surface,
        padding: spacing.xxl,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: typography.size.md,
        color: adminColors.textMuted,
    },
    settingsSection: {
        gap: spacing.lg,
    },
    card: {
        padding: spacing.xl,
    },
    cardTitle: {
        fontSize: typography.size.lg,
        fontWeight: typography.weight.bold,
        color: adminColors.textPrimary,
        marginBottom: spacing.md,
    },
    cardSub: {
        fontSize: typography.size.sm,
        color: adminColors.textSecondary,
        marginBottom: spacing.lg,
    },
    divider: {
        height: 1,
        backgroundColor: adminColors.border,
        marginVertical: spacing.md,
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
        marginBottom: spacing.lg,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: adminColors.primaryLight + '30',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: spacing.xl,
        borderWidth: 1,
        borderColor: adminColors.primary,
    },
    chipText: {
        fontSize: typography.size.sm,
        fontWeight: typography.weight.semibold,
        color: adminColors.primaryDark,
        marginRight: spacing.md,
    },
    chipRemove: {
        backgroundColor: adminColors.primary + '20',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    chipRemoveText: {
        fontSize: 10,
        color: adminColors.primaryDark,
        fontWeight: 'bold',
    },
    emptyChips: {
        color: adminColors.textMuted,
        fontStyle: 'italic',
    },
    addCountRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.md,
    },
    countInput: {
        flex: 1,
    },
    addBtn: {
        paddingHorizontal: spacing.xl,
    },
    saveBtn: {
        marginTop: spacing.md,
    },
    chipRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        paddingBottom: spacing.sm,
    },
    chipSelect: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        backgroundColor: adminColors.surface,
        borderWidth: 1,
        borderColor: adminColors.border,
    },
    chipSelectActive: {
        backgroundColor: adminColors.primary,
        borderColor: adminColors.primary,
    },
    chipSelectText: {
        fontSize: typography.size.sm,
        color: adminColors.textSecondary,
        fontWeight: typography.weight.medium,
    },
    chipSelectTextActive: {
        color: adminColors.surface,
        fontWeight: typography.weight.bold,
    }
});
