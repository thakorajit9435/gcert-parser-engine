import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { studentColors, typography, spacing, borderRadius } from '../../theme';

interface EmptyStateProps {
    icon?: string;
    title: string;
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}

/**
 * Empty state placeholder with entry animation and custom button.
 */
export function EmptyState({
    icon = '📭',
    title,
    message,
    actionLabel,
    onAction,
}: EmptyStateProps): React.JSX.Element {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(15)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            })
        ]).start();
    }, [fadeAnim, slideAnim]);

    return (
        <Animated.View style={[
            styles.container,
            {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
            }
        ]}>
            <Text style={styles.icon}>{icon}</Text>
            <Text style={styles.title}>{title}</Text>
            {message ? <Text style={styles.message}>{message}</Text> : null}
            {actionLabel && onAction ? (
                <TouchableOpacity style={styles.actionButton} onPress={onAction}>
                    <Text style={styles.actionText}>{actionLabel}</Text>
                </TouchableOpacity>
            ) : null}
        </Animated.View>
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
        fontSize: 64,
        marginBottom: spacing.md,
    },
    title: {
        fontSize: typography.size.lg,
        fontWeight: typography.weight.bold,
        color: studentColors.textPrimary,
        marginBottom: spacing.xs,
        textAlign: 'center',
    },
    message: {
        fontSize: typography.size.md,
        color: studentColors.textSecondary,
        textAlign: 'center',
        lineHeight: typography.lineHeight.md,
        marginBottom: spacing.xl,
    },
    actionButton: {
        backgroundColor: studentColors.primary,
        paddingHorizontal: spacing.xxl,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
    },
    actionText: {
        color: studentColors.textOnPrimary || '#3E2723',
        fontSize: typography.size.md,
        fontWeight: typography.weight.bold,
    },
});
