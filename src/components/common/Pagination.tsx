import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { adminColors, typography, spacing, borderRadius } from '../../theme';

interface PaginationProps {
    hasMore: boolean;
    loadingMore: boolean;
    onLoadMore: () => void;
    totalShown?: number;
}

/**
 * Simple pagination control with "Load More" button.
 */
export function Pagination({
    hasMore,
    loadingMore,
    onLoadMore,
    totalShown,
}: PaginationProps): React.JSX.Element | null {
    if (!hasMore && !loadingMore) {
        return totalShown ? (
            <View style={styles.container}>
                <Text style={styles.info}>Showing all {totalShown} items</Text>
            </View>
        ) : null;
    }

    return (
        <View style={styles.container}>
            {totalShown ? (
                <Text style={styles.info}>{totalShown} items shown</Text>
            ) : null}
            <TouchableOpacity
                style={styles.button}
                onPress={onLoadMore}
                disabled={loadingMore}
                activeOpacity={0.7}
            >
                {loadingMore ? (
                    <ActivityIndicator size="small" color={adminColors.primary} />
                ) : (
                    <Text style={styles.buttonText}>Load More</Text>
                )}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingVertical: spacing.lg,
        gap: spacing.sm,
    },
    info: {
        fontSize: typography.size.sm,
        color: adminColors.textMuted,
    },
    button: {
        backgroundColor: adminColors.surfaceElevated,
        paddingHorizontal: spacing.xxl,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: adminColors.border,
        minWidth: 120,
        alignItems: 'center',
    },
    buttonText: {
        fontSize: typography.size.md,
        color: adminColors.primary,
        fontWeight: typography.weight.semibold,
    },
});
