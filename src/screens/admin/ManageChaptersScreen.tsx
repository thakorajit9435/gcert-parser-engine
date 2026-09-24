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
    TextInput,
    Modal,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { adminColors, typography, spacing, borderRadius } from '../../theme';
import { COLLECTIONS } from '../../constants';
import { Chapter } from '../../types';

/**
 * Recalculates all derived page fields when startPage is changed.
 * Mirrors the backend logic in admin_router.py
 */
function recalculatePageFields(startPage: number, endPage: number, pdfPageOffset: number) {
    const bookStartPage = Math.max(1, startPage - pdfPageOffset);
    const initialPage = Math.max(0, startPage - 1);
    return {
        startPage,
        start_page: startPage,
        endPage,
        end_page: endPage,
        bookStartPage,
        book_start_page: bookStartPage,
        initialPage,
        initial_page: initialPage,
        pageIndex: initialPage,
        page_index: initialPage,
        pageNumber: startPage,
        page_number: startPage,
        pageNo: startPage,
        page_no: startPage,
        page: startPage,
    };
}

interface PageEditState {
    [chapterId: string]: {
        startPage: string;
        endPage: string;
    };
}

export function ManageChaptersScreen({ route, navigation }: { route: any; navigation: any }): React.JSX.Element {
    const subjectId = route?.params?.subjectId ?? '';
    const subjectName = route?.params?.subjectName ?? 'Subject';

    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Start page editing state
    const [editingPages, setEditingPages] = useState(false);
    const [pageEdits, setPageEdits] = useState<PageEditState>({});
    const [savingPages, setSavingPages] = useState(false);
    const [editModalChapter, setEditModalChapter] = useState<Chapter | null>(null);

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

            // Sort chapters by startPage ascending, fallback to order
            data.sort((a, b) => {
                const pageA = a.startPage ?? (a as any).start_page;
                const pageB = b.startPage ?? (b as any).start_page;
                if (pageA !== undefined && pageB !== undefined && pageA !== pageB) {
                    return pageA - pageB;
                }
                if (pageA !== undefined && pageB === undefined) {
                    return -1;
                }
                if (pageA === undefined && pageB !== undefined) {
                    return 1;
                }
                return (Number(a.order ?? (a as any).chapterNumber) || 999) - (Number(b.order ?? (b as any).chapterNumber) || 999);
            });

            setChapters(data);

            // Initialize page edits with current values
            const initialEdits: PageEditState = {};
            data.forEach((ch) => {
                initialEdits[ch.id] = {
                    startPage: String(ch.startPage ?? ''),
                    endPage: String(ch.endPage ?? ''),
                };
            });
            setPageEdits(initialEdits);
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

    // ── Start Page Editing ─────────────────────────────────────

    const updatePageEdit = useCallback((chapterId: string, field: 'startPage' | 'endPage', value: string) => {
        // Allow only numeric input
        const numericValue = value.replace(/[^0-9]/g, '');
        setPageEdits((prev) => ({
            ...prev,
            [chapterId]: {
                startPage: prev[chapterId]?.startPage ?? '',
                endPage: prev[chapterId]?.endPage ?? '',
                [field]: numericValue,
            },
        }));
    }, []);

    const hasPageChanges = useCallback((): boolean => {
        return chapters.some((ch) => {
            const edit = pageEdits[ch.id];
            if (!edit) { return false; }
            const origStart = String(ch.startPage ?? '');
            const origEnd = String(ch.endPage ?? '');
            return edit.startPage !== origStart || edit.endPage !== origEnd;
        });
    }, [chapters, pageEdits]);

    const getChangedChapters = useCallback((): Array<{ chapter: Chapter; newStart: number; newEnd: number }> => {
        const changed: Array<{ chapter: Chapter; newStart: number; newEnd: number }> = [];
        chapters.forEach((ch) => {
            const edit = pageEdits[ch.id];
            if (!edit) { return; }
            const origStart = String(ch.startPage ?? '');
            const origEnd = String(ch.endPage ?? '');
            if (edit.startPage !== origStart || edit.endPage !== origEnd) {
                const newStart = parseInt(edit.startPage, 10) || 1;
                const newEnd = parseInt(edit.endPage, 10) || newStart + 14;
                changed.push({ chapter: ch, newStart, newEnd: Math.max(newStart, newEnd) });
            }
        });
        return changed;
    }, [chapters, pageEdits]);

    const saveAllStartPages = useCallback(async () => {
        const changed = getChangedChapters();
        if (changed.length === 0) {
            Alert.alert('No Changes', 'No start page changes to save.');
            return;
        }

        Alert.alert(
            'Save Start Pages',
            `Update start pages for ${changed.length} chapter(s)?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Save All',
                    onPress: async () => {
                        setSavingPages(true);
                        try {
                            const batch = firestore().batch();
                            changed.forEach(({ chapter, newStart, newEnd }) => {
                                const pdfPageOffset = (chapter as any).pdfPageOffset ?? (chapter as any).pdf_page_offset ?? 0;
                                const pageFields = recalculatePageFields(newStart, newEnd, pdfPageOffset);
                                const ref = firestore().collection(COLLECTIONS.CHAPTERS).doc(chapter.id);
                                batch.update(ref, {
                                    ...pageFields,
                                    updatedAt: firestore.FieldValue.serverTimestamp(),
                                });
                            });
                            await batch.commit();
                            Alert.alert('✅ Success', `Updated start pages for ${changed.length} chapter(s).`);
                            setEditingPages(false);
                            fetchChapters();
                        } catch (err) {
                            Alert.alert('Error', (err as Error).message);
                        } finally {
                            setSavingPages(false);
                        }
                    },
                },
            ],
        );
    }, [getChangedChapters, fetchChapters]);

    const saveSingleStartPage = useCallback(async (chapter: Chapter) => {
        const edit = pageEdits[chapter.id];
        if (!edit) { return; }

        const newStart = parseInt(edit.startPage, 10);
        const newEnd = parseInt(edit.endPage, 10);

        if (!newStart || newStart < 1) {
            Alert.alert('Invalid', 'Start page must be a positive number.');
            return;
        }

        const finalEnd = newEnd && newEnd >= newStart ? newEnd : newStart + 14;
        const pdfPageOffset = (chapter as any).pdfPageOffset ?? (chapter as any).pdf_page_offset ?? 0;
        const pageFields = recalculatePageFields(newStart, finalEnd, pdfPageOffset);

        try {
            await firestore()
                .collection(COLLECTIONS.CHAPTERS)
                .doc(chapter.id)
                .update({
                    ...pageFields,
                    updatedAt: firestore.FieldValue.serverTimestamp(),
                });
            Alert.alert('✅ Saved', `Start page updated to ${newStart}`);
            setEditModalChapter(null);
            fetchChapters();
        } catch (err) {
            Alert.alert('Error', (err as Error).message);
        }
    }, [pageEdits, fetchChapters]);

    // ── Render ──────────────────────────────────────────────────

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
                <View style={styles.headerRight}>
                    {/* Start Page Edit Toggle Button */}
                    <TouchableOpacity
                        style={[
                            styles.pageEditToggle,
                            editingPages && styles.pageEditToggleActive,
                        ]}
                        onPress={() => {
                            if (editingPages && hasPageChanges()) {
                                Alert.alert(
                                    'Unsaved Changes',
                                    'You have unsaved start page changes. Save or discard?',
                                    [
                                        { text: 'Keep Editing', style: 'cancel' },
                                        {
                                            text: 'Discard',
                                            style: 'destructive',
                                            onPress: () => {
                                                setEditingPages(false);
                                                // Reset to original values
                                                const resetEdits: PageEditState = {};
                                                chapters.forEach((ch) => {
                                                    resetEdits[ch.id] = {
                                                        startPage: String(ch.startPage ?? ''),
                                                        endPage: String(ch.endPage ?? ''),
                                                    };
                                                });
                                                setPageEdits(resetEdits);
                                            },
                                        },
                                    ],
                                );
                            } else {
                                setEditingPages(!editingPages);
                            }
                        }}
                    >
                        <Text style={[styles.pageEditToggleText, editingPages && styles.pageEditToggleTextActive]}>
                            {editingPages ? '✕ Cancel' : '📄 Edit Pages'}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.addButton} onPress={openAddScreen}>
                        <Text style={styles.addButtonText}>+ Add</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Save All Bar — visible when editing pages and there are changes */}
            {editingPages && (
                <View style={styles.saveBar}>
                    <Text style={styles.saveBarText}>
                        {hasPageChanges()
                            ? `📝 ${getChangedChapters().length} chapter(s) modified`
                            : '📄 Tap page numbers to edit'}
                    </Text>
                    {hasPageChanges() && (
                        <TouchableOpacity
                            style={styles.saveAllBtn}
                            onPress={saveAllStartPages}
                            disabled={savingPages}
                        >
                            {savingPages ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={styles.saveAllBtnText}>💾 Save All</Text>
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            )}

            <FlatList
                data={chapters}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={adminColors.primary} />
                }
                renderItem={({ item, index }) => {
                    const edit = pageEdits[item.id];
                    const isModified = edit && (
                        edit.startPage !== String(item.startPage ?? '') ||
                        edit.endPage !== String(item.endPage ?? '')
                    );

                    return (
                        <View style={[styles.chapterCard, isModified && styles.chapterCardModified]}>
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
                                        {/* Start Page Badge — always visible */}
                                        <TouchableOpacity
                                            style={[styles.pageTag, isModified && styles.pageTagModified]}
                                            onPress={(e) => {
                                                e.stopPropagation?.();
                                                if (!editingPages) {
                                                    setEditingPages(true);
                                                }
                                                setEditModalChapter(item);
                                            }}
                                        >
                                            <Text style={[styles.pageTagText, isModified && styles.pageTagTextModified]}>
                                                📖 Page: {edit?.startPage || item.startPage || '—'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </TouchableOpacity>

                            {/* Inline Start Page Editor — visible when editing mode is ON */}
                            {editingPages && (
                                <View style={styles.pageEditRow}>
                                    <View style={styles.pageEditField}>
                                        <Text style={styles.pageEditLabel}>Start Page</Text>
                                        <TextInput
                                            style={[styles.pageEditInput, isModified && styles.pageEditInputModified]}
                                            value={edit?.startPage ?? ''}
                                            onChangeText={(v) => updatePageEdit(item.id, 'startPage', v)}
                                            keyboardType="number-pad"
                                            placeholder="1"
                                            placeholderTextColor={adminColors.textMuted}
                                            selectTextOnFocus
                                        />
                                    </View>
                                    <View style={styles.pageEditField}>
                                        <Text style={styles.pageEditLabel}>End Page</Text>
                                        <TextInput
                                            style={[styles.pageEditInput, isModified && styles.pageEditInputModified]}
                                            value={edit?.endPage ?? ''}
                                            onChangeText={(v) => updatePageEdit(item.id, 'endPage', v)}
                                            keyboardType="number-pad"
                                            placeholder="—"
                                            placeholderTextColor={adminColors.textMuted}
                                            selectTextOnFocus
                                        />
                                    </View>
                                    {isModified && (
                                        <TouchableOpacity
                                            style={styles.saveSingleBtn}
                                            onPress={() => saveSingleStartPage(item)}
                                        >
                                            <Text style={styles.saveSingleBtnText}>💾</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}

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
                    );
                }}
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

            {/* Quick Edit Modal — for tapping on page badge */}
            <Modal
                visible={!!editModalChapter}
                transparent
                animationType="fade"
                onRequestClose={() => setEditModalChapter(null)}
            >
                <KeyboardAvoidingView
                    style={styles.modalOverlay}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <View style={styles.modalCard}>
                        {editModalChapter && (
                            <>
                                <Text style={styles.modalTitle}>📄 Edit Start Page</Text>
                                <Text style={styles.modalSubtitle}>
                                    {editModalChapter.titleGu || editModalChapter.title}
                                </Text>

                                <View style={styles.modalFields}>
                                    <View style={styles.modalField}>
                                        <Text style={styles.modalFieldLabel}>Start Page</Text>
                                        <TextInput
                                            style={styles.modalInput}
                                            value={pageEdits[editModalChapter.id]?.startPage ?? ''}
                                            onChangeText={(v) => updatePageEdit(editModalChapter.id, 'startPage', v)}
                                            keyboardType="number-pad"
                                            placeholder="e.g. 18"
                                            placeholderTextColor={adminColors.textMuted}
                                            autoFocus
                                            selectTextOnFocus
                                        />
                                    </View>
                                    <View style={styles.modalField}>
                                        <Text style={styles.modalFieldLabel}>End Page</Text>
                                        <TextInput
                                            style={styles.modalInput}
                                            value={pageEdits[editModalChapter.id]?.endPage ?? ''}
                                            onChangeText={(v) => updatePageEdit(editModalChapter.id, 'endPage', v)}
                                            keyboardType="number-pad"
                                            placeholder="e.g. 27"
                                            placeholderTextColor={adminColors.textMuted}
                                            selectTextOnFocus
                                        />
                                    </View>
                                </View>

                                <View style={styles.modalInfo}>
                                    <Text style={styles.modalInfoText}>
                                        📌 bookStartPage, initialPage, pageNumber automatically recalculated
                                    </Text>
                                </View>

                                <View style={styles.modalActions}>
                                    <TouchableOpacity
                                        style={styles.modalCancelBtn}
                                        onPress={() => setEditModalChapter(null)}
                                    >
                                        <Text style={styles.modalCancelBtnText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.modalSaveBtn}
                                        onPress={() => saveSingleStartPage(editModalChapter)}
                                    >
                                        <Text style={styles.modalSaveBtnText}>💾 Save</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>
                </KeyboardAvoidingView>
            </Modal>
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
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
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

    // ── Page Edit Toggle Button ────────────────────────────────
    pageEditToggle: {
        backgroundColor: adminColors.info + '20',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: adminColors.info + '40',
    },
    pageEditToggleActive: {
        backgroundColor: adminColors.error + '20',
        borderColor: adminColors.error + '40',
    },
    pageEditToggleText: {
        fontSize: typography.size.sm,
        fontWeight: typography.weight.semibold,
        color: adminColors.info,
    },
    pageEditToggleTextActive: {
        color: adminColors.error,
    },

    // ── Save Bar ───────────────────────────────────────────────
    saveBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: adminColors.surfaceElevated,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: adminColors.border,
    },
    saveBarText: {
        fontSize: typography.size.sm,
        color: adminColors.textSecondary,
        flex: 1,
    },
    saveAllBtn: {
        backgroundColor: adminColors.success,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        minWidth: 100,
        alignItems: 'center',
    },
    saveAllBtnText: {
        fontSize: typography.size.sm,
        fontWeight: typography.weight.bold,
        color: '#FFFFFF',
    },

    // ── List ───────────────────────────────────────────────────
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
    chapterCardModified: {
        borderColor: adminColors.warning,
        borderWidth: 1.5,
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
        flexWrap: 'wrap',
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

    // ── Page Badge ─────────────────────────────────────────────
    pageTag: {
        backgroundColor: adminColors.accentOrange + '20',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xxs,
        borderRadius: borderRadius.xs,
        borderWidth: 1,
        borderColor: adminColors.accentOrange + '40',
    },
    pageTagModified: {
        backgroundColor: adminColors.warning + '30',
        borderColor: adminColors.warning,
    },
    pageTagText: {
        fontSize: typography.size.xs,
        color: adminColors.accentOrange,
        fontWeight: typography.weight.semibold,
    },
    pageTagTextModified: {
        color: adminColors.warning,
    },

    // ── Inline Page Editor Row ─────────────────────────────────
    pageEditRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: adminColors.surfaceElevated,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.md,
        gap: spacing.md,
    },
    pageEditField: {
        flex: 1,
    },
    pageEditLabel: {
        fontSize: typography.size.xs,
        color: adminColors.textMuted,
        marginBottom: spacing.xxs,
    },
    pageEditInput: {
        backgroundColor: adminColors.surface,
        borderWidth: 1,
        borderColor: adminColors.border,
        borderRadius: borderRadius.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        fontSize: typography.size.md,
        fontWeight: typography.weight.semibold,
        color: adminColors.textPrimary,
        textAlign: 'center',
    },
    pageEditInputModified: {
        borderColor: adminColors.warning,
        backgroundColor: adminColors.warning + '10',
    },
    saveSingleBtn: {
        backgroundColor: adminColors.success,
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'flex-end',
    },
    saveSingleBtnText: {
        fontSize: 18,
    },

    // ── Chapter Actions ────────────────────────────────────────
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

    // ── Empty State ────────────────────────────────────────────
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

    // ── FAB ────────────────────────────────────────────────────
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

    // ── Quick Edit Modal ───────────────────────────────────────
    modalOverlay: {
        flex: 1,
        backgroundColor: adminColors.overlay,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    modalCard: {
        backgroundColor: adminColors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        width: '100%',
        maxWidth: 400,
        borderWidth: 1,
        borderColor: adminColors.border,
    },
    modalTitle: {
        fontSize: typography.size.xl,
        fontWeight: typography.weight.bold,
        color: adminColors.textPrimary,
        marginBottom: spacing.xs,
    },
    modalSubtitle: {
        fontSize: typography.size.md,
        color: adminColors.textSecondary,
        marginBottom: spacing.lg,
    },
    modalFields: {
        flexDirection: 'row',
        gap: spacing.lg,
        marginBottom: spacing.lg,
    },
    modalField: {
        flex: 1,
    },
    modalFieldLabel: {
        fontSize: typography.size.sm,
        color: adminColors.textMuted,
        marginBottom: spacing.xs,
        fontWeight: typography.weight.semibold,
    },
    modalInput: {
        backgroundColor: adminColors.surfaceElevated,
        borderWidth: 1,
        borderColor: adminColors.borderLight,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        fontSize: typography.size.xl,
        fontWeight: typography.weight.bold,
        color: adminColors.textPrimary,
        textAlign: 'center',
    },
    modalInfo: {
        backgroundColor: adminColors.info + '15',
        borderRadius: borderRadius.sm,
        padding: spacing.md,
        marginBottom: spacing.lg,
    },
    modalInfoText: {
        fontSize: typography.size.xs,
        color: adminColors.info,
    },
    modalActions: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    modalCancelBtn: {
        flex: 1,
        backgroundColor: adminColors.surfaceElevated,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: adminColors.border,
    },
    modalCancelBtnText: {
        fontSize: typography.size.md,
        color: adminColors.textSecondary,
        fontWeight: typography.weight.semibold,
    },
    modalSaveBtn: {
        flex: 1,
        backgroundColor: adminColors.success,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: 'center',
    },
    modalSaveBtnText: {
        fontSize: typography.size.md,
        fontWeight: typography.weight.bold,
        color: '#FFFFFF',
    },
});
