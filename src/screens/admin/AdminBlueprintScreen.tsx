import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity, Alert,
    ActivityIndicator, Modal, TextInput, ScrollView,
} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import { adminColors, typography, spacing, borderRadius, shadows } from '../../theme';
import { useStandards } from '../../hooks/useStandards';
import { useSubjects } from '../../hooks/useSubjects';
import { Blueprint } from '../../types';
import { uploadPdfWithProgress } from '../../services/firebase/storage.service';
import {
    getAllBlueprints,
    createBlueprint,
    updateBlueprint,
    deleteBlueprint,
} from '../../services/firebase/blueprint.service';

export function AdminBlueprintScreen(): React.JSX.Element {
    const { standards, loading: standardsLoading, isFallback } = useStandards();

    const [selectedStandard, setSelectedStandard] = useState<string>('');
    const [selectedSemester, setSelectedSemester] = useState<string>('1');
    const [items, setItems] = useState<Blueprint[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState<Blueprint | null>(null);

    // Form
    const [formTitle, setFormTitle] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formContent, setFormContent] = useState('');
    const [formPdfUrl, setFormPdfUrl] = useState('');
    const [formOrder, setFormOrder] = useState('0');
    const [formActive, setFormActive] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingPdf, setUploadingPdf] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [formSubjectId, setFormSubjectId] = useState('');
    const [formSelectedStandard, setFormSelectedStandard] = useState('');

    // Use formSelectedStandard's ID when modal is open so subject list matches the selected standard
    const subjectStandard = modalVisible ? formSelectedStandard : selectedStandard;
    const selectedStdObj = standards.find(s => String(s.number) === subjectStandard);
    const { subjects: availableSubjects } = useSubjects(selectedStdObj?.id, undefined);

    useEffect(() => {
        if (standards.length > 0 && !selectedStandard && standards[0]) {
            setSelectedStandard(String(standards[0].number));
        }
    }, [standards, selectedStandard]);

    const fetchItems = useCallback(async () => {
        if (!selectedStandard) return;
        setLoading(true);
        const result = await getAllBlueprints(selectedStandard, selectedSemester);
        if (result.success && result.data) {
            setItems(result.data);
        }
        setLoading(false);
    }, [selectedStandard, selectedSemester]);

    useEffect(() => { fetchItems(); }, [fetchItems]);

    const openAddModal = () => {
        setEditingItem(null);
        setFormTitle(''); setFormDescription(''); setFormContent('');
        setFormPdfUrl(''); setFormOrder(String(items.length)); setFormActive(true);
        setFormSubjectId('');
        setFormSelectedStandard(selectedStandard);
        setModalVisible(true);
    };

    const openEditModal = (item: Blueprint) => {
        setEditingItem(item);
        setFormTitle(item.title); setFormDescription(item.description || '');
        setFormContent(item.content || ''); setFormPdfUrl(item.pdfUrl || '');
        setFormOrder(String(item.order)); setFormActive(item.isActive);
        setFormSubjectId(item.subjectId || '');
        setFormSelectedStandard(item.standard || selectedStandard);
        setModalVisible(true);
    };

    const handlePickPdf = async () => {
        try {
            const res = await DocumentPicker.pickSingle({
                type: [DocumentPicker.types.pdf],
                copyTo: 'cachesDirectory',
            });
            if (res && res.uri) {
                setUploadingPdf(true);
                setUploadProgress(0);
                const fileUri = res.fileCopyUri || res.uri;
                const storagePath = `blueprints/${selectedStandard}/sem${selectedSemester}`;
                const result = await uploadPdfWithProgress(fileUri, storagePath, (pct) => {
                    setUploadProgress(pct);
                });
                if (result.success && result.data) {
                    setFormPdfUrl(result.data);
                    Alert.alert('Success', 'PDF uploaded successfully!');
                } else {
                    Alert.alert('Upload Failed', result.error || 'Failed to upload PDF');
                }
                setUploadingPdf(false);
            }
        } catch (err) {
            if (!DocumentPicker.isCancel(err)) {
                Alert.alert('Error', 'Failed to pick document: ' + (err as Error).message);
            }
            setUploadingPdf(false);
        }
    };

    const handleSave = async () => {
        if (!formTitle.trim()) { Alert.alert('Error', 'Title is required'); return; }
        if (!formSelectedStandard) { Alert.alert('Error', 'Please select a standard'); return; }
        setSaving(true);
        try {
            const selectedStd = standards.find(s => String(s.number) === formSelectedStandard);
            if (editingItem) {
                await updateBlueprint(editingItem.id, {
                    standard: formSelectedStandard,
                    standardId: selectedStd?.id || formSelectedStandard,
                    subjectId: formSubjectId || undefined,
                    title: formTitle.trim(), description: formDescription.trim(),
                    content: formContent.trim(), pdfUrl: formPdfUrl.trim(),
                    order: parseInt(formOrder, 10) || 0, isActive: formActive,
                });
            } else {
                await createBlueprint({
                    standard: formSelectedStandard, semester: selectedSemester,
                    standardId: selectedStd?.id || formSelectedStandard,
                    subjectId: formSubjectId || undefined,
                    title: formTitle.trim(), description: formDescription.trim(),
                    content: formContent.trim(), pdfUrl: formPdfUrl.trim(),
                    order: parseInt(formOrder, 10) || 0, isActive: formActive,
                });
            }
            setModalVisible(false);
            Alert.alert('Success', editingItem ? 'Blueprint updated!' : 'Blueprint created!');
            fetchItems();
        } catch (error) {
            Alert.alert('Error', (error as Error).message);
        } finally { setSaving(false); }
    };

    const handleDelete = (item: Blueprint) => {
        Alert.alert('Delete', `Delete "${item.title}"?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: async () => { await deleteBlueprint(item.id); fetchItems(); } },
        ]);
    };

    const renderItem = ({ item }: { item: Blueprint }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    {item.description ? <Text style={styles.cardSub} numberOfLines={2}>{item.description}</Text> : null}
                </View>
                <View style={[styles.statusBadge, !item.isActive && styles.inactiveBadge]}>
                    <Text style={[styles.statusText, !item.isActive && styles.inactiveText]}>
                        {item.isActive ? 'Active' : 'Inactive'}
                    </Text>
                </View>
            </View>
            {item.pdfUrl ? <Text style={styles.pdfTag}>📄 PDF attached</Text> : null}
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
            {/* Standard chips + Semester toggle */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
                {standards.map(s => (
                    <TouchableOpacity
                        key={s.id}
                        style={[styles.chip, selectedStandard === String(s.number) && styles.chipActive]}
                        onPress={() => setSelectedStandard(String(s.number))}
                    >
                        <Text style={[styles.chipText, selectedStandard === String(s.number) && styles.chipTextActive]}>Std {s.number}</Text>
                    </TouchableOpacity>
                ))}
                <View style={styles.separator} />
                {['1', '2'].map(sem => (
                    <TouchableOpacity
                        key={sem}
                        style={[styles.chip, selectedSemester === sem && styles.chipActive]}
                        onPress={() => setSelectedSemester(sem)}
                    >
                        <Text style={[styles.chipText, selectedSemester === sem && styles.chipTextActive]}>Sem {sem}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color={adminColors.primary} /></View>
            ) : (
                <FlatList
                    data={items} keyExtractor={i => i.id} renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={<View style={styles.center}><Text style={styles.emptyText}>No blueprints. Tap + to add.</Text></View>}
                />
            )}

            <TouchableOpacity style={styles.fab} onPress={openAddModal}>
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>

            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.modalTitle}>{editingItem ? 'Edit Blueprint' : 'Add Blueprint'}</Text>

                            {/* Standard indicator */}
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

                            {/* Subject picker */}
                            <Text style={styles.fieldLabel}>Subject (Optional)</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subjectPickerRow}>
                                <TouchableOpacity
                                    style={[styles.chip, !formSubjectId && styles.chipActive]}
                                    onPress={() => setFormSubjectId('')}
                                >
                                    <Text style={[styles.chipText, !formSubjectId && styles.chipTextActive]}>All</Text>
                                </TouchableOpacity>
                                {availableSubjects.map(subj => (
                                    <TouchableOpacity
                                        key={subj.id}
                                        style={[styles.chip, formSubjectId === subj.id && styles.chipActive]}
                                        onPress={() => setFormSubjectId(subj.id)}
                                    >
                                        <Text style={[styles.chipText, formSubjectId === subj.id && styles.chipTextActive]}>
                                            {subj.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <Text style={styles.fieldLabel}>Title *</Text>
                            <TextInput style={styles.input} value={formTitle} onChangeText={setFormTitle} placeholder="Enter title" placeholderTextColor={adminColors.textMuted} />

                            <Text style={styles.fieldLabel}>Description</Text>
                            <TextInput style={[styles.input, styles.multiline]} value={formDescription} onChangeText={setFormDescription} placeholder="Enter description" placeholderTextColor={adminColors.textMuted} multiline numberOfLines={3} />

                            <Text style={styles.fieldLabel}>Content</Text>
                            <TextInput style={[styles.input, styles.multiline, { minHeight: 100 }]} value={formContent} onChangeText={setFormContent} placeholder="Enter content" placeholderTextColor={adminColors.textMuted} multiline numberOfLines={5} />

                            {/* PDF Upload */}
                            <Text style={styles.fieldLabel}>PDF Document</Text>
                            {formPdfUrl ? (
                                <View style={styles.pdfUploadedRow}>
                                    <Text style={styles.pdfUploadedText}>✅ PDF Uploaded</Text>
                                    <View style={styles.pdfBtnRow}>
                                        <TouchableOpacity style={styles.changePdfBtn} onPress={handlePickPdf} disabled={uploadingPdf}>
                                            <Text style={styles.changePdfBtnText}>Change</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => setFormPdfUrl('')}>
                                            <Text style={styles.removePdfText}>Remove</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                <TouchableOpacity style={styles.uploadBtn} onPress={handlePickPdf} disabled={uploadingPdf}>
                                    {uploadingPdf ? (
                                        <View style={styles.uploadingRow}>
                                            <ActivityIndicator size="small" color={adminColors.primary} />
                                            <Text style={styles.uploadingText}>Uploading… {uploadProgress}%</Text>
                                        </View>
                                    ) : (
                                        <Text style={styles.uploadBtnText}>⬆️ Upload PDF</Text>
                                    )}
                                </TouchableOpacity>
                            )}

                            <Text style={styles.fieldLabel}>Order</Text>
                            <TextInput style={styles.input} value={formOrder} onChangeText={setFormOrder} placeholder="0" placeholderTextColor={adminColors.textMuted} keyboardType="numeric" />

                            <TouchableOpacity style={styles.toggleRow} onPress={() => setFormActive(!formActive)}>
                                <Text style={styles.toggleLabel}>Active</Text>
                                <View style={[styles.toggle, formActive && styles.toggleActive]}>
                                    <View style={[styles.toggleDot, formActive && styles.toggleDotActive]} />
                                </View>
                            </TouchableOpacity>

                            <View style={styles.modalActions}>
                                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.saveBtn, (saving || uploadingPdf) && { opacity: 0.6 }]} onPress={handleSave} disabled={saving || uploadingPdf}>
                                    {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
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
    filterRow: { maxHeight: 56, backgroundColor: adminColors.surface, borderBottomWidth: 1, borderBottomColor: adminColors.border },
    filterContent: { paddingHorizontal: spacing.md, alignItems: 'center', gap: spacing.sm },
    chip: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.full, backgroundColor: adminColors.surfaceElevated, borderWidth: 1, borderColor: adminColors.border },
    chipActive: { backgroundColor: adminColors.primary, borderColor: adminColors.primary },
    chipText: { color: adminColors.textSecondary, fontSize: typography.size.sm, fontWeight: typography.weight.medium },
    chipTextActive: { color: '#fff' },
    stdRow: { maxHeight: 56, marginBottom: spacing.md },
    stdRowContent: { alignItems: 'center', gap: spacing.sm },
    stdChip: {
        paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
        borderRadius: borderRadius.full, backgroundColor: adminColors.surfaceElevated,
        borderWidth: 1, borderColor: adminColors.border,
    },
    stdChipActive: { backgroundColor: adminColors.primary, borderColor: adminColors.primary },
    stdChipText: { color: adminColors.textSecondary, fontSize: typography.size.sm, fontWeight: typography.weight.medium },
    stdChipTextActive: { color: '#fff' },
    separator: { width: 1, height: 24, backgroundColor: adminColors.border, marginHorizontal: spacing.xs },
    listContent: { padding: spacing.lg },
    card: { backgroundColor: adminColors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: adminColors.border, ...shadows.sm },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
    cardTitle: { fontSize: typography.size.lg, fontWeight: typography.weight.semibold, color: adminColors.textPrimary },
    cardSub: { fontSize: typography.size.sm, color: adminColors.textSecondary, marginTop: spacing.xs },
    pdfTag: { fontSize: typography.size.xs, color: adminColors.accent, marginBottom: spacing.md },
    statusBadge: { backgroundColor: adminColors.accentGreen + '20', paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs, borderRadius: borderRadius.sm, alignSelf: 'flex-start' },
    inactiveBadge: { backgroundColor: adminColors.accentRed + '20' },
    statusText: { fontSize: typography.size.xs, fontWeight: typography.weight.semibold, color: adminColors.accentGreen },
    inactiveText: { color: adminColors.accentRed },
    cardActions: { flexDirection: 'row', gap: spacing.md },
    editBtn: { flex: 1, backgroundColor: adminColors.surfaceElevated, padding: spacing.sm, borderRadius: borderRadius.md, alignItems: 'center' },
    editBtnText: { fontSize: typography.size.sm, color: adminColors.primary, fontWeight: typography.weight.medium },
    deleteBtn: { flex: 1, backgroundColor: adminColors.accentRed + '10', padding: spacing.sm, borderRadius: borderRadius.md, alignItems: 'center' },
    deleteBtnText: { fontSize: typography.size.sm, color: adminColors.accentRed, fontWeight: typography.weight.medium },
    emptyText: { color: adminColors.textMuted, fontSize: typography.size.md },
    fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: adminColors.primary, justifyContent: 'center', alignItems: 'center', ...shadows.lg },
    fabText: { fontSize: 28, color: '#fff', fontWeight: typography.weight.bold, marginTop: -2 },
    modalOverlay: { flex: 1, backgroundColor: adminColors.overlay, justifyContent: 'flex-end' },
    modalContent: { backgroundColor: adminColors.surface, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, padding: spacing.xl, maxHeight: '85%' },
    modalTitle: { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: adminColors.textPrimary, marginBottom: spacing.xl },
    fieldLabel: { fontSize: typography.size.sm, fontWeight: typography.weight.medium, color: adminColors.textSecondary, marginBottom: spacing.xs, marginTop: spacing.md },
    input: { backgroundColor: adminColors.surfaceElevated, borderRadius: borderRadius.md, padding: spacing.md, color: adminColors.textPrimary, fontSize: typography.size.md, borderWidth: 1, borderColor: adminColors.border },
    multiline: { textAlignVertical: 'top', minHeight: 70 },
    // PDF upload styles
    pdfUploadedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#E8F5E9', padding: spacing.md, borderRadius: borderRadius.md },
    pdfUploadedText: { fontSize: typography.size.sm, color: '#2E7D32', fontWeight: typography.weight.semibold },
    pdfBtnRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    changePdfBtn: { backgroundColor: adminColors.primary + '20', paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs, borderRadius: borderRadius.sm },
    changePdfBtnText: { fontSize: typography.size.xs, color: adminColors.primary, fontWeight: typography.weight.bold },
    removePdfText: { fontSize: typography.size.sm, color: adminColors.accentRed, fontWeight: typography.weight.semibold },
    uploadBtn: { backgroundColor: adminColors.surfaceElevated, borderWidth: 1, borderColor: adminColors.border, borderStyle: 'dashed', padding: spacing.lg, borderRadius: borderRadius.md, alignItems: 'center' },
    uploadBtnText: { fontSize: typography.size.sm, color: adminColors.primary, fontWeight: typography.weight.semibold },
    uploadingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    uploadingText: { fontSize: typography.size.sm, color: adminColors.primary, fontWeight: typography.weight.medium },
    // Toggle styles
    toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xl },
    toggleLabel: { fontSize: typography.size.md, color: adminColors.textPrimary, fontWeight: typography.weight.medium },
    toggle: { width: 48, height: 28, borderRadius: 14, backgroundColor: adminColors.surfaceElevated, borderWidth: 1, borderColor: adminColors.border, justifyContent: 'center', paddingHorizontal: 2 },
    toggleActive: { backgroundColor: adminColors.accentGreen + '30', borderColor: adminColors.accentGreen },
    toggleDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: adminColors.textMuted },
    toggleDotActive: { backgroundColor: adminColors.accentGreen, alignSelf: 'flex-end' },
    modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xxl },
    cancelBtn: { flex: 1, padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: adminColors.surfaceElevated, alignItems: 'center' },
    cancelBtnText: { color: adminColors.textSecondary, fontWeight: typography.weight.semibold },
    saveBtn: { flex: 1, padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: adminColors.primary, alignItems: 'center' },
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
    subjectPickerRow: {
        maxHeight: 44,
        marginBottom: spacing.sm,
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
