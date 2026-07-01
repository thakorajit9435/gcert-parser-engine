import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert, ActivityIndicator, TextInput } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { adminColors, typography, spacing, borderRadius } from '../../theme';
import { Modal } from '../../components/common/Modal';
import { COLLECTIONS } from '../../constants';
// We use any for Session definition locally or import from types if available
import { Session } from '../../types';

export function ManageSessionsScreen(): React.JSX.Element {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingSession, setEditingSession] = useState<Session | null>(null);
    const [saving, setSaving] = useState(false);

    const [formStandardId, setFormStandardId] = useState('6');
    const [formSession, setFormSession] = useState('1');
    const [formType, setFormType] = useState('textbook');
    const [formTitle, setFormTitle] = useState('');
    const [formOrder, setFormOrder] = useState('1');

    const fetchSessions = useCallback(async () => {
        try {
            const snapshot = await firestore()
                .collection(COLLECTIONS.SESSIONS)
                .where('isDeleted', '==', false)
                .get();

            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Session[];
            data.sort((a, b) => (a.order || 0) - (b.order || 0));
            setSessions(data);
        } catch (err) {
            Alert.alert('Error', (err as Error).message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchSessions();
    }, [fetchSessions]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchSessions();
    }, [fetchSessions]);

    const openAddModal = useCallback(() => {
        setEditingSession(null);
        setFormStandardId('6');
        setFormSession('1');
        setFormType('textbook');
        setFormTitle('');
        setFormOrder(String(sessions.length + 1));
        setModalVisible(true);
    }, [sessions.length]);

    const openEditModal = useCallback((session: Session) => {
        setEditingSession(session);
        setFormStandardId(session.standardId);
        setFormSession(session.session);
        setFormType(session.type);
        setFormTitle(session.title || '');
        setFormOrder(String(session.order));
        setModalVisible(true);
    }, []);

    const handleSave = useCallback(async () => {
        if (!formStandardId || !formSession || !formType) {
            Alert.alert('Validation', 'Standard, Session, and Type are required.');
            return;
        }

        setSaving(true);
        try {
            const docData = {
                standardId: formStandardId.trim(),
                session: formSession.trim(),
                type: formType.trim() as any,
                title: formTitle.trim(),
                order: parseInt(formOrder, 10) || 1,
                updatedAt: firestore.FieldValue.serverTimestamp(),
            };

            if (editingSession) {
                await firestore().collection(COLLECTIONS.SESSIONS).doc(editingSession.id).update(docData);
                Alert.alert('Success', 'Session updated!');
            } else {
                await firestore().collection(COLLECTIONS.SESSIONS).add({
                    ...docData,
                    isDeleted: false,
                    createdAt: firestore.FieldValue.serverTimestamp(),
                });
                Alert.alert('Success', 'Session created!');
            }
            setModalVisible(false);
            fetchSessions();
        } catch (err) {
            Alert.alert('Error', (err as Error).message);
        } finally {
            setSaving(false);
        }
    }, [editingSession, formStandardId, formSession, formType, formTitle, formOrder, fetchSessions]);

    const handleDelete = useCallback((session: Session) => {
        Alert.alert(
            'Delete Session',
            'Are you sure you want to delete this session item?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await firestore().collection(COLLECTIONS.SESSIONS).doc(session.id).update({
                                isDeleted: true,
                                updatedAt: firestore.FieldValue.serverTimestamp(),
                            });
                            Alert.alert('Deleted', 'Session configuration deleted.');
                            fetchSessions();
                        } catch (err) {
                            Alert.alert('Error', (err as Error).message);
                        }
                    },
                },
            ]
        );
    }, [fetchSessions]);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Manage Sessions</Text>
                <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
                    <Text style={styles.addButtonText}>+ Add Session</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={adminColors.primary} style={styles.centered} />
            ) : (
                <FlatList
                    data={sessions}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardTitle}>{item.title || item.type.toUpperCase()}</Text>
                                <Text style={styles.cardMeta}>Std {item.standardId} | Sem {item.session} | Order {item.order}</Text>
                            </View>
                            <View style={styles.cardActions}>
                                <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(item)}>
                                    <Text style={styles.btnText}>Edit</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
                                    <Text style={[styles.btnText, styles.deleteBtnText]}>Delete</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Text style={styles.emptyIcon}>📚</Text>
                            <Text style={styles.emptyTitle}>No Sessions Found</Text>
                        </View>
                    }
                />
            )}

            <Modal visible={modalVisible} title={editingSession ? 'Edit Session' : 'Add Session'} onClose={() => setModalVisible(false)}>
                <Text style={styles.label}>Standard ID (e.g. "6")</Text>
                <TextInput style={styles.input} value={formStandardId} onChangeText={setFormStandardId} />

                <Text style={styles.label}>Session (e.g. "1" or "2")</Text>
                <TextInput style={styles.input} value={formSession} onChangeText={setFormSession} />

                <Text style={styles.label}>Type (textbook, mcq, swadhyay, extra)</Text>
                <TextInput style={styles.input} value={formType} onChangeText={setFormType} />

                <Text style={styles.label}>Title (e.g. "પાઠ્ય પુસ્તક")</Text>
                <TextInput style={styles.input} value={formTitle} onChangeText={setFormTitle} />

                <Text style={styles.label}>Order</Text>
                <TextInput style={styles.input} value={formOrder} onChangeText={setFormOrder} keyboardType="number-pad" />

                <TouchableOpacity style={[styles.saveButton, saving && styles.saveButtonDisabled]} onPress={handleSave} disabled={saving}>
                    {saving ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.saveButtonText}>Save Session</Text>}
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: adminColors.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', justifyContent: 'space-between', padding: spacing.xl },
    title: { fontSize: typography.size.xxl, fontWeight: typography.weight.bold, color: adminColors.textPrimary },
    addButton: { backgroundColor: adminColors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.md },
    addButtonText: { color: '#FFF', fontWeight: typography.weight.bold },
    listContent: { padding: spacing.xl, paddingTop: 0 },
    card: { backgroundColor: adminColors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: adminColors.border },
    cardHeader: { marginBottom: spacing.sm },
    cardTitle: { fontSize: typography.size.lg, fontWeight: typography.weight.semibold, color: adminColors.textPrimary },
    cardMeta: { fontSize: typography.size.sm, color: adminColors.textSecondary, marginTop: spacing.xxs },
    cardActions: { flexDirection: 'row', gap: spacing.sm },
    editBtn: { backgroundColor: adminColors.primary + '20', padding: spacing.sm, borderRadius: borderRadius.sm },
    deleteBtn: { backgroundColor: adminColors.error + '20', padding: spacing.sm, borderRadius: borderRadius.sm },
    btnText: { color: adminColors.primary, fontWeight: typography.weight.semibold },
    deleteBtnText: { color: adminColors.error },
    empty: { alignItems: 'center', marginVertical: spacing.huge },
    emptyIcon: { fontSize: 48, marginBottom: spacing.sm },
    emptyTitle: { fontSize: typography.size.lg, color: adminColors.textPrimary },
    input: { backgroundColor: adminColors.surfaceElevated, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.lg, borderWidth: 1, borderColor: adminColors.border },
    label: { fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: adminColors.textSecondary, marginBottom: spacing.xs },
    saveButton: { backgroundColor: adminColors.primary, padding: spacing.md, borderRadius: borderRadius.md, alignItems: 'center' },
    saveButtonDisabled: { opacity: 0.6 },
    saveButtonText: { color: '#FFF', fontWeight: typography.weight.bold },
});
