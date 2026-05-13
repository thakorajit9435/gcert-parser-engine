import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { adminColors, typography, spacing, borderRadius } from '../../theme';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'premium';

interface BadgeProps {
    label: string;
    variant?: BadgeVariant;
}

const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
    default: { bg: adminColors.surfaceElevated, text: adminColors.textSecondary },
    success: { bg: 'rgba(16, 185, 129, 0.15)', text: adminColors.accentGreen },
    warning: { bg: 'rgba(245, 158, 11, 0.15)', text: adminColors.accentOrange },
    error: { bg: 'rgba(239, 68, 68, 0.15)', text: adminColors.accentRed },
    info: { bg: 'rgba(59, 130, 246, 0.15)', text: adminColors.info },
    premium: { bg: 'rgba(236, 72, 153, 0.15)', text: adminColors.accentPink },
};

/**
 * Status/label badge with color variants.
 */
export function Badge({ label, variant = 'default' }: BadgeProps): React.JSX.Element {
    const colors = variantColors[variant];

    return (
        <View style={[styles.badge, { backgroundColor: colors.bg }]}>
            <Text style={[styles.text, { color: colors.text }]}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xxs,
        borderRadius: borderRadius.sm,
        alignSelf: 'flex-start',
    },
    text: {
        fontSize: typography.size.xs,
        fontWeight: typography.weight.semibold,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
});
