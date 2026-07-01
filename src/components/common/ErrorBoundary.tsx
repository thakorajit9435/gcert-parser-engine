import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { adminColors, typography, spacing, borderRadius } from '../../theme';

import { logCrashError } from '../../services/crashlytics';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallbackMessage?: string;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

/**
 * Error boundary that catches JS errors in child components.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        // Log to analytics/crash reporting service
        logCrashError(error, 'general_error', {
            componentStack: errorInfo.componentStack ? errorInfo.componentStack.substring(0, 1000) : '',
        });
        if (__DEV__) {
            // eslint-disable-next-line no-console
            console.error('ErrorBoundary caught:', error, errorInfo);
        }
    }

    private handleRetry = (): void => {
        this.setState({ hasError: false, error: null });
    };

    render(): ReactNode {
        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <Text style={styles.icon}>⚠️</Text>
                    <Text style={styles.title}>Something went wrong</Text>
                    <Text style={styles.message}>
                        {this.props.fallbackMessage ?? this.state.error?.message ?? 'An unexpected error occurred.'}
                    </Text>
                    <TouchableOpacity style={styles.retryButton} onPress={this.handleRetry}>
                        <Text style={styles.retryText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xxl,
        backgroundColor: adminColors.background,
    },
    icon: {
        fontSize: 48,
        marginBottom: spacing.lg,
    },
    title: {
        fontSize: typography.size.xl,
        fontWeight: typography.weight.bold,
        color: adminColors.textPrimary,
        marginBottom: spacing.sm,
    },
    message: {
        fontSize: typography.size.md,
        color: adminColors.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.xxl,
        lineHeight: typography.lineHeight.lg,
    },
    retryButton: {
        backgroundColor: adminColors.primary,
        paddingHorizontal: spacing.xxl,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
    },
    retryText: {
        color: '#FFFFFF',
        fontSize: typography.size.lg,
        fontWeight: typography.weight.semibold,
    },
});
