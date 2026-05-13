import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { adminColors, typography, spacing } from '../../theme';

interface EmptyStateProps {
    icon?: string;
    title: string;
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}

/**
 * Empty state placeholder with optional action button.
 */
export function EmptyState({
    icon = '📭',
    title,
    message,
    actionLabel,
    onAction,
}: EmptyStateProps): React.JSX.Element {
    return (
        <View style={styles.container}>
            <Text style={styles.icon}>{icon}</Text>
            <Text style={styles.title}>{title}</Text>
            {message ? <Text style={styles.message}>{message}</Text> : null}
            {actionLabel && onAction ? (
                <TouchableOpacity style={styles.actionButton} onPress={onAction}>
                    <Text style={styles.actionText}>{actionLabel}</Text>
                </TouchableOpacity>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xxl,
    },
    icon: {
        fontSize: 56,
        marginBottom: spacing.lg,
    },
    title: {
        fontSize: typography.size.xl,
        fontWeight: typography.weight.semibold,
        color: adminColors.textPrimary,
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    message: {
        fontSize: typography.size.md,
        color: adminColors.textSecondary,
        textAlign: 'center',
        lineHeight: typography.lineHeight.lg,
        marginBottom: spacing.xl,
    },
    actionButton: {
        backgroundColor: adminColors.primary,
        paddingHorizontal: spacing.xxl,
        paddingVertical: spacing.md,
        borderRadius: 8,
    },
    actionText: {
        color: '#FFFFFF',
        fontSize: typography.size.md,
        fontWeight: typography.weight.semibold,
    },
});
