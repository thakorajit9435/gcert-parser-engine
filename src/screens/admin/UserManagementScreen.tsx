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
import { COLLECTIONS } from '../../constants';
import { UserProfile, UserRole } from '../../types';
import { useUserRole } from '../../hooks/useUserRole';
import { setUserBlocked, changeUserRole } from '../../services/firebase/users.service';

const PAGE_SIZE = 10;

export function UserManagementScreen(): React.JSX.Element {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [lastDoc, setLastDoc] = useState<any>(null);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const { isSuperAdmin } = useUserRole();
    const { width } = useWindowDimensions();
    const isTablet = width >= 768;

    const fetchUsers = useCallback(async (reset: boolean = true) => {
        try {
            if (reset) {
                setLoading(true);
            } else {
                setLoadingMore(true);
            }

            let query: any = firestore()
                .collection(COLLECTIONS.USERS)
                .orderBy('createdAt', 'desc')
                .limit(PAGE_SIZE);

            if (!reset && lastDoc) {
                query = query.startAfter(lastDoc);
            }

            const snapshot = await query.get();
            const data = snapshot.docs.map((doc: any) => ({
                uid: doc.id,
                ...doc.data(),
            })) as UserProfile[];

            const newLastDoc = snapshot.docs[snapshot.docs.length - 1] ?? null;
            setHasMore(snapshot.docs.length === PAGE_SIZE);

            if (reset) {
                setUsers(data);
                setFilteredUsers(data);
            } else {
                setUsers((prev) => [...prev, ...data]);
                setFilteredUsers((prev) => [...prev, ...data]);
            }
            setLastDoc(newLastDoc);
        } catch (err) {
            Alert.alert('Error', (err as Error).message);
        } finally {
            setLoading(false);
            setLoadingMore(false);
            setRefreshing(false);
        }
    }, [lastDoc]);

    useEffect(() => {
        fetchUsers(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (searchQuery.trim()) {
            const lower = searchQuery.toLowerCase();
            const filtered = users.filter(
                (u) => u.name.toLowerCase().includes(lower) || (u.phone && u.phone.includes(searchQuery)),
            );
            setFilteredUsers(filtered);
        } else {
            setFilteredUsers(users);
        }
    }, [searchQuery, users]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        setLastDoc(null);
        setHasMore(true);
        await fetchUsers(true);
    }, [fetchUsers]);

    const loadMore = useCallback(async () => {
        if (!hasMore || loadingMore || loading) { return; }
        await fetchUsers(false);
    }, [hasMore, loadingMore, loading, fetchUsers]);

    const handleToggleBlock = useCallback(async (user: UserProfile) => {
        const action = user.isBlocked ? 'unblock' : 'block';
        Alert.alert(
            `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
            `${action} "${user.name || user.uid}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: action.charAt(0).toUpperCase() + action.slice(1),
                    style: user.isBlocked ? 'default' : 'destructive',
                    onPress: async () => {
                        const result = await setUserBlocked(user.uid, !user.isBlocked);
                        if (result.success) {
                            setUsers((prev) =>
                                prev.map((u) => u.uid === user.uid ? { ...u, isBlocked: !u.isBlocked } : u),
                            );
                            Alert.alert('Success', `User ${action}ed.`);
                        } else {
                            Alert.alert('Error', result.error ?? 'Failed.');
                        }
                    },
                },
            ],
        );
    }, []);

    const handleChangeRole = useCallback(async (user: UserProfile) => {
        if (!isSuperAdmin) {
            Alert.alert('Permission Denied', 'Only super admins can change roles.');
            return;
        }

        const roles: UserRole[] = ['student', 'content_admin', 'super_admin'];
        const otherRoles = roles.filter((r) => r !== user.role);

        Alert.alert(
            'Change Role',
            `Current: ${user.role}\nSelect new role:`,
            [
                ...otherRoles.map((role) => ({
                    text: role,
                    onPress: async () => {
                        const result = await changeUserRole(user.uid, role);
                        if (result.success) {
                            setUsers((prev) =>
                                prev.map((u) => u.uid === user.uid ? { ...u, role } : u),
                            );
                            Alert.alert('Success', `Role changed to ${role}.`);
                        } else {
                            Alert.alert('Error', result.error ?? 'Failed.');
                        }
                    },
                })),
                { text: 'Cancel', style: 'cancel' },
            ],
        );
    }, [isSuperAdmin]);

    const getRoleBadgeStyle = (role: UserRole) => {
        switch (role) {
            case 'super_admin': return styles.roleSuperAdmin;
            case 'content_admin': return styles.roleContentAdmin;
            default: return styles.roleStudent;
        }
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={adminColors.primary} />
                <Text style={styles.loadingText}>Loading users…</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Manage Users</Text>
                <Text style={styles.count}>{users.length} loaded</Text>
            </View>

            <View style={styles.searchWrap}>
                <TextInput
                    style={styles.searchInput}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="🔍 Search by name or phone…"
                    placeholderTextColor={adminColors.textMuted}
                />
            </View>

            <FlatList
                data={filteredUsers}
                keyExtractor={(item) => item.uid}
                contentContainerStyle={styles.listContent}
                initialNumToRender={10}
                maxToRenderPerBatch={8}
                windowSize={5}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={adminColors.primary} />
                }
                onEndReached={loadMore}
                onEndReachedThreshold={0.3}
                ListFooterComponent={
                    loadingMore ? (
                        <ActivityIndicator size="small" color={adminColors.primary} style={styles.footerLoader} />
                    ) : hasMore ? (
                        <TouchableOpacity style={styles.loadMoreBtn} onPress={loadMore}>
                            <Text style={styles.loadMoreText}>Load More</Text>
                        </TouchableOpacity>
                    ) : null
                }
                renderItem={({ item }) => (
                    <View style={[styles.userCard, isTablet && styles.userCardTablet]}>
                        <View style={styles.userHeader}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>
                                    {(item.name || 'U').charAt(0).toUpperCase()}
                                </Text>
                            </View>
                            <View style={styles.userInfo}>
                                <Text style={styles.userName}>{item.name || 'No Name'}</Text>
                                <Text style={styles.userPhone}>{item.phone || 'No phone'}</Text>
                            </View>
                            <View style={[styles.roleBadge, getRoleBadgeStyle(item.role)]}>
                                <Text style={styles.roleBadgeText}>{item.role}</Text>
                            </View>
                        </View>

                        <View style={styles.userMeta}>
                            <Text style={styles.metaText}>Std {item.standard}</Text>
                            <Text style={styles.metaText}>🏆 {item.points} pts</Text>
                            <Text style={styles.metaText}>🔥 {item.streak}</Text>
                            {item.premium && <Text style={styles.metaText}>💎 Premium</Text>}
                            {item.isBlocked && <Text style={styles.blockedText}>🚫 Blocked</Text>}
                        </View>

                        <View style={styles.userActions}>
                            <TouchableOpacity
                                style={[styles.actionBtn, item.isBlocked ? styles.unblockBtn : styles.blockBtn]}
                                onPress={() => handleToggleBlock(item)}
                            >
                                <Text style={[styles.actionBtnText, item.isBlocked ? styles.unblockText : styles.blockText]}>
                                    {item.isBlocked ? 'Unblock' : 'Block'}
                                </Text>
                            </TouchableOpacity>
                            {isSuperAdmin && (
                                <TouchableOpacity style={styles.roleBtn} onPress={() => handleChangeRole(item)}>
                                    <Text style={styles.roleBtnText}>Change Role</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyIcon}>👥</Text>
                        <Text style={styles.emptyTitle}>No Users Found</Text>
                        <Text style={styles.emptyMsg}>
                            {searchQuery ? 'Try a different search.' : 'No users registered yet.'}
                        </Text>
                    </View>
                }
            />
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
        paddingBottom: spacing.sm,
    },
    title: {
        fontSize: typography.size.xxl,
        fontWeight: typography.weight.bold,
        color: adminColors.textPrimary,
    },
    count: {
        fontSize: typography.size.sm,
        color: adminColors.textMuted,
    },
    searchWrap: {
        paddingHorizontal: spacing.xl,
        marginBottom: spacing.md,
    },
    searchInput: {
        backgroundColor: adminColors.surface,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        fontSize: typography.size.md,
        color: adminColors.textPrimary,
        borderWidth: 1,
        borderColor: adminColors.border,
    },
    listContent: {
        padding: spacing.xl,
        paddingTop: 0,
    },
    userCard: {
        backgroundColor: adminColors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: adminColors.border,
    },
    userCardTablet: {
        marginHorizontal: spacing.xs,
    },
    userHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: adminColors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: typography.size.lg,
        fontWeight: typography.weight.bold,
        color: '#FFFFFF',
    },
    userInfo: {
        flex: 1,
        marginLeft: spacing.md,
    },
    userName: {
        fontSize: typography.size.md,
        fontWeight: typography.weight.semibold,
        color: adminColors.textPrimary,
    },
    userPhone: {
        fontSize: typography.size.sm,
        color: adminColors.textMuted,
        marginTop: spacing.xxs,
    },
    roleBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xxs,
        borderRadius: borderRadius.xs,
    },
    roleSuperAdmin: {
        backgroundColor: adminColors.accentPink + '20',
    },
    roleContentAdmin: {
        backgroundColor: adminColors.primary + '20',
    },
    roleStudent: {
        backgroundColor: adminColors.accentGreen + '20',
    },
    roleBadgeText: {
        fontSize: typography.size.xs,
        fontWeight: typography.weight.bold,
        color: adminColors.textSecondary,
        textTransform: 'uppercase',
    },
    userMeta: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
        marginBottom: spacing.md,
    },
    metaText: {
        fontSize: typography.size.sm,
        color: adminColors.textMuted,
    },
    blockedText: {
        fontSize: typography.size.sm,
        color: adminColors.error,
        fontWeight: typography.weight.semibold,
    },
    userActions: {
        flexDirection: 'row',
        gap: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: adminColors.border,
        paddingTop: spacing.md,
    },
    actionBtn: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.sm,
    },
    blockBtn: {
        backgroundColor: adminColors.error + '20',
    },
    unblockBtn: {
        backgroundColor: adminColors.accentGreen + '20',
    },
    actionBtnText: {
        fontSize: typography.size.sm,
        fontWeight: typography.weight.semibold,
    },
    blockText: {
        color: adminColors.error,
    },
    unblockText: {
        color: adminColors.accentGreen,
    },
    roleBtn: {
        backgroundColor: adminColors.primary + '20',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.sm,
    },
    roleBtnText: {
        fontSize: typography.size.sm,
        color: adminColors.primary,
        fontWeight: typography.weight.semibold,
    },
    footerLoader: {
        padding: spacing.xl,
    },
    loadMoreBtn: {
        alignItems: 'center',
        padding: spacing.lg,
    },
    loadMoreText: {
        fontSize: typography.size.md,
        color: adminColors.primary,
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
    },
    emptyMsg: {
        fontSize: typography.size.md,
        color: adminColors.textMuted,
        marginTop: spacing.xs,
    },
});
