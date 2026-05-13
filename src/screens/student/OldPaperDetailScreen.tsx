import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { studentColors, typography, spacing, borderRadius, shadows } from '../../theme';
import { OldPaper } from '../../types';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

export function OldPaperDetailScreen({ route }: { route: any }): React.JSX.Element {
    const { paper } = route.params as { paper: OldPaper };
    const navigation = useNavigation<StackNavigationProp<any>>();

    const handleOpenPDF = async () => {
        if (!paper.pdfUrl) {
            Alert.alert('Unavailable', 'PDF is not available for this paper.');
            return;
        }
        navigation.navigate('PdfViewer', {
            url: paper.pdfUrl,
            title: paper.title || `${paper.subject} - ${paper.year}`
        });
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Header Card */}
            <View style={styles.headerCard}>
                <View style={styles.iconContainer}>
                    <Text style={styles.iconText}>📄</Text>
                </View>
                <Text style={styles.title}>{paper.title || `${paper.subject} - ${paper.year}`}</Text>

                <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>Subject</Text>
                        <Text style={styles.metaValue}>{paper.subject}</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>Year</Text>
                        <Text style={styles.metaValue}>{paper.year}</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>Semester</Text>
                        <Text style={styles.metaValue}>{paper.semester}</Text>
                    </View>
                </View>
            </View>

            {/* Open PDF Button */}
            <TouchableOpacity
                style={styles.pdfButton}
                activeOpacity={0.8}
                onPress={handleOpenPDF}
            >
                <Text style={styles.pdfIcon}>📄</Text>
                <View style={styles.pdfTextContainer}>
                    <Text style={styles.pdfTitle}>Open PDF</Text>
                    <Text style={styles.pdfSub}>View the question paper</Text>
                </View>
                <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>
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
        backgroundColor: '#FFF3E0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    iconText: { fontSize: 28 },
    title: {
        fontSize: typography.size.xxl,
        fontWeight: typography.weight.bold,
        color: studentColors.textPrimary,
        marginBottom: spacing.lg,
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    metaItem: { alignItems: 'center' },
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
        backgroundColor: studentColors.secondary,
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        ...shadows.md,
    },
    pdfIcon: { fontSize: 32, marginRight: spacing.lg },
    pdfTextContainer: { flex: 1 },
    pdfTitle: {
        fontSize: typography.size.lg,
        fontWeight: typography.weight.bold,
        color: studentColors.textInverse,
    },
    pdfSub: {
        fontSize: typography.size.sm,
        color: studentColors.textInverse + 'CC',
        marginTop: 2,
    },
    arrow: {
        fontSize: 20,
        color: studentColors.textInverse,
        fontWeight: typography.weight.bold,
    },
});
