import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { studentColors, typography, spacing, borderRadius } from '../../theme';
import { logCrashError } from '../../services/crashlytics';

interface ErrorStateProps {
    error: Error | string | null | unknown;
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
    context?: string;
}

export function ErrorState({
    error,
    message = 'કંઈક ખોટું થયું હોય તેવું લાગે છે. કૃપા કરીને ફરી પ્રયાસ કરો.',
    actionLabel = 'ફરી પ્રયાસ કરો',
    onAction,
    context = 'unknown_component',
}: ErrorStateProps): React.JSX.Element {

    // Automatically log the error to Crashlytics
    useEffect(() => {
        if (error) {
            logCrashError(error, 'general_error', { context });
        }
    }, [error, context]);

    return (
        <View style={styles.container}>
            <Text style={styles.icon}>⚠️</Text>
            <Text style={styles.title}>ભૂલ આવી છે</Text>
            <Text style={styles.message}>{message}</Text>

            {onAction && (
                <TouchableOpacity style={styles.button} onPress={onAction}>
                    <Text style={styles.buttonText}>{actionLabel}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
        backgroundColor: studentColors.background,
    },
    icon: {
        fontSize: 48,
        marginBottom: spacing.md,
    },
    title: {
        fontSize: typography.size.xl,
        fontWeight: typography.weight.bold,
        color: studentColors.textPrimary,
        marginBottom: spacing.xs,
    },
    message: {
        fontSize: typography.size.md,
        color: studentColors.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.xl,
        lineHeight: typography.lineHeight.md,
    },
    button: {
        backgroundColor: studentColors.primary,
        paddingHorizontal: spacing.xxl,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
    },
    buttonText: {
        color: studentColors.textOnPrimary || '#3E2723',
        fontSize: typography.size.md,
        fontWeight: typography.weight.bold,
    },
});
