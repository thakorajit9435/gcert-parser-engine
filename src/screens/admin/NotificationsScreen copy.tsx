/**
 * Admin Notifications Screen
 *
 * Features:
 * - List all sent notifications (paginated)
 * - Create & send new notification (All / Standard / Individual)
 * - Standard dropdown when type = 'standard'
 * - User search when type = 'individual'
 * - Calls Cloud Function via notifications.service → delivers FCM push
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    RefreshControl,
    Alert,
    TouchableOpacity,
    ScrollView,
    Modal,
    TextInput as RNTextInput,
    ActivityIndicator,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { adminColors, typography, spacing, borderRadius } from '../../theme';
import { LoadingState, EmptyState, Button, Badge, Pagination } from '../../components/common';
import { TextInput } from '../../components/common/TextInput';
import { useAuth } from '../../hooks/useAuth';
import * as NotifService from '../../services/firebase/notifications.service';
import { logAuditAction } from '../../services/logging/audit.service';
import { AppNotification } from '../../types';
import { DEFAULT_PAGE_SIZE, COLLECTIONS, MIN_STANDARD, MAX_STANDARD } from '../../constants';
import { formatDateTime } from '../../utils';
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

// ─── Types ───────────────────────────────────────────────────────

type TargetType = 'all' | 'standard' | 'individual';

interface UserOption {
    uid: string;
    name: string;
    email: string;
    standard: number | null;
}

// ─── Constants ───────────────────────────────────────────────────

const STANDARDS = Array.from({ length: MAX_STANDARD - MIN_STANDARD + 1 }, (_, i) => i + MIN_STANDARD);

const TARGET_OPTIONS: { key: TargetType; label: string; emoji: string; desc: string }[] = [
    { key: 'all', label: 'All Students', emoji: '📢', desc: 'Send to everyone' },
    { key: 'standard', label: 'Standard', emoji: '🎓', desc: 'Filter by class standard' },
    { key: 'individual', label: 'Individual', emoji: '👤', desc: 'One specific student' },
];

// ─── Component ───────────────────────────────────────────────────

export function NotificationsScreen(): React.JSX.Element {
    const { userProfile } = useAuth();

    // List state
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [lastDoc, setLastDoc] = useState<FirebaseFirestoreTypes.QueryDocumentSnapshot | null>(null);

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [targetType, setTargetType] = useState<TargetType>('all');
    const [targetStandard, setTargetStandard] = useState<number | null>(null);
    const [showStandardPicker, setShowStandardPicker] = useState(false);

    // Individual user search
    const [userSearch, setUserSearch] = useState('');
    const [searchResults, setSearchResults] = useState<UserOption[]>([]);
    const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
    const [searchLoading, setSearchLoading] = useState(false);

    // ── Data Loading ─────────────────────────────────────────────

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
        if (!hasMore || loadingMore) {return;}
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

    // ── User Search ───────────────────────────────────────────────

    useEffect(() => {
        if (targetType !== 'individual') {return;}
        if (!userSearch.trim()) {
            setSearchResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setSearchLoading(true);
            try {
                const snap = await firestore()
                    .collection(COLLECTIONS.USERS)
                    .where('role', '==', 'student')
                    .orderBy('name')
                    .startAt(userSearch)
                    .endAt(userSearch + '\uf8ff')
                    .limit(10)
                    .get();

                const results: UserOption[] = snap.docs.map(doc => ({
                    uid: doc.id,
                    name: doc.data().name ?? '',
                    email: doc.data().email ?? '',
                    standard: doc.data().standard ?? null,
                }));
                setSearchResults(results);
            } catch {
                setSearchResults([]);
            } finally {
                setSearchLoading(false);
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [userSearch, targetType]);

    // ── Send Notification ─────────────────────────────────────────

    const handleSend = async (): Promise<void> => {
        if (!title.trim()) {
            Alert.alert('Missing Title', 'Please enter a notification title.');
            return;
        }
        if (!message.trim()) {
            Alert.alert('Missing Message', 'Please enter a notification message.');
            return;
        }
        if (targetType === 'standard' && !targetStandard) {
            Alert.alert('Select Standard', 'Please select a target standard.');
            return;
        }
        if (targetType === 'individual' && !selectedUser) {
            Alert.alert('Select User', 'Please search and select a target student.');
            return;
        }
        if (!userProfile) {return;}

        setFormLoading(true);
        try {
            const result = await NotifService.createAndSendNotification({
                title: title.trim(),
                message: message.trim(),
                targetType,
                targetStandard: targetType === 'standard' ? targetStandard : null,
                targetUserId: targetType === 'individual' ? selectedUser?.uid ?? null : null,
                createdBy: userProfile.uid,
            });

            if (result.success) {
                await logAuditAction({
                    action: 'notification_sent',
                    performedBy: userProfile.uid,
                    performedByName: userProfile.name,
                    metadata: { title: title.trim(), targetType, targetStandard, targetUserId: selectedUser?.uid },
                });
                resetForm();
                loadNotifications();
                Alert.alert('✅ Sent', 'Notification has been sent successfully.');
            } else {
                Alert.alert('Error', result.error ?? 'Failed to send notification.');
            }
        } catch (err) {
            Alert.alert('Error', (err as Error).message);
        } finally {
            setFormLoading(false);
        }
    };

    const resetForm = () => {
        setTitle('');
        setMessage('');
        setTargetType('all');
        setTargetStandard(null);
        setSelectedUser(null);
        setUserSearch('');
        setSearchResults([]);
        setShowForm(false);
    };

    // ── Render Helpers ────────────────────────────────────────────

    const getTargetBadge = (type: string): 'info' | 'warning' | 'premium' => {
        switch (type) {
            case 'premium': return 'premium';
            case 'standard': return 'warning';
            default: return 'info';
        }
    };

    const getTargetLabel = (item: AppNotification): string => {
        if (item.targetType === 'standard') {return `Std ${(item as any).targetStandard ?? '?'}`;}
        if (item.targetType === 'individual') {return 'Individual';}
        return 'All';
    };

    const renderItem = ({ item }: { item: AppNotification }): React.JSX.Element => (
        <View style={styles.notifCard}>
            <View style={styles.notifHeader}>
                <Text style={styles.notifTitle} numberOfLines={1}>{item.title}</Text>
                <Badge label={getTargetLabel(item)} variant={getTargetBadge(item.targetType)} />
            </View>
            <Text style={styles.notifMessage} numberOfLines={2}>{item.message}</Text>
            <View style={styles.notifFooter}>
                <Text style={styles.notifMeta}>{formatDateTime(item.createdAt, 'en-IN')}</Text>
                {item.isSent
                    ? <Badge label="✓ Sent" variant="success" />
                    : <Badge label="Pending" variant="warning" />}
            </View>
        </View>
    );

    // ── Main Render ───────────────────────────────────────────────

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>🔔 Notifications</Text>
                    <Text style={styles.headerSubtitle}>{notifications.length} notifications</Text>
                </View>
                <Button title="+ Create" onPress={() => setShowForm(true)} size="sm" />
            </View>

            {/* List */}
            {loading ? (
                <LoadingState message="Loading notifications…" />
            ) : notifications.length === 0 ? (
                <EmptyState
                    icon="🔔"
                    title="No Notifications"
                    message="Create your first notification."
                    actionLabel="Create"
                    onAction={() => setShowForm(true)}
                />
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={loading}
                            onRefresh={loadNotifications}
                            tintColor={adminColors.primary}
                        />
                    }
                    ListFooterComponent={
                        <Pagination
                            hasMore={hasMore}
                            loadingMore={loadingMore}
                            onLoadMore={loadMore}
                            totalShown={notifications.length}
                        />
                    }
                />
            )}

            {/* ── Create Notification Modal ── */}
            <Modal
                visible={showForm}
                animationType="slide"
                transparent
                onRequestClose={resetForm}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        {/* Modal Header */}
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>📤 Create Notification</Text>
                            <TouchableOpacity onPress={resetForm} style={styles.closeBtn}>
                                <Text style={styles.closeBtnText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                            {/* Title */}
                            <TextInput
                                label="Title *"
                                value={title}
                                onChangeText={setTitle}
                                placeholder="Notification title"
                            />

                            {/* Message */}
                            <TextInput
                                label="Message *"
                                value={message}
                                onChangeText={setMessage}
                                placeholder="Notification message…"
                                multiline
                                numberOfLines={4}
                            />

                            {/* Target Type */}
                            <Text style={styles.sectionLabel}>Target Audience</Text>
                            <View style={styles.targetGrid}>
                                {TARGET_OPTIONS.map(opt => (
                                    <TouchableOpacity
                                        key={opt.key}
                                        style={[
                                            styles.targetCard,
                                            targetType === opt.key && styles.targetCardActive,
                                        ]}
                                        onPress={() => {
                                            setTargetType(opt.key);
                                            setTargetStandard(null);
                                            setSelectedUser(null);
                                            setUserSearch('');
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.targetEmoji}>{opt.emoji}</Text>
                                        <Text style={[
                                            styles.targetLabel,
                                            targetType === opt.key && styles.targetLabelActive,
                                        ]}>
                                            {opt.label}
                                        </Text>
                                        <Text style={styles.targetDesc}>{opt.desc}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Standard Picker */}
                            {targetType === 'standard' && (
                                <View style={styles.conditionalField}>
                                    <Text style={styles.sectionLabel}>Select Standard *</Text>
                                    <TouchableOpacity
                                        style={styles.pickerButton}
                                        onPress={() => setShowStandardPicker(true)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[
                                            styles.pickerButtonText,
                                            !targetStandard && styles.pickerPlaceholder,
                                        ]}>
                                            {targetStandard ? `Standard ${targetStandard}` : 'Tap to select standard…'}
                                        </Text>
                                        <Text style={styles.pickerArrow}>▾</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Individual User Search */}
                            {targetType === 'individual' && (
                                <View style={styles.conditionalField}>
                                    <Text style={styles.sectionLabel}>Search Student *</Text>
                                    <RNTextInput
                                        style={styles.searchInput}
                                        value={userSearch}
                                        onChangeText={text => {
                                            setUserSearch(text);
                                            setSelectedUser(null);
                                        }}
                                        placeholder="Search by name…"
                                        placeholderTextColor={adminColors.textMuted}
                                    />
                                    {searchLoading && (
                                        <ActivityIndicator style={styles.searchLoader} color={adminColors.primary} />
                                    )}
                                    {searchResults.length > 0 && !selectedUser && (
                                        <View style={styles.searchDropdown}>
                                            {searchResults.map(u => (
                                                <TouchableOpacity
                                                    key={u.uid}
                                                    style={styles.searchResultItem}
                                                    onPress={() => {
                                                        setSelectedUser(u);
                                                        setUserSearch(u.name);
                                                        setSearchResults([]);
                                                    }}
                                                    activeOpacity={0.7}
                                                >
                                                    <Text style={styles.searchResultName}>{u.name}</Text>
                                                    <Text style={styles.searchResultMeta}>
                                                        {u.email} {u.standard ? `· Std ${u.standard}` : ''}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}
                                    {selectedUser && (
                                        <View style={styles.selectedUserBadge}>
                                            <Text style={styles.selectedUserText}>
                                                ✓ {selectedUser.name} ({selectedUser.email})
                                            </Text>
                                            <TouchableOpacity onPress={() => {
                                                setSelectedUser(null);
                                                setUserSearch('');
                                            }}>
                                                <Text style={styles.clearUser}>✕</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            )}

                            {/* Send Button */}
                            <TouchableOpacity
                                style={[styles.sendButton, formLoading && styles.sendButtonDisabled]}
                                onPress={handleSend}
                                disabled={formLoading}
                                activeOpacity={0.85}
                            >
                                {formLoading ? (
                                    <ActivityIndicator color="#1A1A2E" />
                                ) : (
                                    <Text style={styles.sendButtonText}>📤 Send Notification</Text>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Standard Picker Modal */}
            <Modal
                visible={showStandardPicker}
                animationType="fade"
                transparent
                onRequestClose={() => setShowStandardPicker(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowStandardPicker(false)}
                >
                    <View style={styles.standardPickerCard}>
                        <Text style={styles.modalTitle}>Select Standard</Text>
                        <View style={styles.standardGrid}>
                            {STANDARDS.map(std => (
                                <TouchableOpacity
                                    key={std}
                                    style={[
                                        styles.standardChip,
                                        targetStandard === std && styles.standardChipActive,
                                    ]}
                                    onPress={() => {
                                        setTargetStandard(std);
                                        setShowStandardPicker(false);
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[
                                        styles.standardChipText,
                                        targetStandard === std && styles.standardChipTextActive,
                                    ]}>
                                        {std}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

// ─── Styles ──────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: adminColors.background },

    // Header
    header: {
        padding: spacing.xl,
        paddingBottom: spacing.md,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: typography.size.xxl,
        fontWeight: typography.weight.bold,
        color: adminColors.textPrimary,
    },
    headerSubtitle: {
        fontSize: typography.size.sm,
        color: adminColors.textMuted,
        marginTop: spacing.xxs,
    },

    // List
    listContent: { padding: spacing.xl, paddingTop: 0 },
    notifCard: {
        backgroundColor: adminColors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: adminColors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    notifHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
        gap: spacing.sm,
    },
    notifTitle: {
        fontSize: typography.size.lg,
        fontWeight: typography.weight.semibold,
        color: adminColors.textPrimary,
        flex: 1,
    },
    notifMessage: {
        fontSize: typography.size.md,
        color: adminColors.textSecondary,
        lineHeight: typography.lineHeight.lg,
    },
    notifFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: spacing.md,
    },
    notifMeta: { fontSize: typography.size.sm, color: adminColors.textMuted },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.55)',
        justifyContent: 'flex-end',
    },
    modalCard: {
        backgroundColor: adminColors.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: spacing.xl,
        maxHeight: '92%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    modalTitle: {
        fontSize: typography.size.xl,
        fontWeight: typography.weight.bold,
        color: adminColors.textPrimary,
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: adminColors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeBtnText: {
        fontSize: 14,
        color: adminColors.textSecondary,
    },

    // Section label
    sectionLabel: {
        fontSize: typography.size.sm,
        fontWeight: typography.weight.semibold,
        color: adminColors.textSecondary,
        marginBottom: spacing.sm,
        marginTop: spacing.md,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },

    // Target type cards
    targetGrid: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    targetCard: {
        flex: 1,
        backgroundColor: adminColors.background,
        borderRadius: borderRadius.md,
        borderWidth: 1.5,
        borderColor: adminColors.border,
        padding: spacing.md,
        alignItems: 'center',
    },
    targetCardActive: {
        borderColor: adminColors.primary,
        backgroundColor: `${adminColors.primary}18`,
    },
    targetEmoji: { fontSize: 22, marginBottom: spacing.xs },
    targetLabel: {
        fontSize: typography.size.xs,
        fontWeight: typography.weight.semibold,
        color: adminColors.textSecondary,
        textAlign: 'center',
    },
    targetLabelActive: { color: adminColors.primary },
    targetDesc: {
        fontSize: 9,
        color: adminColors.textMuted,
        textAlign: 'center',
        marginTop: 2,
    },

    // Conditional fields
    conditionalField: {
        marginTop: spacing.sm,
    },

    // Standard picker
    pickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1.5,
        borderColor: adminColors.border,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        backgroundColor: adminColors.background,
    },
    pickerButtonText: {
        fontSize: typography.size.md,
        color: adminColors.textPrimary,
        fontWeight: typography.weight.medium,
    },
    pickerPlaceholder: { color: adminColors.textMuted },
    pickerArrow: { fontSize: 16, color: adminColors.textMuted },

    // Standard chip grid
    standardPickerCard: {
        backgroundColor: adminColors.surface,
        borderRadius: 20,
        padding: spacing.xl,
        margin: spacing.xl,
    },
    standardGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        marginTop: spacing.lg,
    },
    standardChip: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 1.5,
        borderColor: adminColors.border,
        backgroundColor: adminColors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    standardChipActive: {
        backgroundColor: adminColors.primary,
        borderColor: adminColors.primary,
    },
    standardChipText: {
        fontSize: typography.size.lg,
        fontWeight: typography.weight.bold,
        color: adminColors.textPrimary,
    },
    standardChipTextActive: { color: '#1A1A2E' },

    // User search
    searchInput: {
        borderWidth: 1.5,
        borderColor: adminColors.border,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        fontSize: typography.size.md,
        color: adminColors.textPrimary,
        backgroundColor: adminColors.background,
    },
    searchLoader: { marginTop: spacing.sm },
    searchDropdown: {
        borderWidth: 1,
        borderColor: adminColors.border,
        borderRadius: borderRadius.md,
        backgroundColor: adminColors.surface,
        marginTop: spacing.xs,
        overflow: 'hidden',
    },
    searchResultItem: {
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: adminColors.border,
    },
    searchResultName: {
        fontSize: typography.size.md,
        fontWeight: typography.weight.semibold,
        color: adminColors.textPrimary,
    },
    searchResultMeta: {
        fontSize: typography.size.sm,
        color: adminColors.textMuted,
        marginTop: 2,
    },
    selectedUserBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: `${adminColors.primary}20`,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginTop: spacing.sm,
    },
    selectedUserText: {
        fontSize: typography.size.sm,
        color: adminColors.textPrimary,
        flex: 1,
        fontWeight: typography.weight.medium,
    },
    clearUser: {
        fontSize: 14,
        color: adminColors.textMuted,
        marginLeft: spacing.sm,
    },

    // Send button
    sendButton: {
        backgroundColor: adminColors.primary,
        borderRadius: borderRadius.lg,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: spacing.xl,
        marginBottom: spacing.lg,
        shadowColor: adminColors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 6,
    },
    sendButtonDisabled: { opacity: 0.6 },
    sendButtonText: {
        fontSize: typography.size.lg,
        fontWeight: typography.weight.bold,
        color: '#1A1A2E',
        letterSpacing: 0.3,
    },
});
