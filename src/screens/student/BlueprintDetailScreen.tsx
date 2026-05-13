import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { studentColors, typography, spacing, borderRadius, shadows } from '../../theme';
import { Blueprint } from '../../types';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

export function BlueprintDetailScreen({ route }: { route: any }): React.JSX.Element {
    const { blueprint } = route.params as { blueprint: Blueprint };
    const navigation = useNavigation<StackNavigationProp<any>>();

    const handleOpenPDF = async () => {
        if (!blueprint.pdfUrl) {
            Alert.alert('Unavailable', 'PDF is not available for this blueprint.');
            return;
        }
        navigation.navigate('PdfViewer', {
            url: blueprint.pdfUrl,
            title: blueprint.title
        });
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Header */}
            <View style={styles.headerCard}>
                <View style={styles.iconContainer}>
                    <Text style={styles.iconText}>📋</Text>
                </View>
                <Text style={styles.title}>{blueprint.title}</Text>
                {blueprint.description ? (
                    <Text style={styles.description}>{blueprint.description}</Text>
                ) : null}
                <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>Semester</Text>
                        <Text style={styles.metaValue}>{blueprint.semester}</Text>
                    </View>
                </View>
            </View>

            {/* PDF Button */}
            {blueprint.pdfUrl ? (
                <TouchableOpacity
                    style={styles.pdfButton}
                    activeOpacity={0.8}
                    onPress={handleOpenPDF}
                >
                    <Text style={styles.pdfIcon}>📄</Text>
                    <View style={styles.pdfTextContainer}>
                        <Text style={styles.pdfTitle}>View PDF</Text>
                        <Text style={styles.pdfSub}>Open blueprint document</Text>
                    </View>
                    <Text style={styles.chevron}>→</Text>
                </TouchableOpacity>
            ) : null}

            {/* Content */}
            {blueprint.content ? (
                <View style={styles.contentCard}>
                    <Text style={styles.contentTitle}>📝 Details</Text>
                    <View style={styles.divider} />
                    <Text style={styles.contentText}>{blueprint.content}</Text>
                </View>
            ) : null}

            {/* Empty state if no content and no PDF */}
            {!blueprint.content && !blueprint.pdfUrl && (
                <View style={styles.emptyCard}>
                    <Text style={styles.emptyIcon}>📭</Text>
                    <Text style={styles.emptyText}>No detailed content available</Text>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: studentColors.background },
    content: { padding: spacing.lg },
    headerCard: {
        backgroundColor: studentColors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: studentColors.border,
        ...shadows.sm,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    iconText: { fontSize: 28 },
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
        marginBottom: spacing.md,
    },
    metaRow: { flexDirection: 'row', gap: spacing.xl },
    metaItem: {},
    metaLabel: {
        fontSize: typography.size.xs,
        color: studentColors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    metaValue: {
        fontSize: typography.size.lg,
        fontWeight: typography.weight.bold,
        color: studentColors.secondary,
        marginTop: 2,
    },
    pdfButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: studentColors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        marginBottom: spacing.lg,
        borderWidth: 2,
        borderColor: studentColors.secondary + '30',
        ...shadows.sm,
    },
    pdfIcon: { fontSize: 32, marginRight: spacing.lg },
    pdfTextContainer: { flex: 1 },
    pdfTitle: {
        fontSize: typography.size.lg,
        fontWeight: typography.weight.bold,
        color: studentColors.textPrimary,
    },
    pdfSub: {
        fontSize: typography.size.sm,
        color: studentColors.textSecondary,
        marginTop: 2,
    },
    chevron: {
        fontSize: 20,
        color: studentColors.secondary,
        fontWeight: typography.weight.bold,
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
    divider: { height: 1, backgroundColor: studentColors.border, marginBottom: spacing.lg },
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
    emptyIcon: { fontSize: 48, marginBottom: spacing.md },
    emptyText: { fontSize: typography.size.md, color: studentColors.textMuted },
});
