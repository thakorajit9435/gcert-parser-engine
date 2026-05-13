import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity, Alert,
    ActivityIndicator, Modal, TextInput, ScrollView,
} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import { adminColors, typography, spacing, borderRadius, shadows } from '../../theme';
import { useStandards } from '../../hooks/useStandards';
import { OldPaper } from '../../types';
import { uploadPdfWithProgress } from '../../services/firebase/storage.service';
import {
    getAllOldPapers,
    createOldPaper,
    updateOldPaper,
    deleteOldPaper,
} from '../../services/firebase/oldPapers.service';

export function AdminOldPapersScreen(): React.JSX.Element {
    const { standards } = useStandards();

    const [selectedStandard, setSelectedStandard] = useState<string>('');
    const [selectedSemester, setSelectedSemester] = useState<string>('1');
    const [items, setItems] = useState<OldPaper[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState<OldPaper | null>(null);

    // Form
    const [formSubject, setFormSubject] = useState('');
    const [formYear, setFormYear] = useState('');
    const [formPdfUrl, setFormPdfUrl] = useState('');
    const [formTitle, setFormTitle] = useState('');
    const [formActive, setFormActive] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingPdf, setUploadingPdf] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    useEffect(() => {
        if (standards.length > 0 && !selectedStandard && standards[0]) {
            setSelectedStandard(String(standards[0].number));
        }
    }, [standards, selectedStandard]);

    const fetchItems = useCallback(async () => {
        if (!selectedStandard) return;
        setLoading(true);
        const result = await getAllOldPapers(selectedStandard, selectedSemester);
        if (result.success && result.data) {
            setItems(result.data);
        }
        setLoading(false);
    }, [selectedStandard, selectedSemester]);

    useEffect(() => { fetchItems(); }, [fetchItems]);

    const openAddModal = () => {
        setEditingItem(null);
        setFormSubject(''); setFormYear(''); setFormPdfUrl('');
        setFormTitle(''); setFormActive(true);
        setModalVisible(true);
    };

    const openEditModal = (item: OldPaper) => {
        setEditingItem(item);
        setFormSubject(item.subject); setFormYear(item.year);
        setFormPdfUrl(item.pdfUrl); setFormTitle(item.title || '');
        setFormActive(item.isActive);
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
                const storagePath = `oldpapers/${selectedStandard}/sem${selectedSemester}`;
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
        if (!formSubject.trim() || !formYear.trim()) {
            Alert.alert('Error', 'Subject and Year are required');
            return;
        }
        if (!formPdfUrl.trim()) {
            Alert.alert('Error', 'Please upload a PDF');
            return;
        }
        setSaving(true);
        try {
            if (editingItem) {
                await updateOldPaper(editingItem.id, {
                    subject: formSubject.trim(), year: formYear.trim(),
                    pdfUrl: formPdfUrl.trim(), title: formTitle.trim(),
                    isActive: formActive,
                });
            } else {
                await createOldPaper({
                    standard: selectedStandard, semester: selectedSemester,
                    subject: formSubject.trim(), year: formYear.trim(),
                    pdfUrl: formPdfUrl.trim(), title: formTitle.trim(),
                    isActive: formActive,
                });
            }
            setModalVisible(false);
            Alert.alert('Success', editingItem ? 'Paper updated!' : 'Paper added!');
            fetchItems();
        } catch (error) {
            Alert.alert('Error', (error as Error).message);
        } finally { setSaving(false); }
    };

    const handleDelete = (item: OldPaper) => {
        Alert.alert('Delete', `Delete "${item.subject} - ${item.year}"?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: async () => { await deleteOldPaper(item.id); fetchItems(); } },
        ]);
    };

    const renderItem = ({ item }: { item: OldPaper }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{item.title || `${item.subject} - ${item.year}`}</Text>
                    <View style={styles.tagRow}>
                        <View style={styles.tag}><Text style={styles.tagText}>{item.subject}</Text></View>
                        <View style={[styles.tag, styles.yearTag]}><Text style={[styles.tagText, styles.yearText]}>{item.year}</Text></View>
                    </View>
                </View>
                <View style={[styles.statusBadge, !item.isActive && styles.inactiveBadge]}>
                    <Text style={[styles.statusText, !item.isActive && styles.inactiveText]}>
                        {item.isActive ? 'Active' : 'Inactive'}
                    </Text>
                </View>
            </View>
            <Text style={styles.pdfTag}>📄 {item.pdfUrl ? 'PDF attached' : 'No PDF'}</Text>
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
                    ListEmptyComponent={<View style={styles.center}><Text style={styles.emptyText}>No old papers. Tap + to add.</Text></View>}
                />
            )}

            <TouchableOpacity style={styles.fab} onPress={openAddModal}>
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>

            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.modalTitle}>{editingItem ? 'Edit Paper' : 'Add Paper'}</Text>

                            <Text style={styles.fieldLabel}>Title (optional)</Text>
                            <TextInput style={styles.input} value={formTitle} onChangeText={setFormTitle} placeholder="Custom title" placeholderTextColor={adminColors.textMuted} />

                            <Text style={styles.fieldLabel}>Subject *</Text>
                            <TextInput style={styles.input} value={formSubject} onChangeText={setFormSubject} placeholder="e.g. Mathematics" placeholderTextColor={adminColors.textMuted} />

                            <Text style={styles.fieldLabel}>Year *</Text>
                            <TextInput style={styles.input} value={formYear} onChangeText={setFormYear} placeholder="e.g. 2024" placeholderTextColor={adminColors.textMuted} keyboardType="numeric" />

                            {/* PDF Upload */}
                            <Text style={styles.fieldLabel}>PDF Document *</Text>
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
    separator: { width: 1, height: 24, backgroundColor: adminColors.border, marginHorizontal: spacing.xs },
    listContent: { padding: spacing.lg },
    card: { backgroundColor: adminColors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: adminColors.border, ...shadows.sm },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
    cardTitle: { fontSize: typography.size.lg, fontWeight: typography.weight.semibold, color: adminColors.textPrimary, marginBottom: spacing.xs },
    tagRow: { flexDirection: 'row', gap: spacing.sm },
    tag: { backgroundColor: adminColors.accent + '20', paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs, borderRadius: borderRadius.sm },
    tagText: { fontSize: typography.size.xs, fontWeight: typography.weight.semibold, color: adminColors.accent },
    yearTag: { backgroundColor: adminColors.accentOrange + '20' },
    yearText: { color: adminColors.accentOrange },
    pdfTag: { fontSize: typography.size.xs, color: adminColors.textMuted, marginBottom: spacing.md },
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
});
