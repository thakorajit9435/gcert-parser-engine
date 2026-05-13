import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
} from 'react-native';
import { adminColors, typography, spacing, borderRadius } from '../../theme';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    disabled?: boolean;
    icon?: React.ReactNode;
    style?: ViewStyle;
    textStyle?: TextStyle;
}

/**
 * Reusable styled button with variants and loading state.
 */
export function Button({
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    icon,
    style,
    textStyle,
}: ButtonProps): React.JSX.Element {
    const isDisabled = disabled || loading;

    return (
        <TouchableOpacity
            style={[
                styles.base,
                variantStyles[variant],
                sizeStyles[size],
                isDisabled && styles.disabled,
                style,
            ]}
            onPress={onPress}
            disabled={isDisabled}
            activeOpacity={0.7}
        >
            {loading ? (
                <ActivityIndicator
                    size="small"
                    color={variant === 'ghost' ? adminColors.primary : '#FFFFFF'}
                />
            ) : (
                <>
                    {icon}
                    <Text
                        style={[
                            styles.text,
                            variantTextStyles[variant],
                            sizeTextStyles[size],
                            textStyle,
                        ]}
                    >
                        {title}
                    </Text>
                </>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    base: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
    },
    text: {
        fontWeight: typography.weight.semibold,
    },
    disabled: {
        opacity: 0.5,
    },
});

const variantStyles: Record<ButtonVariant, ViewStyle> = StyleSheet.create({
    primary: {
        backgroundColor: adminColors.primary,
        borderRadius: borderRadius.md,
    },
    secondary: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: adminColors.border,
        borderRadius: borderRadius.md,
    },
    danger: {
        backgroundColor: adminColors.error,
        borderRadius: borderRadius.md,
    },
    ghost: {
        backgroundColor: 'transparent',
        borderRadius: borderRadius.md,
    },
});

const variantTextStyles: Record<ButtonVariant, TextStyle> = StyleSheet.create({
    primary: { color: '#FFFFFF' },
    secondary: { color: adminColors.textPrimary },
    danger: { color: '#FFFFFF' },
    ghost: { color: adminColors.primary },
});

const sizeStyles: Record<ButtonSize, ViewStyle> = StyleSheet.create({
    sm: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, minHeight: 32 },
    md: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, minHeight: 44 },
    lg: { paddingHorizontal: spacing.xxl, paddingVertical: spacing.lg, minHeight: 52 },
});

const sizeTextStyles: Record<ButtonSize, TextStyle> = StyleSheet.create({
    sm: { fontSize: typography.size.sm },
    md: { fontSize: typography.size.md },
    lg: { fontSize: typography.size.lg },
});
