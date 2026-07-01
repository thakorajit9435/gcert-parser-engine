import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity, Alert,
    ActivityIndicator, Modal, TextInput, ScrollView,
} from 'react-native';
import { adminColors, typography, spacing, borderRadius, shadows } from '../../theme';
import { useStandards } from '../../hooks/useStandards';
import { LanguageItem } from '../../types';
import {
    getAllLanguageItems,
    createLanguageItem,
    updateLanguageItem,
    deleteLanguageItem,
} from '../../services/firebase/language.service';

type Language = 'gujarati' | 'hindi' | 'english';

const LANGUAGE_TABS: { key: Language; label: string }[] = [
    { key: 'gujarati', label: 'ગુજરાતી' },
    { key: 'hindi', label: 'હિન્દી' },
    { key: 'english', label: 'English' },
];

export function AdminLanguageSectionScreen(): React.JSX.Element {
    const { standards, loading: standardsLoading, isFallback } = useStandards();

    const [selectedStandard, setSelectedStandard] = useState<string>('');
    const [selectedLanguage, setSelectedLanguage] = useState<Language>('gujarati');
    const [items, setItems] = useState<LanguageItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState<LanguageItem | null>(null);

    // Form state
    const [formTitle, setFormTitle] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formContent, setFormContent] = useState('');
    const [formOrder, setFormOrder] = useState('0');
    const [formActive, setFormActive] = useState(true);
    const [formSelectedStandard, setFormSelectedStandard] = useState<string>('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (standards.length > 0 && !selectedStandard && standards[0]) {
            setSelectedStandard(String(standards[0].number));
        }
    }, [standards, selectedStandard]);

    const fetchItems = useCallback(async () => {
        if (!selectedStandard) return;
        setLoading(true);
        const result = await getAllLanguageItems(selectedStandard);
        if (result.success && result.data) {
            setItems(result.data.filter(i => i.language === selectedLanguage));
        }
        setLoading(false);
    }, [selectedStandard, selectedLanguage]);

    useEffect(() => { fetchItems(); }, [fetchItems]);

    const openAddModal = () => {
        setEditingItem(null);
        setFormTitle('');
        setFormDescription('');
        setFormContent('');
        setFormOrder(String(items.length));
        setFormActive(true);
        setFormSelectedStandard(selectedStandard);
        setModalVisible(true);
    };

    const openEditModal = (item: LanguageItem) => {
        setEditingItem(item);
        setFormTitle(item.title);
        setFormDescription(item.description);
        setFormContent(item.content || '');
        setFormOrder(String(item.order));
        setFormActive(item.isActive);
        setFormSelectedStandard(item.standard || selectedStandard);
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!formTitle.trim()) {
            Alert.alert('Error', 'Title is required');
            return;
        }
        if (!formSelectedStandard) {
            Alert.alert('Error', 'Please select a standard');
            return;
        }
        setSaving(true);
        try {
            const selectedStd = standards.find(s => String(s.number) === formSelectedStandard);
            if (editingItem) {
                await updateLanguageItem(editingItem.id, {
                    standard: formSelectedStandard,
                    standardId: selectedStd?.id || formSelectedStandard,
                    standardName: selectedStd ? `Std ${selectedStd.number}` : formSelectedStandard,
                    title: formTitle.trim(),
                    description: formDescription.trim(),
                    content: formContent.trim(),
                    order: parseInt(formOrder, 10) || 0,
                    isActive: formActive,
                });
            } else {
                await createLanguageItem({
                    standard: formSelectedStandard,
                    standardId: selectedStd?.id || formSelectedStandard,
                    standardName: selectedStd ? `Std ${selectedStd.number}` : formSelectedStandard,
                    language: selectedLanguage,
                    title: formTitle.trim(),
                    description: formDescription.trim(),
                    content: formContent.trim(),
                    order: parseInt(formOrder, 10) || 0,
                    isActive: formActive,
                });
            }
            setModalVisible(false);
            Alert.alert('Success', editingItem ? 'Item updated!' : 'Item created!');
            fetchItems();
        } catch (error) {
            Alert.alert('Error', (error as Error).message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (item: LanguageItem) => {
        Alert.alert('Delete', `Delete "${item.title}"?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive',
                onPress: async () => {
                    await deleteLanguageItem(item.id);
                    fetchItems();
                },
            },
        ]);
    };

    const renderItem = ({ item }: { item: LanguageItem }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardSub} numberOfLines={2}>{item.description}</Text>
                </View>
                <View style={[styles.statusBadge, !item.isActive && styles.inactiveBadge]}>
                    <Text style={[styles.statusText, !item.isActive && styles.inactiveText]}>
                        {item.isActive ? 'Active' : 'Inactive'}
                    </Text>
                </View>
            </View>
            <View style={styles.cardActions}>
                <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(item)}>
                    <Text style={styles.editBtnText}>✏️ Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
                    <Text style={styles.deleteBtnText}>🗑️ Delete</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Standard Selector */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stdRow} contentContainerStyle={styles.stdRowContent}>
                {standards.map(s => (
                    <TouchableOpacity
                        key={s.id}
                        style={[styles.stdChip, selectedStandard === String(s.number) && styles.stdChipActive]}
                        onPress={() => setSelectedStandard(String(s.number))}
                    >
                        <Text style={[styles.stdChipText, selectedStandard === String(s.number) && styles.stdChipTextActive]}>
                            Std {s.number}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Language Tabs */}
            <View style={styles.tabRow}>
                {LANGUAGE_TABS.map(tab => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[styles.langTab, selectedLanguage === tab.key && styles.langTabActive]}
                        onPress={() => setSelectedLanguage(tab.key)}
                    >
                        <Text style={[styles.langTabText, selectedLanguage === tab.key && styles.langTabTextActive]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* List */}
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={adminColors.primary} />
                </View>
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Text style={styles.emptyText}>No items. Tap + to add.</Text>
                        </View>
                    }
                />
            )}

            {/* FAB */}
            <TouchableOpacity style={styles.fab} onPress={openAddModal}>
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>

            {/* Add/Edit Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.modalTitle}>{editingItem ? 'Edit Item' : 'Add Item'}</Text>

                            {/* Standard picker */}
                            <Text style={styles.fieldLabel}>Standard *</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.stdRow, styles.modalStdRow]} contentContainerStyle={styles.stdRowContent}>
                                {standardsLoading ? (
                                    <View style={styles.stdLoading}>
                                        <ActivityIndicator size="small" color={adminColors.primary} />
                                        <Text style={styles.stdLoadingText}>Loading standards…</Text>
                                    </View>
                                ) : standards.length === 0 ? (
                                    <View style={styles.stdLoading}>
                                        <Text style={styles.stdLoadingText}>No standards found</Text>
                                    </View>
                                ) : null}
                                {standards.map(s => (
                                    <TouchableOpacity
                                        key={s.id}
                                        style={[styles.stdChip, formSelectedStandard === String(s.number) && styles.stdChipActive]}
                                        onPress={() => setFormSelectedStandard(String(s.number))}
                                    >
                                        <Text style={[styles.stdChipText, formSelectedStandard === String(s.number) && styles.stdChipTextActive]}>
                                            Std {s.number}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                            {isFallback && (
                                <Text style={styles.emptyStateText}>⚠️ No Standards Found. Please add standards first.</Text>
                            )}
                            {!formSelectedStandard && standards.length > 0 && (
                                <Text style={styles.validationHint}>Please select a standard</Text>
                            )}

                            <Text style={styles.fieldLabel}>Title *</Text>
                            <TextInput
                                style={styles.input}
                                value={formTitle}
                                onChangeText={setFormTitle}
                                placeholder="Enter title"
                                placeholderTextColor={adminColors.textMuted}
                            />

                            <Text style={styles.fieldLabel}>Description</Text>
                            <TextInput
                                style={[styles.input, styles.multiline]}
                                value={formDescription}
                                onChangeText={setFormDescription}
                                placeholder="Enter description"
                                placeholderTextColor={adminColors.textMuted}
                                multiline
                                numberOfLines={3}
                            />

                            <Text style={styles.fieldLabel}>Content (Detail)</Text>
                            <TextInput
                                style={[styles.input, styles.multiline, { minHeight: 100 }]}
                                value={formContent}
                                onChangeText={setFormContent}
                                placeholder="Enter content"
                                placeholderTextColor={adminColors.textMuted}
                                multiline
                                numberOfLines={5}
                            />

                            <Text style={styles.fieldLabel}>Order</Text>
                            <TextInput
                                style={styles.input}
                                value={formOrder}
                                onChangeText={setFormOrder}
                                placeholder="0"
                                placeholderTextColor={adminColors.textMuted}
                                keyboardType="numeric"
                            />

                            <TouchableOpacity
                                style={styles.toggleRow}
                                onPress={() => setFormActive(!formActive)}
                            >
                                <Text style={styles.toggleLabel}>Active</Text>
                                <View style={[styles.toggle, formActive && styles.toggleActive]}>
                                    <View style={[styles.toggleDot, formActive && styles.toggleDotActive]} />
                                </View>
                            </TouchableOpacity>

                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    style={styles.cancelBtn}
                                    onPress={() => setModalVisible(false)}
                                >
                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                                    onPress={handleSave}
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Text style={styles.saveBtnText}>Save</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: adminColors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: spacing.huge },
    stdRow: { maxHeight: 56, backgroundColor: adminColors.surface, borderBottomWidth: 1, borderBottomColor: adminColors.border },
    stdRowContent: { paddingHorizontal: spacing.md, alignItems: 'center', gap: spacing.sm },
    stdChip: {
        paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
        borderRadius: borderRadius.full, backgroundColor: adminColors.surfaceElevated,
        borderWidth: 1, borderColor: adminColors.border,
    },
    stdChipActive: { backgroundColor: adminColors.primary, borderColor: adminColors.primary },
    stdChipText: { color: adminColors.textSecondary, fontSize: typography.size.sm, fontWeight: typography.weight.medium },
    stdChipTextActive: { color: '#fff' },
    tabRow: { flexDirection: 'row', backgroundColor: adminColors.surface, borderBottomWidth: 1, borderBottomColor: adminColors.border },
    langTab: { flex: 1, paddingVertical: spacing.md, alignItems: 'center' },
    langTabActive: { borderBottomWidth: 2, borderBottomColor: adminColors.primary },
    langTabText: { fontSize: typography.size.md, fontWeight: typography.weight.medium, color: adminColors.textMuted },
    langTabTextActive: { color: adminColors.primary },
    listContent: { padding: spacing.lg },
    card: {
        backgroundColor: adminColors.surface, borderRadius: borderRadius.lg,
        padding: spacing.lg, marginBottom: spacing.md,
        borderWidth: 1, borderColor: adminColors.border, ...shadows.sm,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
    cardTitle: { fontSize: typography.size.lg, fontWeight: typography.weight.semibold, color: adminColors.textPrimary },
    cardSub: { fontSize: typography.size.sm, color: adminColors.textSecondary, marginTop: spacing.xs },
    statusBadge: {
        backgroundColor: adminColors.accentGreen + '20', paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xxs, borderRadius: borderRadius.sm, alignSelf: 'flex-start',
    },
    inactiveBadge: { backgroundColor: adminColors.accentRed + '20' },
    statusText: { fontSize: typography.size.xs, fontWeight: typography.weight.semibold, color: adminColors.accentGreen },
    inactiveText: { color: adminColors.accentRed },
    cardActions: { flexDirection: 'row', gap: spacing.md },
    editBtn: { flex: 1, backgroundColor: adminColors.surfaceElevated, padding: spacing.sm, borderRadius: borderRadius.md, alignItems: 'center' },
    editBtnText: { fontSize: typography.size.sm, color: adminColors.primary, fontWeight: typography.weight.medium },
    deleteBtn: { flex: 1, backgroundColor: adminColors.accentRed + '10', padding: spacing.sm, borderRadius: borderRadius.md, alignItems: 'center' },
    deleteBtnText: { fontSize: typography.size.sm, color: adminColors.accentRed, fontWeight: typography.weight.medium },
    emptyText: { color: adminColors.textMuted, fontSize: typography.size.md },
    fab: {
        position: 'absolute', bottom: 24, right: 24, width: 56, height: 56,
        borderRadius: 28, backgroundColor: adminColors.primary, justifyContent: 'center',
        alignItems: 'center', ...shadows.lg,
    },
    fabText: { fontSize: 28, color: '#fff', fontWeight: typography.weight.bold, marginTop: -2 },
    // Modal
    modalOverlay: { flex: 1, backgroundColor: adminColors.overlay, justifyContent: 'flex-end' },
    modalContent: {
        backgroundColor: adminColors.surface, borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl, padding: spacing.xl, maxHeight: '85%',
    },
    modalTitle: { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: adminColors.textPrimary, marginBottom: spacing.xl },
    fieldLabel: { fontSize: typography.size.sm, fontWeight: typography.weight.medium, color: adminColors.textSecondary, marginBottom: spacing.xs, marginTop: spacing.md },
    input: {
        backgroundColor: adminColors.surfaceElevated, borderRadius: borderRadius.md,
        padding: spacing.md, color: adminColors.textPrimary, fontSize: typography.size.md,
        borderWidth: 1, borderColor: adminColors.border,
    },
    multiline: { textAlignVertical: 'top', minHeight: 70 },
    toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xl },
    toggleLabel: { fontSize: typography.size.md, color: adminColors.textPrimary, fontWeight: typography.weight.medium },
    toggle: {
        width: 48, height: 28, borderRadius: 14, backgroundColor: adminColors.surfaceElevated,
        borderWidth: 1, borderColor: adminColors.border, justifyContent: 'center', paddingHorizontal: 2,
    },
    toggleActive: { backgroundColor: adminColors.accentGreen + '30', borderColor: adminColors.accentGreen },
    toggleDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: adminColors.textMuted },
    toggleDotActive: { backgroundColor: adminColors.accentGreen, alignSelf: 'flex-end' },
    modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xxl },
    cancelBtn: {
        flex: 1, padding: spacing.md, borderRadius: borderRadius.md,
        backgroundColor: adminColors.surfaceElevated, alignItems: 'center',
    },
    cancelBtnText: { color: adminColors.textSecondary, fontWeight: typography.weight.semibold },
    saveBtn: {
        flex: 1, padding: spacing.md, borderRadius: borderRadius.md,
        backgroundColor: adminColors.primary, alignItems: 'center',
    },
    saveBtnText: { color: '#fff', fontWeight: typography.weight.semibold },
    // Standard indicator in modal
    standardIndicator: {
        backgroundColor: adminColors.surfaceElevated,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: adminColors.primary + '40',
    },
    standardIndicatorText: {
        fontSize: typography.size.md,
        fontWeight: typography.weight.semibold,
        color: adminColors.primary,
    },
    modalStdRow: {
        maxHeight: 60,
        minHeight: 50,
        borderBottomWidth: 0,
        backgroundColor: 'transparent',
    },
    stdLoading: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
    },
    stdLoadingText: {
        color: adminColors.textMuted,
        fontSize: typography.size.sm,
    },
    validationHint: {
        color: adminColors.accentRed,
        fontSize: typography.size.xs,
        marginTop: spacing.xs,
        marginLeft: spacing.md,
    },
    emptyStateText: {
        color: adminColors.accentRed,
        fontSize: typography.size.xs,
        marginTop: spacing.xs,
        marginLeft: spacing.md,
        fontWeight: typography.weight.medium,
    },
});
