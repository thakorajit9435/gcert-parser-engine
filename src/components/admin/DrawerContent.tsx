import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
} from 'react-native';
import { DrawerContentScrollView, DrawerContentComponentProps } from '@react-navigation/drawer';
import { adminColors, typography, spacing, borderRadius } from '../../theme';
import { useAuth } from '../../hooks/useAuth';
import { useUserRole } from '../../hooks/useUserRole';

interface DrawerItem {
    label: string;
    icon: string;
    route: string;
    superAdminOnly?: boolean;
}

const DRAWER_ITEMS: DrawerItem[] = [
    { label: 'Dashboard', icon: '📊', route: 'DashboardStack' },
    { label: 'Content', icon: '📚', route: 'ContentStack' },
    { label: 'Quizzes', icon: '📝', route: 'QuizStack' },
    { label: 'Practice MCQ', icon: '🧪', route: 'PracticeStack' },
    { label: 'Language Section', icon: '📖', route: 'LanguageSectionStack' },
    { label: 'Blueprint', icon: '📋', route: 'BlueprintStack' },
    { label: 'Old Papers', icon: '📄', route: 'OldPapersStack' },
    { label: 'Books', icon: '📚', route: 'BookManagementStack' },
    { label: 'Users', icon: '👥', route: 'UsersStack' },
    { label: 'Premium', icon: '💎', route: 'PremiumStack', superAdminOnly: true },
    { label: 'Leaderboard', icon: '🏆', route: 'LeaderboardStack' },
    { label: 'Notifications', icon: '🔔', route: 'NotificationsStack' },
    { label: 'App Config', icon: '⚙️', route: 'ConfigStack', superAdminOnly: true },
    { label: 'Audit Logs', icon: '📋', route: 'AuditStack' },
];

/**
 * Custom drawer content for admin navigation.
 */
export function AdminDrawerContent(
    props: DrawerContentComponentProps,
): React.JSX.Element {
    const { userProfile, signOut } = useAuth();
    const { isSuperAdmin } = useUserRole();

    const activeRoute = props.state.routes[props.state.index]?.name;

    const filteredItems = DRAWER_ITEMS.filter(
        (item) => !item.superAdminOnly || isSuperAdmin,
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>
                        {userProfile?.name?.charAt(0)?.toUpperCase() || 'A'}
                    </Text>
                </View>
                <View style={styles.headerInfo}>
                    <Text style={styles.userName} numberOfLines={1}>
                        {userProfile?.name || 'Admin'}
                    </Text>
                    <Text style={styles.userRole}>
                        {userProfile?.role === 'super_admin' ? '🔑 Super Admin' : '📝 Content Admin'}
                    </Text>
                </View>
            </View>

            <View style={styles.divider} />

            {/* Navigation Items */}
            <DrawerContentScrollView {...props} style={styles.scrollView}>
                {filteredItems.map((item) => {
                    const isActive = activeRoute === item.route;
                    return (
                        <TouchableOpacity
                            key={item.route}
                            style={[styles.drawerItem, isActive && styles.drawerItemActive]}
                            onPress={() => props.navigation.navigate(item.route)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.drawerIcon}>{item.icon}</Text>
                            <Text
                                style={[
                                    styles.drawerLabel,
                                    isActive && styles.drawerLabelActive,
                                ]}
                            >
                                {item.label}
                            </Text>
                            {isActive ? <View style={styles.activeIndicator} /> : null}
                        </TouchableOpacity>
                    );
                })}
            </DrawerContentScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <View style={styles.divider} />
                <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
                    <Text style={styles.signOutIcon}>🚪</Text>
                    <Text style={styles.signOutText}>Sign Out</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: adminColors.surface,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.xl,
        paddingTop: spacing.xxxl,
    },
    avatarContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: adminColors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    avatarText: {
        fontSize: typography.size.xl,
        fontWeight: typography.weight.bold,
        color: '#FFFFFF',
    },
    headerInfo: {
        flex: 1,
    },
    userName: {
        fontSize: typography.size.lg,
        fontWeight: typography.weight.bold,
        color: adminColors.textPrimary,
    },
    userRole: {
        fontSize: typography.size.sm,
        color: adminColors.textSecondary,
        marginTop: spacing.xxs,
    },
    divider: {
        height: 1,
        backgroundColor: adminColors.border,
        marginHorizontal: spacing.lg,
    },
    scrollView: {
        flex: 1,
        paddingTop: spacing.sm,
    },
    drawerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        marginHorizontal: spacing.sm,
        borderRadius: borderRadius.md,
        position: 'relative',
    },
    drawerItemActive: {
        backgroundColor: `${adminColors.primary}15`,
    },
    drawerIcon: {
        fontSize: 18,
        marginRight: spacing.md,
        width: 24,
        textAlign: 'center',
    },
    drawerLabel: {
        fontSize: typography.size.md,
        color: adminColors.textSecondary,
        fontWeight: typography.weight.medium,
        flex: 1,
    },
    drawerLabelActive: {
        color: adminColors.primary,
        fontWeight: typography.weight.semibold,
    },
    activeIndicator: {
        width: 4,
        height: 20,
        backgroundColor: adminColors.primary,
        borderRadius: 2,
        position: 'absolute',
        right: 0,
    },
    footer: {
        paddingBottom: spacing.xxl,
    },
    signOutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.xl,
        marginHorizontal: spacing.sm,
    },
    signOutIcon: {
        fontSize: 18,
        marginRight: spacing.md,
    },
    signOutText: {
        fontSize: typography.size.md,
        color: adminColors.accentRed,
        fontWeight: typography.weight.medium,
    },
});

// Suppress unused imports
void Image;
