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
    TextInput,
    useWindowDimensions,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { adminColors, typography, spacing, borderRadius } from '../../theme';
import { Modal } from '../../components/common/Modal';
import { COLLECTIONS } from '../../constants';
import { Subject } from '../../types';

export function ContentManagementScreen({ navigation }: { navigation: any }): React.JSX.Element {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
    const [saving, setSaving] = useState(false);
    const { width } = useWindowDimensions();
    const isTablet = width >= 768;

    const [formName, setFormName] = useState('');
    const [formNameGu, setFormNameGu] = useState('');
    const [formStandardId, setFormStandardId] = useState('1');
    const [formSession, setFormSession] = useState('1');
    const [formIcon, setFormIcon] = useState('📚');
    const [formOrder, setFormOrder] = useState('1');

    const fetchSubjects = useCallback(async () => {
        try {
            const snapshot = await firestore()
                .collection(COLLECTIONS.SUBJECTS)
                .orderBy('order', 'asc')
                .get();

            const data = snapshot.docs
                .map((doc) => ({ id: doc.id, ...doc.data() }) as Subject)
                .filter((s) => !s.isDeleted);

            setSubjects(data);
        } catch (err) {
            Alert.alert('Error', (err as Error).message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchSubjects();
    }, [fetchSubjects]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchSubjects();
    }, [fetchSubjects]);

    const openAddModal = useCallback(() => {
        setEditingSubject(null);
        setFormName('');
        setFormNameGu('');
        setFormStandardId('1');
        setFormSession('1');
        setFormIcon('📚');
        setFormOrder(String(subjects.length + 1));
        setModalVisible(true);
    }, [subjects.length]);

    const openEditModal = useCallback((subject: Subject) => {
        setEditingSubject(subject);
        setFormName(subject.name);
        setFormNameGu(subject.nameGu);
        setFormStandardId(subject.standardId);
        setFormSession(subject.session || '1');
        setFormIcon(subject.icon || '📚');
        setFormOrder(String(subject.order));
        setModalVisible(true);
    }, []);

    const handleSave = useCallback(async () => {
        if (!formName.trim() || !formNameGu.trim()) {
            Alert.alert('Validation', 'Name and Gujarati name are required.');
            return;
        }

        setSaving(true);
        try {
            if (editingSubject) {
                await firestore()
                    .collection(COLLECTIONS.SUBJECTS)
                    .doc(editingSubject.id)
                    .update({
                        name: formName.trim(),
                        nameGu: formNameGu.trim(),
                        standardId: formStandardId,
                        session: formSession,
                        icon: formIcon,
                        order: parseInt(formOrder, 10) || 1,
                        updatedAt: firestore.FieldValue.serverTimestamp(),
                    });
                Alert.alert('Success', 'Subject updated!');
            } else {
                await firestore()
                    .collection(COLLECTIONS.SUBJECTS)
                    .add({
                        name: formName.trim(),
                        nameGu: formNameGu.trim(),
                        standardId: formStandardId,
                        session: formSession,
                        icon: formIcon,
                        order: parseInt(formOrder, 10) || 1,
                        isDeleted: false,
                        createdAt: firestore.FieldValue.serverTimestamp(),
                        updatedAt: firestore.FieldValue.serverTimestamp(),
                    });
                Alert.alert('Success', 'Subject created!');
            }
            setModalVisible(false);
            fetchSubjects();
        } catch (err) {
            Alert.alert('Error', (err as Error).message);
        } finally {
            setSaving(false);
        }
    }, [editingSubject, formName, formNameGu, formStandardId, formIcon, formOrder, fetchSubjects]);

    const handleDelete = useCallback((subject: Subject) => {
        Alert.alert(
            'Delete Subject',
            `Are you sure you want to delete "${subject.name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await firestore()
                                .collection(COLLECTIONS.SUBJECTS)
                                .doc(subject.id)
                                .update({
                                    isDeleted: true,
                                    updatedAt: firestore.FieldValue.serverTimestamp(),
                                });
                            Alert.alert('Deleted', 'Subject deleted.');
                            fetchSubjects();
                        } catch (err) {
                            Alert.alert('Error', (err as Error).message);
                        }
                    },
                },
            ],
        );
    }, [fetchSubjects]);

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={adminColors.primary} />
                <Text style={styles.loadingText}>Loading subjects…</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Manage Subjects</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity style={[styles.addButton, { backgroundColor: adminColors.surfaceElevated, borderWidth: 1, borderColor: adminColors.border }]} onPress={() => navigation.navigate('ManageSessions')}>
                        <Text style={styles.addButtonText}>Sessions</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
                        <Text style={styles.addButtonText}>+ Add Subject</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                data={subjects}
                keyExtractor={(item) => item.id}
                numColumns={isTablet ? 2 : 1}
                initialNumToRender={10}
                maxToRenderPerBatch={8}
                windowSize={5}
                key={isTablet ? 'tablet' : 'phone'}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={adminColors.primary}
                    />
                }
                renderItem={({ item }) => (
                    <View style={[styles.subjectCard, isTablet && styles.subjectCardTablet]}>
                        <View style={styles.subjectCardHeader}>
                            <Text style={styles.subjectIcon}>{item.icon || '📚'}</Text>
                            <View style={styles.subjectInfo}>
                                <Text style={styles.subjectName}>{item.name}</Text>
                                <Text style={styles.subjectNameGu}>{item.nameGu}</Text>
                                <Text style={styles.subjectMeta}>Std {item.standardId} • Order: {item.order}</Text>
                            </View>
                        </View>
                        <View style={styles.subjectActions}>
                            <TouchableOpacity
                                style={styles.editBtn}
                                onPress={() => openEditModal(item)}
                            >
                                <Text style={styles.editBtnText}>Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.chaptersBtn}
                                onPress={() => navigation.navigate('ChapterManagement', { subjectId: item.id, subjectName: item.name })}
                            >
                                <Text style={styles.chaptersBtnText}>Chapters</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.deleteBtn}
                                onPress={() => handleDelete(item)}
                            >
                                <Text style={styles.deleteBtnText}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyIcon}>📭</Text>
                        <Text style={styles.emptyTitle}>No Subjects</Text>
                        <Text style={styles.emptyMsg}>Add your first subject to get started.</Text>
                    </View>
                }
            />

            <Modal
                visible={modalVisible}
                title={editingSubject ? 'Edit Subject' : 'Add Subject'}
                onClose={() => setModalVisible(false)}
            >
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Name (English)</Text>
                    <TextInput
                        style={styles.input}
                        value={formName}
                        onChangeText={setFormName}
                        placeholder="e.g. Mathematics"
                        placeholderTextColor={adminColors.textMuted}
                    />
                </View>
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Name (Gujarati)</Text>
                    <TextInput
                        style={styles.input}
                        value={formNameGu}
                        onChangeText={setFormNameGu}
                        placeholder="e.g. ગણિત"
                        placeholderTextColor={adminColors.textMuted}
                    />
                </View>
                <View style={styles.formRow}>
                    <View style={styles.formHalf}>
                        <Text style={styles.label}>Standard ID</Text>
                        <TextInput
                            style={styles.input}
                            value={formStandardId}
                            onChangeText={setFormStandardId}
                            keyboardType="number-pad"
                            placeholderTextColor={adminColors.textMuted}
                        />
                    </View>
                    <View style={styles.formHalf}>
                        <Text style={styles.label}>Session</Text>
                        <TextInput
                            style={styles.input}
                            value={formSession}
                            onChangeText={setFormSession}
                            keyboardType="number-pad"
                            placeholderTextColor={adminColors.textMuted}
                        />
                    </View>
                </View>
                <View style={styles.formRow}>
                    <View style={styles.formHalf}>
                        <Text style={styles.label}>Icon (Emoji)</Text>
                        <TextInput
                            style={styles.input}
                            value={formIcon}
                            onChangeText={setFormIcon}
                            placeholderTextColor={adminColors.textMuted}
                        />
                    </View>
                </View>
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Order</Text>
                    <TextInput
                        style={styles.input}
                        value={formOrder}
                        onChangeText={setFormOrder}
                        keyboardType="number-pad"
                        placeholderTextColor={adminColors.textMuted}
                    />
                </View>
                <TouchableOpacity
                    style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <Text style={styles.saveButtonText}>
                            {editingSubject ? 'Update Subject' : 'Create Subject'}
                        </Text>
                    )}
                </TouchableOpacity>
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
    loadingText: {
        marginTop: spacing.lg,
        fontSize: typography.size.md,
        color: adminColors.textSecondary,
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
    subjectCard: {
        backgroundColor: adminColors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: adminColors.border,
    },
    subjectCardTablet: {
        flex: 1,
        marginHorizontal: spacing.xs,
    },
    subjectCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    subjectIcon: {
        fontSize: 32,
        marginRight: spacing.md,
    },
    subjectInfo: {
        flex: 1,
    },
    subjectName: {
        fontSize: typography.size.lg,
        fontWeight: typography.weight.semibold,
        color: adminColors.textPrimary,
    },
    subjectNameGu: {
        fontSize: typography.size.sm,
        color: adminColors.textSecondary,
        marginTop: spacing.xxs,
    },
    subjectMeta: {
        fontSize: typography.size.xs,
        color: adminColors.textMuted,
        marginTop: spacing.xs,
    },
    subjectActions: {
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
    chaptersBtn: {
        backgroundColor: adminColors.accent + '20',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.sm,
    },
    chaptersBtnText: {
        fontSize: typography.size.sm,
        color: adminColors.accent,
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
        marginBottom: spacing.xs,
    },
    emptyMsg: {
        fontSize: typography.size.md,
        color: adminColors.textMuted,
    },
    formGroup: {
        marginBottom: spacing.lg,
    },
    formRow: {
        flexDirection: 'row',
        gap: spacing.md,
        marginBottom: spacing.lg,
    },
    formHalf: {
        flex: 1,
    },
    label: {
        fontSize: typography.size.sm,
        fontWeight: typography.weight.semibold,
        color: adminColors.textSecondary,
        marginBottom: spacing.xs,
    },
    input: {
        backgroundColor: adminColors.surfaceElevated,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        fontSize: typography.size.md,
        color: adminColors.textPrimary,
        borderWidth: 1,
        borderColor: adminColors.border,
    },
    saveButton: {
        backgroundColor: adminColors.primary,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.md,
        alignItems: 'center',
        marginTop: spacing.sm,
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        fontSize: typography.size.md,
        fontWeight: typography.weight.bold,
        color: '#FFFFFF',
    },
});
