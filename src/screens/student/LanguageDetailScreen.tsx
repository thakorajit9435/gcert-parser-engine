import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { studentColors, typography, spacing, borderRadius, shadows } from '../../theme';
import { LanguageItem } from '../../types';

export function LanguageDetailScreen({ route }: { route: any }): React.JSX.Element {
    const { item } = route.params as { item: LanguageItem };

    const languageLabel =
        item.language === 'gujarati' ? 'ગુજરાતી' :
            item.language === 'hindi' ? 'हिन्दी' : 'English';

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Header Card */}
            <View style={styles.headerCard}>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{languageLabel}</Text>
                </View>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.description}>{item.description}</Text>
            </View>

            {/* Content */}
            {item.content ? (
                <View style={styles.contentCard}>
                    <Text style={styles.contentTitle}>📄 Content</Text>
                    <View style={styles.divider} />
                    <Text style={styles.contentText}>{item.content}</Text>
                </View>
            ) : (
                <View style={styles.emptyCard}>
                    <Text style={styles.emptyIcon}>📭</Text>
                    <Text style={styles.emptyText}>No detailed content available</Text>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: studentColors.background,
    },
    content: {
        padding: spacing.lg,
    },
    headerCard: {
        backgroundColor: studentColors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: studentColors.border,
        ...shadows.sm,
    },
    badge: {
        alignSelf: 'flex-start',
        backgroundColor: studentColors.secondaryLight + '30',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
        marginBottom: spacing.md,
    },
    badgeText: {
        fontSize: typography.size.sm,
        fontWeight: typography.weight.semibold,
        color: studentColors.secondary,
    },
    title: {
        fontSize: typography.size.xxl,
        fontWeight: typography.weight.bold,
        color: studentColors.textPrimary,
        marginBottom: spacing.sm,
    },
    description: {
        fontSize: typography.size.md,
        color: studentColors.textSecondary,
        lineHeight: typography.lineHeight.lg,
    },
    contentCard: {
        backgroundColor: studentColors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        borderWidth: 1,
        borderColor: studentColors.border,
        ...shadows.sm,
    },
    contentTitle: {
        fontSize: typography.size.lg,
        fontWeight: typography.weight.semibold,
        color: studentColors.textPrimary,
        marginBottom: spacing.sm,
    },
    divider: {
        height: 1,
        backgroundColor: studentColors.border,
        marginBottom: spacing.lg,
    },
    contentText: {
        fontSize: typography.size.md,
        color: studentColors.textPrimary,
        lineHeight: typography.lineHeight.xl,
    },
    emptyCard: {
        backgroundColor: studentColors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.xxl,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: studentColors.border,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: spacing.md,
    },
    emptyText: {
        fontSize: typography.size.md,
        color: studentColors.textMuted,
    },
});
