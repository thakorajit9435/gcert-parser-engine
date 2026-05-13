import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { adminColors, typography, spacing, borderRadius, shadows } from '../../theme';
import { useStandards } from '../../hooks/useStandards';
import { useSubjects } from '../../hooks/useSubjects';
import { MCQ } from '../../types';
import firestore from '@react-native-firebase/firestore';
import { COLLECTIONS } from '../../constants';
import { Button } from '../../components/common';

export function ManageMCQsScreen({ navigation }: { navigation: any }): React.JSX.Element {
    const { standards } = useStandards();

    const [selectedStandard, setSelectedStandard] = useState<string | null>(null);
    const [selectedSession, setSelectedSession] = useState<string | null>('1');
    const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

    const { subjects, loading: subjectsLoading } = useSubjects(selectedStandard || undefined, selectedSession || undefined);

    const [mcqs, setMcqs] = useState<MCQ[]>([]);
    const [loadingMcqs, setLoadingMcqs] = useState(false);

    useEffect(() => {
        if (!selectedStandard || !selectedSession || !selectedSubject) {
            setMcqs([]);
            return;
        }

        setLoadingMcqs(true);

        const unsubscribe = firestore()
            .collection(COLLECTIONS.MCQS)
            .where('subjectId', '==', selectedSubject)
            .where('isDeleted', '==', false)
            .onSnapshot(
                (snap) => {
                    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MCQ[];
                    setMcqs(data);
                    setLoadingMcqs(false);
                },
                (err) => {
                    console.error('Error fetching MCQs', err);
                    setLoadingMcqs(false);
                }
            );

        return () => unsubscribe();
    }, [selectedStandard, selectedSession, selectedSubject]);

    const handleDelete = (mcqId: string) => {
        Alert.alert('Delete MCQ', 'Are you sure you want to delete this question?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await firestore().collection(COLLECTIONS.MCQS).doc(mcqId).update({
                            isDeleted: true,
                            updatedAt: firestore.FieldValue.serverTimestamp(),
                        });
                    } catch (err) {
                        Alert.alert('Error', 'Failed to delete MCQ');
                    }
                }
            }
        ]);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.pageTitle}>Dynamic MCQs</Text>
                {selectedSubject && (
                    <Button
                        title="+ Add MCQ"
                        onPress={() => navigation.navigate('AddEditMCQ', {
                            subjectId: selectedSubject,
                            standardId: selectedStandard,
                            sessionId: selectedSession,
                        })}
                        style={styles.addBtn}
                        textStyle={styles.addBtnText}
                    />
                )}
            </View>

            <View style={styles.filtersWrapper}>
                <View style={styles.filterGroup}>
                    <Text style={styles.filterLabel}>Standard</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                        {standards.map((s) => (
                            <TouchableOpacity
                                key={s.id}
                                style={[styles.chipSelect, selectedStandard === s.id && styles.chipSelectActive]}
                                onPress={() => setSelectedStandard(s.id)}
                            >
                                <Text style={[styles.chipSelectText, selectedStandard === s.id && styles.chipSelectTextActive]}>
                                    {s.label} {s.labelGu ? `(${s.labelGu})` : ''}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <View style={styles.filterGroup}>
                    <Text style={styles.filterLabel}>Session</Text>
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

                <View style={styles.filterGroup}>
                    <Text style={styles.filterLabel}>Subject</Text>
                    {subjectsLoading ? (
                        <ActivityIndicator style={{ alignSelf: 'flex-start' }} />
                    ) : subjects.length > 0 ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                            {subjects.map((s) => (
                                <TouchableOpacity
                                    key={s.id}
                                    style={[styles.chipSelect, selectedSubject === s.id && styles.chipSelectActive]}
                                    onPress={() => setSelectedSubject(s.id)}
                                >
                                    <Text style={[styles.chipSelectText, selectedSubject === s.id && styles.chipSelectTextActive]}>
                                        {s.name} {s.nameGu ? `(${s.nameGu})` : ''}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    ) : (
                        <Text style={styles.emptyFilterText}>No subjects available</Text>
                    )}
                </View>
            </View>

            {loadingMcqs ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={adminColors.primary} />
                </View>
            ) : (!selectedStandard || !selectedSession || !selectedSubject) ? (
                <View style={styles.center}>
                    <Text style={styles.emptyText}>Select Standard, Session, and Subject to manage MCQs.</Text>
                </View>
            ) : mcqs.length === 0 ? (
                <View style={styles.center}>
                    <Text style={styles.emptyIcon}>📝</Text>
                    <Text style={styles.emptyText}>No MCQs found for this subject.</Text>
                </View>
            ) : (
                <FlatList
                    data={mcqs}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    initialNumToRender={10}
                    maxToRenderPerBatch={8}
                    windowSize={5}
                    renderItem={({ item }) => (
                        <View style={styles.mcqCard}>
                            <View style={styles.mcqHeader}>
                                <Text style={styles.mcqQuestion} numberOfLines={2}>{item.question}</Text>
                                <View style={styles.badges}>
                                    <Text style={[styles.badge, item.difficulty === 'hard' ? styles.badgeHard : item.difficulty === 'medium' ? styles.badgeMedium : styles.badgeEasy]}>
                                        {item.difficulty}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.mcqActions}>
                                <TouchableOpacity
                                    style={styles.actionBtn}
                                    onPress={() => navigation.navigate('AddEditMCQ', {
                                        subjectId: selectedSubject,
                                        chapterId: item.chapterId,
                                        mcqId: item.id,
                                        standardId: selectedStandard,
                                        sessionId: selectedSession,
                                    })}
                                >
                                    <Text style={styles.actionIcon}>✏️</Text>
                                    <Text style={styles.actionText}>Edit</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.actionBtn, styles.actionDelete]}
                                    onPress={() => handleDelete(item.id)}
                                >
                                    <Text style={styles.actionIcon}>🗑️</Text>
                                    <Text style={[styles.actionText, styles.actionDeleteText]}>Delete</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                />
            )}
            {selectedSubject && (
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => navigation.navigate('AddEditMCQ', {
                        subjectId: selectedSubject,
                        standardId: selectedStandard,
                        sessionId: selectedSession,
                    })}
                >
                    <Text style={styles.fabIcon}>+</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: adminColors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.xl,
        paddingBottom: spacing.lg,
    },
    pageTitle: {
        fontSize: typography.size.xxl,
        fontWeight: typography.weight.bold,
        color: adminColors.textPrimary,
    },
    addBtn: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
    },
    addBtnText: {
        fontSize: typography.size.sm,
    },
    filtersWrapper: {
        paddingHorizontal: spacing.xl,
        marginBottom: spacing.md,
    },
    filterGroup: {
        marginBottom: spacing.md,
    },
    filterLabel: {
        fontSize: typography.size.xs,
        fontWeight: typography.weight.semibold,
        color: adminColors.textSecondary,
        textTransform: 'uppercase',
        marginBottom: spacing.xs,
    },
    emptyFilterText: {
        fontSize: typography.size.sm,
        color: adminColors.textMuted,
        fontStyle: 'italic',
        paddingVertical: spacing.sm,
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
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: spacing.md,
    },
    emptyText: {
        fontSize: typography.size.md,
        color: adminColors.textSecondary,
        textAlign: 'center',
    },
    listContent: {
        padding: spacing.xl,
        gap: spacing.md,
    },
    mcqCard: {
        backgroundColor: adminColors.surface,
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        ...shadows.sm,
        borderWidth: 1,
        borderColor: adminColors.border,
    },
    mcqHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.md,
    },
    mcqQuestion: {
        flex: 1,
        fontSize: typography.size.md,
        fontWeight: typography.weight.semibold,
        color: adminColors.textPrimary,
        marginRight: spacing.md,
    },
    badges: {
        flexDirection: 'row',
    },
    badge: {
        fontSize: 10,
        fontWeight: typography.weight.bold,
        textTransform: 'uppercase',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        overflow: 'hidden',
    },
    badgeEasy: {
        backgroundColor: '#E8F5E9',
        color: '#2E7D32',
    },
    badgeMedium: {
        backgroundColor: '#FFF8E1',
        color: '#F57F17',
    },
    badgeHard: {
        backgroundColor: '#FFEBEE',
        color: '#C62828',
    },
    mcqActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: spacing.md,
        borderTopWidth: 1,
        borderTopColor: adminColors.border,
        paddingTop: spacing.md,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.sm,
        paddingHorizontal: spacing.md,
        backgroundColor: adminColors.background,
        borderRadius: borderRadius.sm,
    },
    actionDelete: {
        backgroundColor: '#FFEBEE',
    },
    actionIcon: {
        fontSize: 14,
        marginRight: spacing.xs,
    },
    actionText: {
        fontSize: typography.size.sm,
        fontWeight: typography.weight.medium,
        color: adminColors.textSecondary,
    },
    actionDeleteText: {
        color: '#C62828',
    },
    fab: {
        position: 'absolute',
        bottom: spacing.xl,
        right: spacing.xl,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: adminColors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...shadows.lg,
    },
    fabIcon: {
        fontSize: 24,
        color: adminColors.surface,
        fontWeight: typography.weight.bold,
    }
});
