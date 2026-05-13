import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { adminColors, typography, spacing } from '../../theme';

interface LoadingStateProps {
    message?: string;
    fullScreen?: boolean;
}

/**
 * Loading indicator with optional message.
 */
export function LoadingState({ message, fullScreen = true }: LoadingStateProps): React.JSX.Element {
    return (
        <View style={[styles.container, fullScreen && styles.fullScreen]}>
            <ActivityIndicator size="large" color={adminColors.primary} />
            {message ? <Text style={styles.message}>{message}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xxl,
    },
    fullScreen: {
        flex: 1,
        backgroundColor: adminColors.background,
    },
    message: {
        marginTop: spacing.lg,
        fontSize: typography.size.md,
        color: adminColors.textSecondary,
    },
});
