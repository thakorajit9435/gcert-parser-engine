/**
 * Student Notification Inbox Screen
 *
 * Shows real-time notifications relevant to the logged-in student:
 *   - All Users notifications
 *   - Standard-specific (their standard)
 *   - Individual (targeted directly to them)
 *
 * Features:
 *   - Real-time via onSnapshot
 *   - Read / Unread state (blue dot indicator)
 *   - Mark as read on tap
 *   - Empty state
 *   - Card layout matching app theme
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { useAuthContext } from '../../context/AuthContext';
import {
    subscribeToUserNotifications,
    subscribeToReadStatus,
    markNotificationRead,
} from '../../services/firebase/notifications.service';
import { AppNotification } from '../../types';
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

// ─── Design Tokens ──────────────────────────────────────────────

const C = {
    primary: '#FFD54F',
    secondary: '#1976D2',
    background: '#F8F9FA',
    surface: '#FFFFFF',
    textPrimary: '#1A1A2E',
    textSecondary: '#555577',
    textMuted: '#94A3B8',
    border: '#E2E8F0',
    unread: '#3B82F6',
    unreadBg: '#EFF6FF',
    success: '#10B981',
    shadow: 'rgba(25, 118, 210, 0.10)',
};

// ─── Helpers ────────────────────────────────────────────────────

function formatRelativeTime(timestamp: FirebaseFirestoreTypes.Timestamp | null | undefined): string {
    if (!timestamp) return '';
    try {
        const date = timestamp.toDate();
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    } catch {
        return '';
    }
}

function getTypeEmoji(targetType: string): string {
    switch (targetType) {
        case 'all': return '📢';
        case 'standard': return '🎓';
        case 'individual': return '👤';
        case 'premium': return '💎';
        default: return '🔔';
    }
}

// ─── Component ──────────────────────────────────────────────────

export function StudentNotificationsScreen(): React.JSX.Element {
    const { user, userData } = useAuthContext();

    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [readIds, setReadIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [markingRead, setMarkingRead] = useState<string | null>(null);

    const uid = user?.uid ?? '';
    const standard = userData?.standard ?? null;

    // ── Real-time notifications subscription ─────────────────────
    useEffect(() => {
        if (!uid) return;

        setLoading(true);
        const unsub = subscribeToUserNotifications(uid, standard, (notifs) => {
            setNotifications(notifs);
            setLoading(false);
            setRefreshing(false);
        });

        return () => unsub();
    }, [uid, standard]);

    // ── Real-time read status subscription ───────────────────────
    useEffect(() => {
        if (!uid || notifications.length === 0) return;

        const ids = notifications.map(n => n.id);
        const unsub = subscribeToReadStatus(uid, ids, (newReadIds) => {
            setReadIds(newReadIds);
        });

        return () => unsub();
    }, [uid, notifications]);

    // ── Mark as read ─────────────────────────────────────────────
    const handleTap = useCallback(async (notif: AppNotification) => {
        if (!uid || readIds.has(notif.id)) return;

        setMarkingRead(notif.id);
        await markNotificationRead(notif.id, uid);
        setMarkingRead(null);
    }, [uid, readIds]);

    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        // onSnapshot will update automatically; we just reset state
        // and let the existing subscription fire again.
        // For a manual refresh, we briefly show refreshing indicator.
        setTimeout(() => setRefreshing(false), 1000);
    }, []);

    // ── Unread count ─────────────────────────────────────────────
    const unreadCount = notifications.filter(n => !readIds.has(n.id)).length;

    // ── Render Item ─────────────────────────────────────────────
    const renderItem = ({ item }: { item: AppNotification }) => {
        const isRead = readIds.has(item.id);
        const isMarking = markingRead === item.id;

        return (
            <TouchableOpacity
                style={[styles.card, !isRead && styles.cardUnread]}
                onPress={() => handleTap(item)}
                activeOpacity={0.75}
            >
                {/* Unread dot */}
                {!isRead && <View style={styles.unreadDot} />}

                <View style={styles.cardContent}>
                    {/* Top row: emoji + title + time */}
                    <View style={styles.cardHeader}>
                        <Text style={styles.typeEmoji}>{getTypeEmoji(item.targetType)}</Text>
                        <Text style={[styles.cardTitle, !isRead && styles.cardTitleUnread]} numberOfLines={1}>
                            {item.title}
                        </Text>
                        {isMarking ? (
                            <ActivityIndicator size="small" color={C.unread} style={styles.markingIndicator} />
                        ) : (
                            <Text style={styles.timeText}>
                                {formatRelativeTime(item.createdAt)}
                            </Text>
                        )}
                    </View>

                    {/* Message */}
                    <Text style={styles.cardMessage} numberOfLines={3}>
                        {item.message}
                    </Text>

                    {/* Footer */}
                    <View style={styles.cardFooter}>
                        <View style={[
                            styles.typeBadge,
                            item.targetType === 'individual' && styles.typeBadgeIndividual,
                            item.targetType === 'standard' && styles.typeBadgeStandard,
                        ]}>
                            <Text style={styles.typeBadgeText}>
                                {item.targetType === 'all' ? 'General'
                                    : item.targetType === 'standard' ? `Std ${(item as any).targetStandard ?? ''}`
                                    : item.targetType === 'individual' ? 'Personal'
                                    : item.targetType}
                            </Text>
                        </View>
                        {isRead && <Text style={styles.readText}>✓ Read</Text>}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    // ── Empty State ──────────────────────────────────────────────
    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🔔</Text>
            <Text style={styles.emptyTitle}>No Notifications Yet</Text>
            <Text style={styles.emptySubtitle}>
                When your school sends announcements, they'll appear here.
            </Text>
        </View>
    );

    // ── Main Render ──────────────────────────────────────────────
    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={C.background} />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>🔔 Notifications</Text>
                    {unreadCount > 0 && (
                        <Text style={styles.unreadBanner}>
                            {unreadCount} unread
                        </Text>
                    )}
                </View>
                {unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                        <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
                    </View>
                )}
            </View>

            {/* Content */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={C.secondary} />
                    <Text style={styles.loadingText}>Loading notifications…</Text>
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={[
                        styles.listContent,
                        notifications.length === 0 && styles.listEmpty,
                    ]}
                    ListEmptyComponent={renderEmpty}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor={C.secondary}
                        />
                    }
                    showsVerticalScrollIndicator={false}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                />
            )}
        </SafeAreaView>
    );
}

// ─── Styles ─────────────────────────────────────────────────────

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: C.background },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: C.surface,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: C.textPrimary,
    },
    unreadBanner: {
        fontSize: 12,
        color: C.unread,
        fontWeight: '600',
        marginTop: 2,
    },
    unreadBadge: {
        backgroundColor: C.unread,
        borderRadius: 12,
        minWidth: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 6,
    },
    unreadBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },

    // Loading
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    loadingText: {
        fontSize: 14,
        color: C.textMuted,
    },

    // List
    listContent: {
        padding: 16,
        paddingTop: 12,
    },
    listEmpty: {
        flex: 1,
    },
    separator: { height: 10 },

    // Notification Card
    card: {
        backgroundColor: C.surface,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: C.border,
        shadowColor: C.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 12,
        elevation: 3,
        flexDirection: 'row',
    },
    cardUnread: {
        borderColor: `${C.unread}40`,
        backgroundColor: C.unreadBg,
    },
    unreadDot: {
        width: 4,
        backgroundColor: C.unread,
        borderTopLeftRadius: 16,
        borderBottomLeftRadius: 16,
    },
    cardContent: {
        flex: 1,
        padding: 14,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    typeEmoji: {
        fontSize: 16,
    },
    cardTitle: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: C.textPrimary,
    },
    cardTitleUnread: {
        fontWeight: '800',
        color: '#0F172A',
    },
    timeText: {
        fontSize: 11,
        color: C.textMuted,
        flexShrink: 0,
    },
    markingIndicator: {
        width: 16,
    },

    cardMessage: {
        fontSize: 13,
        color: C.textSecondary,
        lineHeight: 19,
    },

    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8,
    },

    // Type badge
    typeBadge: {
        backgroundColor: '#F1F5F9',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    typeBadgeIndividual: { backgroundColor: '#FEF3C7' },
    typeBadgeStandard: { backgroundColor: '#DCFCE7' },
    typeBadgeText: { fontSize: 10, color: C.textSecondary, fontWeight: '600' },

    readText: {
        fontSize: 11,
        color: C.success,
        fontWeight: '600',
    },

    // Empty State
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
        paddingTop: 60,
    },
    emptyEmoji: { fontSize: 64, marginBottom: 16 },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: C.textPrimary,
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 14,
        color: C.textMuted,
        textAlign: 'center',
        lineHeight: 22,
    },
});
