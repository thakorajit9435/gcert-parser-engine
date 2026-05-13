import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types';

// ─── Types ─────────────────────────────────────────────────────

interface RoleGuardProps {
    /** Roles that are allowed to see the children */
    allowedRoles: UserRole[];
    /** Content to render when the role check passes */
    children: React.ReactNode;
    /** Optional fallback when role check fails. Defaults to null. */
    fallback?: React.ReactNode;
}

// ─── RoleGuard HOC ─────────────────────────────────────────────

/**
 * Security guard component — only renders children if the current user's
 * Firestore role is in `allowedRoles`.
 *
 * Role is always read from the Firestore userData (never from client state alone),
 * preventing client-side role escalation.
 *
 * Usage:
 * ```tsx
 * <RoleGuard allowedRoles={['super_admin']}>
 *   <CreateAdminButton />
 * </RoleGuard>
 * ```
 */
export function RoleGuard({ allowedRoles, children, fallback = null }: RoleGuardProps): React.JSX.Element {
    const { role, loading } = useAuth();

    // While auth is still loading, render nothing to prevent flash
    if (loading) {
        return <></>;
    }

    // Role must come from Firestore (userData.role) — enforced in AuthContext
    if (!role || !allowedRoles.includes(role)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}

// ─── AccessDenied Component ────────────────────────────────────

/**
 * Pre-built fallback component for access-denied states.
 */
export function AccessDenied(): React.JSX.Element {
    return (
        <View style={styles.container}>
            <Text style={styles.emoji}>🔒</Text>
            <Text style={styles.title}>Access Denied</Text>
            <Text style={styles.message}>
                You don't have permission to view this content.
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        backgroundColor: '#F8F9FA',
    },
    emoji: { fontSize: 56, marginBottom: 16 },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1A1A2E',
        marginBottom: 8,
    },
    message: {
        fontSize: 15,
        color: '#555577',
        textAlign: 'center',
        lineHeight: 22,
    },
});
