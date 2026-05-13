import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { adminColors, spacing, borderRadius, shadows } from '../../theme';

interface CardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    elevated?: boolean;
}

/**
 * Reusable card container with dark theme styling.
 */
export function Card({ children, style, elevated = false }: CardProps): React.JSX.Element {
    return (
        <View
            style={[
                styles.card,
                elevated && styles.elevated,
                elevated && shadows.md,
                style,
            ]}
        >
            {children}
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
    },
    elevated: {
        backgroundColor: adminColors.surfaceElevated,
    },
});
