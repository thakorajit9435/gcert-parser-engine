import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { adminColors, typography, spacing, borderRadius } from '../../theme';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: string;
    color?: string;
    subtitle?: string;
}

/**
 * Dashboard statistics card for the admin panel.
 */
export function StatCard({
    title,
    value,
    icon,
    color = adminColors.primary,
    subtitle,
}: StatCardProps): React.JSX.Element {
    return (
        <View style={styles.card}>
            <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
                <Text style={styles.icon}>{icon}</Text>
            </View>
            <Text style={styles.value}>{value}</Text>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            <View style={[styles.accentBar, { backgroundColor: color }]} />
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: adminColors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: adminColors.border,
        minWidth: 150,
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: borderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    icon: {
        fontSize: 20,
    },
    value: {
        fontSize: typography.size.xxl,
        fontWeight: typography.weight.bold,
        color: adminColors.textPrimary,
        marginBottom: spacing.xxs,
    },
    title: {
        fontSize: typography.size.sm,
        color: adminColors.textSecondary,
        fontWeight: typography.weight.medium,
    },
    subtitle: {
        fontSize: typography.size.xs,
        color: adminColors.textMuted,
        marginTop: spacing.xxs,
    },
    accentBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
        borderBottomLeftRadius: borderRadius.lg,
        borderBottomRightRadius: borderRadius.lg,
    },
});
