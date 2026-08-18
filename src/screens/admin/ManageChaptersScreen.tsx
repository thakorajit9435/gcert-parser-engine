import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    Alert,
    ActivityIndicator,
    Switch,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { adminColors, typography, spacing, borderRadius } from '../../theme';
import { COLLECTIONS } from '../../constants';
import { Chapter } from '../../types';

export function ManageChaptersScreen({ route, navigation }: { route: any; navigation: any }): React.JSX.Element {
    const subjectId = route?.params?.subjectId ?? '';
    const subjectName = route?.params?.subjectName ?? 'Subject';

    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchChapters = useCallback(async () => {
        try {
            const snapshot = await firestore()
                .collection(COLLECTIONS.CHAPTERS)
                .where('subjectId', '==', subjectId)
                .where('isDeleted', '==', false)
                .orderBy('order', 'asc')
                .get();

            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Chapter[];

            setChapters(data);
        } catch (err) {
            Alert.alert('Error', (err as Error).message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [subjectId]);

    useEffect(() => {
        if (subjectId) {
            fetchChapters();
        }
    }, [fetchChapters, subjectId]);

    // Re-fetch when returning from add/edit screen
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            if (subjectId) {
                fetchChapters();
            }
        });
        return unsubscribe;
    }, [navigation, fetchChapters, subjectId]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchChapters();
    }, [fetchChapters]);

    const openAddScreen = useCallback(() => {
        navigation.navigate('AddEditChapter', { subjectId, subjectName });
    }, [navigation, subjectId, subjectName]);

    const openEditScreen = useCallback((chapter: Chapter) => {
        navigation.navigate('AddEditChapter', { subjectId, subjectName, chapter });
    }, [navigation, subjectId, subjectName]);

    const togglePremium = useCallback(async (chapter: Chapter) => {
        try {
            await firestore()
                .collection(COLLECTIONS.CHAPTERS)
                .doc(chapter.id)
                .update({
                    isPremium: !chapter.isPremium,
                    updatedAt: firestore.FieldValue.serverTimestamp(),
                });
            fetchChapters();
        } catch (err) {
            Alert.alert('Error', (err as Error).message);
        }
    }, [fetchChapters]);

    const handleDelete = useCallback((chapter: Chapter) => {
        Alert.alert(
            'Delete Chapter',
            `Delete "${chapter.title}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await firestore()
                                .collection(COLLECTIONS.CHAPTERS)
                                .doc(chapter.id)
                                .update({
                                    isDeleted: true,
                                    updatedAt: firestore.FieldValue.serverTimestamp(),
                                });
                            fetchChapters();
                        } catch (err) {
                            Alert.alert('Error', (err as Error).message);
                        }
                    },
                },
            ],
        );
    }, [fetchChapters]);

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={adminColors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Chapters</Text>
                    <Text style={styles.subtitle}>{subjectName}</Text>
                </View>
                <TouchableOpacity style={styles.addButton} onPress={openAddScreen}>
                    <Text style={styles.addButtonText}>+ Add</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={chapters}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={adminColors.primary} />
                }
                renderItem={({ item, index }) => (
                    <View style={styles.chapterCard}>
                        <TouchableOpacity
                            style={styles.chapterLeft}
                            activeOpacity={0.7}
                            onPress={() =>
                                navigation.navigate('ChapterCMSDashboard', {
                                    chapterId: item.id,
                                    chapterTitle: item.titleGu || item.title,
                                    subjectId: item.subjectId,
                                    standardId: item.standardId,
                                    standardNumber: parseInt(item.standardId, 10) || 1,
                                })
                            }
                        >
                            <View style={styles.chapterNum}>
                                <Text style={styles.chapterNumText}>{index + 1}</Text>
                            </View>
                            <View style={styles.chapterInfo}>
                                <Text style={styles.chapterTitle}>{item.title}</Text>
                                <Text style={styles.chapterTitleGu}>{item.titleGu}</Text>
                                <View style={styles.chapterTags}>
                                    {item.isPremium && (
                                        <View style={styles.premiumTag}>
                                            <Text style={styles.premiumTagText}>💎 Premium</Text>
                                        </View>
                                    )}
                                    {item.pdfUrl && (
                                        <View style={styles.pdfTag}>
                                            <Text style={styles.pdfTagText}>📄 PDF</Text>
                                        </View>
                                    )}
                                    {item.swadhyayPdfUrl && (
                                        <View style={styles.swadhyayTag}>
                                            <Text style={styles.swadhyayTagText}>📝 Swadhyay</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </TouchableOpacity>
                        <View style={styles.chapterActions}>
                            <View style={styles.premiumToggle}>
                                <Text style={styles.toggleLabel}>Premium</Text>
                                <Switch
                                    value={item.isPremium}
                                    onValueChange={() => togglePremium(item)}
                                    trackColor={{ false: adminColors.border, true: adminColors.primary + '60' }}
                                    thumbColor={item.isPremium ? adminColors.primary : adminColors.textMuted}
                                />
                            </View>
                            <View style={styles.actionRow}>
                                <TouchableOpacity style={styles.editBtn} onPress={() => openEditScreen(item)}>
                                    <Text style={styles.editBtnText}>Edit</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
                                    <Text style={styles.deleteBtnText}>Delete</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyIcon}>📖</Text>
                        <Text style={styles.emptyTitle}>No Chapters</Text>
                        <Text style={styles.emptyMsg}>Add chapters to this subject.</Text>
                    </View>
                }
            />
            {subjectId ? (
                <TouchableOpacity style={styles.fab} onPress={openAddScreen}>
                    <Text style={styles.fabIcon}>+</Text>
                </TouchableOpacity>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: adminColors.background,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: adminColors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.xl,
    },
    title: {
        fontSize: typography.size.xxl,
        fontWeight: typography.weight.bold,
        color: adminColors.textPrimary,
    },
    subtitle: {
        fontSize: typography.size.sm,
        color: adminColors.textMuted,
        marginTop: spacing.xxs,
    },
    addButton: {
        backgroundColor: adminColors.primary,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
    },
    addButtonText: {
        fontSize: typography.size.sm,
        fontWeight: typography.weight.bold,
        color: '#FFFFFF',
    },
    listContent: {
        padding: spacing.xl,
        paddingTop: 0,
    },
    chapterCard: {
        backgroundColor: adminColors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: adminColors.border,
    },
    chapterLeft: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: spacing.md,
    },
    chapterNum: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: adminColors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
        marginTop: spacing.xxs,
    },
    chapterNumText: {
        fontSize: typography.size.sm,
        fontWeight: typography.weight.bold,
        color: '#FFFFFF',
    },
    chapterInfo: {
        flex: 1,
    },
    chapterTitle: {
        fontSize: typography.size.md,
        fontWeight: typography.weight.semibold,
        color: adminColors.textPrimary,
    },
    chapterTitleGu: {
        fontSize: typography.size.sm,
        color: adminColors.textSecondary,
        marginTop: spacing.xxs,
    },
    chapterTags: {
        flexDirection: 'row',
        marginTop: spacing.sm,
        gap: spacing.sm,
    },
    premiumTag: {
        backgroundColor: adminColors.accentPink + '20',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xxs,
        borderRadius: borderRadius.xs,
    },
    premiumTagText: {
        fontSize: typography.size.xs,
        color: adminColors.accentPink,
        fontWeight: typography.weight.semibold,
    },
    pdfTag: {
        backgroundColor: adminColors.info + '20',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xxs,
        borderRadius: borderRadius.xs,
    },
    pdfTagText: {
        fontSize: typography.size.xs,
        color: adminColors.info,
        fontWeight: typography.weight.semibold,
    },
    swadhyayTag: {
        backgroundColor: '#E8F5E9',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xxs,
        borderRadius: borderRadius.xs,
    },
    swadhyayTagText: {
        fontSize: typography.size.xs,
        color: '#2E7D32',
        fontWeight: typography.weight.semibold,
    },
    chapterActions: {
        borderTopWidth: 1,
        borderTopColor: adminColors.border,
        paddingTop: spacing.md,
    },
    premiumToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
    },
    toggleLabel: {
        fontSize: typography.size.sm,
        color: adminColors.textSecondary,
    },
    actionRow: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    editBtn: {
        backgroundColor: adminColors.primary + '20',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.sm,
    },
    editBtnText: {
        fontSize: typography.size.sm,
        color: adminColors.primary,
        fontWeight: typography.weight.semibold,
    },
    deleteBtn: {
        backgroundColor: adminColors.error + '20',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.sm,
    },
    deleteBtnText: {
        fontSize: typography.size.sm,
        color: adminColors.error,
        fontWeight: typography.weight.semibold,
    },
    empty: {
        alignItems: 'center',
        paddingVertical: spacing.huge,
    },
    emptyIcon: {
        fontSize: 56,
        marginBottom: spacing.lg,
    },
    emptyTitle: {
        fontSize: typography.size.xl,
        fontWeight: typography.weight.semibold,
        color: adminColors.textPrimary,
    },
    emptyMsg: {
        fontSize: typography.size.md,
        color: adminColors.textMuted,
        marginTop: spacing.xs,
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
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    fabIcon: {
        fontSize: 24,
        color: '#FFFFFF',
        fontWeight: typography.weight.bold,
    },
});
