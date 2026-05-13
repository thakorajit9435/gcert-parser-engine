import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, Alert } from 'react-native';
import { adminColors, typography, spacing, borderRadius } from '../../theme';
import { LoadingState, EmptyState, Button, Badge, Pagination } from '../../components/common';
import { TextInput } from '../../components/common/TextInput';
import { useAuth } from '../../hooks/useAuth';
import * as NotifService from '../../services/firebase/notifications.service';
import { logAuditAction } from '../../services/logging/audit.service';
import { AppNotification, NotificationTargetType } from '../../types';
import { DEFAULT_PAGE_SIZE } from '../../constants';
import { formatDateTime } from '../../utils';
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { Modal } from '../../components/common/Modal';

export function NotificationsScreen(): React.JSX.Element {
    const { userProfile } = useAuth();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [lastDoc, setLastDoc] = useState<FirebaseFirestoreTypes.QueryDocumentSnapshot | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [formLoading, setFormLoading] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [targetType, setTargetType] = useState<NotificationTargetType>('all');

    const loadNotifications = useCallback(async (): Promise<void> => {
        setLoading(true);
        const result = await NotifService.getNotifications(DEFAULT_PAGE_SIZE);
        if (result.success && result.data) {
            setNotifications(result.data.data);
            setLastDoc(result.data.lastDoc);
            setHasMore(result.data.hasMore);
        }
        setLoading(false);
    }, []);

    const loadMore = useCallback(async (): Promise<void> => {
        if (!hasMore || loadingMore) return;
        setLoadingMore(true);
        const result = await NotifService.getNotifications(DEFAULT_PAGE_SIZE, lastDoc);
        if (result.success && result.data) {
            setNotifications(prev => [...prev, ...result.data!.data]);
            setLastDoc(result.data.lastDoc);
            setHasMore(result.data.hasMore);
        }
        setLoadingMore(false);
    }, [hasMore, loadingMore, lastDoc]);

    useEffect(() => { loadNotifications(); }, [loadNotifications]);

    const handleCreate = async (): Promise<void> => {
        if (!title.trim() || !message.trim() || !userProfile) {
            Alert.alert('Validation', 'Title and message are required.');
            return;
        }
        setFormLoading(true);
        const result = await NotifService.createNotification({
            title: title.trim(),
            message: message.trim(),
            targetType,
            createdBy: userProfile.uid,
        });
        if (result.success) {
            await logAuditAction({
                action: 'notification_sent',
                performedBy: userProfile.uid,
                performedByName: userProfile.name,
                metadata: { title, targetType },
            });
            setTitle('');
            setMessage('');
            setShowForm(false);
            loadNotifications();
        }
        setFormLoading(false);
    };

    const getTargetBadge = (type: string): 'info' | 'warning' | 'premium' => {
        switch (type) {
            case 'premium': return 'premium';
            case 'standard': return 'warning';
            default: return 'info';
        }
    };

    const renderItem = ({ item }: { item: AppNotification }): React.JSX.Element => (
        <View style={styles.notifCard}>
            <View style={styles.notifHeader}>
                <Text style={styles.notifTitle}>{item.title}</Text>
                <Badge label={item.targetType} variant={getTargetBadge(item.targetType)} />
            </View>
            <Text style={styles.notifMessage}>{item.message}</Text>
            <View style={styles.notifFooter}>
                <Text style={styles.notifMeta}>{formatDateTime(item.createdAt, 'en-IN')}</Text>
                {item.isSent ? <Badge label="Sent" variant="success" /> : <Badge label="Pending" variant="warning" />}
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>🔔 Notifications</Text>
                    <Text style={styles.headerSubtitle}>{notifications.length} notifications</Text>
                </View>
                <Button title="+ Create" onPress={() => setShowForm(true)} size="sm" />
            </View>

            {loading ? <LoadingState message="Loading notifications…" /> : notifications.length === 0 ? (
                <EmptyState icon="🔔" title="No Notifications" message="Create your first notification." actionLabel="Create" onAction={() => setShowForm(true)} />
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={loading} onRefresh={loadNotifications} tintColor={adminColors.primary} />}
                    ListFooterComponent={<Pagination hasMore={hasMore} loadingMore={loadingMore} onLoadMore={loadMore} totalShown={notifications.length} />}
                />
            )}

            {/* Create Form Modal */}
            <Modal visible={showForm} title="Create Notification" onClose={() => setShowForm(false)}>
                <TextInput label="Title" value={title} onChangeText={setTitle} placeholder="Notification title" />
                <TextInput label="Message" value={message} onChangeText={setMessage} placeholder="Notification message" multiline numberOfLines={3} />
                <View style={styles.targetRow}>
                    {(['all', 'standard', 'premium'] as NotificationTargetType[]).map(t => (
                        <Button
                            key={t}
                            title={t.charAt(0).toUpperCase() + t.slice(1)}
                            variant={targetType === t ? 'primary' : 'secondary'}
                            size="sm"
                            onPress={() => setTargetType(t)}
                        />
                    ))}
                </View>
                <Button title="Send Notification" onPress={handleCreate} loading={formLoading} style={styles.sendButton} />
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: adminColors.background },
    header: { padding: spacing.xl, paddingBottom: spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { fontSize: typography.size.xxl, fontWeight: typography.weight.bold, color: adminColors.textPrimary },
    headerSubtitle: { fontSize: typography.size.sm, color: adminColors.textMuted, marginTop: spacing.xxs },
    listContent: { padding: spacing.xl, paddingTop: 0 },
    notifCard: { backgroundColor: adminColors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: adminColors.border },
    notifHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
    notifTitle: { fontSize: typography.size.lg, fontWeight: typography.weight.semibold, color: adminColors.textPrimary, flex: 1 },
    notifMessage: { fontSize: typography.size.md, color: adminColors.textSecondary, lineHeight: typography.lineHeight.lg },
    notifFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md },
    notifMeta: { fontSize: typography.size.sm, color: adminColors.textMuted },
    targetRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
    sendButton: { marginTop: spacing.sm },
});
