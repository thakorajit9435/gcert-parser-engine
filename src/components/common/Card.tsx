import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { adminColors, spacing, borderRadius, shadows } from '../../theme';
import { AnimatedPressable } from './AnimatedPressable';

interface CardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    elevated?: boolean;
    onPress?: () => void;
}

/**
 * Reusable card container with dark theme styling and spring press animation when clickable.
 */
export function Card({ children, style, elevated = false, onPress }: CardProps): React.JSX.Element {
    const cardContent = (
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

    if (onPress) {
        return (
            <AnimatedPressable onPress={onPress} scaleTo={0.97}>
                {cardContent}
            </AnimatedPressable>
        );
    }

    return cardContent;
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
