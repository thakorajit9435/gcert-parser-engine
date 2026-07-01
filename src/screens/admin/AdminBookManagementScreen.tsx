import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity, Alert,
    ActivityIndicator, Modal, TextInput, ScrollView,
} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import { adminColors, typography, spacing, borderRadius, shadows } from '../../theme';
import { useStandards } from '../../hooks/useStandards';
import { useSubjects } from '../../hooks/useSubjects';
import { Book } from '../../types';
import {
    getBooksByStandard,
    addBook,
    updateBook,
    deleteBook,
    uploadBookPdf,
} from '../../services/firebase/book.service';

export function AdminBookManagementScreen(): React.JSX.Element {
    const { standards } = useStandards();

    const [selectedStandard, setSelectedStandard] = useState<string>('');
    const [selectedSemester, setSelectedSemester] = useState<string>('1');
    const [items, setItems] = useState<Book[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState<Book | null>(null);

    // Auto-select standard on load
    useEffect(() => {
        if (standards.length > 0 && !selectedStandard && standards[0]) {
            setSelectedStandard(String(standards[0].number));
        }
    }, [standards, selectedStandard]);

    // Subjects dropdown hook uses the selected standard and semester
    const { subjects, loading: subjectsLoading } = useSubjects(selectedStandard, selectedSemester);

    // Form
    const [formSubjectId, setFormSubjectId] = useState('');
    const [formTitle, setFormTitle] = useState('');
    const [formPdfUrl, setFormPdfUrl] = useState('');
    const [formTotalPages, setFormTotalPages] = useState('0');
    const [formActive, setFormActive] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);

    const fetchItems = useCallback(async () => {
        if (!selectedStandard) {return;}
        setLoading(true);
        // By passing activeOnly=false, admin sees all books
        const result = await getBooksByStandard(selectedStandard, false);
        if (result.success && result.data) {
            setItems(result.data.filter(b => b.semester === selectedSemester));
        }
        setLoading(false);
    }, [selectedStandard, selectedSemester]);

    useEffect(() => { fetchItems(); }, [fetchItems]);

    // Reset subject when tab changes
    useEffect(() => {
        if (subjects.length > 0 && subjects[0]) {
            setFormSubjectId(subjects[0]?.id || '');
        } else {
            setFormSubjectId('');
        }
    }, [subjects, selectedStandard, selectedSemester]);

    const openAddModal = () => {
        setEditingItem(null);
        setFormSubjectId(subjects.length > 0 ? subjects[0]?.id || '' : '');
        setFormTitle('');
        setFormPdfUrl('');
        setFormTotalPages('0');
        setFormActive(true);
        setModalVisible(true);
    };

    const openEditModal = (item: Book) => {
        setEditingItem(item);
        setFormSubjectId(item.subjectId);
        setFormTitle(item.title);
        setFormPdfUrl(item.pdfUrl);
        setFormTotalPages(String(item.totalPages || 0));
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
                setUploading(true);
                // The filename might have spaces, replace them for storage
                const safeName = (res.name || 'book').replace(/[^a-zA-Z0-9.\-_]/g, '_');

                // Use fileCopyUri if available to avoid Android permission denial on content:// URIs
                const fileUri = res.fileCopyUri || res.uri;

                const result = await uploadBookPdf(fileUri, selectedStandard, formSubjectId || 'general', safeName);

                if (result.success && result.data) {
                    setFormPdfUrl(result.data);
                    Alert.alert('Success', 'PDF uploaded successfully!');
                } else {
                    Alert.alert('Upload Failed', result.error);
                }
                setUploading(false);
            }
        } catch (err) {
            if (DocumentPicker.isCancel(err)) {
                // User cancelled
            } else {
                Alert.alert('Error', 'Failed to pick document: ' + err);
            }
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (!formSubjectId.trim() || !formTitle.trim() || !formPdfUrl.trim()) {
            Alert.alert('Error', 'Subject, Title, and PDF are required');
            return;
        }

        const parsedPages = parseInt(formTotalPages, 10) || 0;

        setSaving(true);
        try {
            if (editingItem) {
                await updateBook(editingItem.id, {
                    subjectId: formSubjectId.trim(),
                    title: formTitle.trim(),
                    pdfUrl: formPdfUrl.trim(),
                    totalPages: parsedPages,
                    isActive: formActive,
                });
            } else {
                const addRes = await addBook({
                    standard: selectedStandard,
                    semester: selectedSemester,
                    subjectId: formSubjectId.trim(),
                    title: formTitle.trim(),
                    pdfUrl: formPdfUrl.trim(),
                    totalPages: parsedPages,
                    isActive: formActive,
                });

                if (!addRes.success) {
                    Alert.alert('Error', addRes.error);
                    setSaving(false);
                    return;
                }
            }
            setModalVisible(false);
            fetchItems();
        } catch (error) {
            Alert.alert('Error', (error as Error).message);
        } finally { setSaving(false); }
    };

    const handleDelete = (item: Book) => {
        Alert.alert('Delete Book', `Are you sure you want to delete "${item.title}"?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    await deleteBook(item.id);
                    fetchItems();
                },
            },
        ]);
    };

    const renderItem = ({ item }: { item: Book }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <View style={styles.tagRow}>
                        <View style={styles.tag}><Text style={styles.tagText}>{item.subjectId}</Text></View>
                        <View style={[styles.tag, styles.pagesTag]}><Text style={[styles.tagText, styles.pagesText]}>{item.totalPages} Pages</Text></View>
                    </View>
                </View>
                <View style={[styles.statusBadge, !item.isActive && styles.inactiveBadge]}>
                    <Text style={[styles.statusText, !item.isActive && styles.inactiveText]}>
                        {item.isActive ? 'Active' : 'Inactive'}
                    </Text>
                </View>
            </View>
            <Text style={styles.pdfTag} numberOfLines={1} ellipsizeMode="middle">📄 {item.pdfUrl ? 'PDF attached' : 'No PDF'}</Text>
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
                    ListEmptyComponent={<View style={styles.center}><Text style={styles.emptyText}>No books. Tap + to add.</Text></View>}
                />
            )}

            <TouchableOpacity style={styles.fab} onPress={openAddModal}>
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>

            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.modalTitle}>{editingItem ? 'Edit Book' : 'Add Book'}</Text>

                            <Text style={styles.fieldLabel}>Subject *</Text>
                            {subjectsLoading ? (
                                <ActivityIndicator size="small" color={adminColors.primary} />
                            ) : subjects.length === 0 ? (
                                <TextInput style={styles.input} value={formSubjectId} onChangeText={setFormSubjectId} placeholder="e.g. Mathematics" placeholderTextColor={adminColors.textMuted} />
                            ) : (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
                                    {subjects.map(s => (
                                        <TouchableOpacity
                                            key={s.id}
                                            style={[styles.subjectChip, formSubjectId === s.id && styles.subjectChipActive]}
                                            onPress={() => setFormSubjectId(s.id)}
                                        >
                                            <Text style={[styles.subjectChipText, formSubjectId === s.id && styles.subjectChipTextActive]}>{s.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            )}

                            <Text style={styles.fieldLabel}>Book Title *</Text>
                            <TextInput style={styles.input} value={formTitle} onChangeText={setFormTitle} placeholder="e.g. NCERT Math Grade 4" placeholderTextColor={adminColors.textMuted} />

                            <Text style={styles.fieldLabel}>Total Pages (Optional)</Text>
                            <TextInput style={styles.input} value={formTotalPages} onChangeText={setFormTotalPages} placeholder="e.g. 150" placeholderTextColor={adminColors.textMuted} keyboardType="numeric" />

                            <Text style={styles.fieldLabel}>Book PDF *</Text>
                            {formPdfUrl ? (
                                <View style={styles.fileBox}>
                                    <Text style={styles.fileBoxText} numberOfLines={1} ellipsizeMode="middle">{formPdfUrl}</Text>
                                    <TouchableOpacity style={styles.repickBtn} onPress={handlePickPdf} disabled={uploading}>
                                        <Text style={styles.repickBtnText}>Change</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity style={styles.uploadBtn} onPress={handlePickPdf} disabled={uploading || !formSubjectId}>
                                    {uploading ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Text style={styles.uploadBtnText}>⬆️ Upload PDF</Text>
                                    )}
                                </TouchableOpacity>
                            )}
                            {!formSubjectId && !formPdfUrl && <Text style={{ fontSize: 12, color: adminColors.textMuted, marginTop: 4 }}>Select a subject first to upload PDF</Text>}

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
                                <TouchableOpacity style={[styles.saveBtn, (saving || uploading) && { opacity: 0.6 }]} onPress={handleSave} disabled={saving || uploading}>
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
    subjectChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md, backgroundColor: adminColors.surfaceElevated, borderWidth: 1, borderColor: adminColors.border, marginRight: spacing.sm },
    subjectChipActive: { backgroundColor: adminColors.primary + '20', borderColor: adminColors.primary },
    subjectChipText: { color: adminColors.textSecondary, fontSize: typography.size.sm, fontWeight: typography.weight.medium },
    subjectChipTextActive: { color: adminColors.primary, fontWeight: typography.weight.bold },
    separator: { width: 1, height: 24, backgroundColor: adminColors.border, marginHorizontal: spacing.xs },
    listContent: { padding: spacing.lg },
    card: { backgroundColor: adminColors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: adminColors.border, ...shadows.sm },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
    cardTitle: { fontSize: typography.size.lg, fontWeight: typography.weight.semibold, color: adminColors.textPrimary, marginBottom: spacing.xs },
    tagRow: { flexDirection: 'row', gap: spacing.sm },
    tag: { backgroundColor: adminColors.accent + '20', paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs, borderRadius: borderRadius.sm },
    tagText: { fontSize: typography.size.xs, fontWeight: typography.weight.semibold, color: adminColors.accent },
    pagesTag: { backgroundColor: adminColors.primary + '20' },
    pagesText: { color: adminColors.primary },
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
    uploadBtn: { backgroundColor: adminColors.primary, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
    uploadBtnText: { color: '#fff', fontSize: typography.size.md, fontWeight: typography.weight.bold },
    fileBox: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, backgroundColor: adminColors.accentGreen + '10', borderRadius: borderRadius.md, borderWidth: 1, borderColor: adminColors.accentGreen + '30' },
    fileBoxText: { flex: 1, color: adminColors.textSecondary, fontSize: typography.size.sm, marginRight: spacing.sm },
    repickBtn: { backgroundColor: adminColors.surfaceElevated, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.xs },
    repickBtnText: { color: adminColors.primary, fontSize: typography.size.xs, fontWeight: typography.weight.bold },
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
