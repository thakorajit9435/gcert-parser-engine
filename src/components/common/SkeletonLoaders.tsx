import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Skeleton } from './Skeleton';
import { spacing, borderRadius } from '../../theme';

export function SubjectCardSkeleton(): React.JSX.Element {
    return (
        <View style={styles.cardRow}>
            <Skeleton width={48} height={48} borderRadius={24} />
            <View style={styles.textColumn}>
                <Skeleton width="60%" height={16} borderRadius={4} style={{ marginBottom: spacing.xs }} />
                <Skeleton width="40%" height={12} borderRadius={4} />
            </View>
        </View>
    );
}

export function ChapterCardSkeleton(): React.JSX.Element {
    return (
        <View style={styles.chapterCard}>
            <View style={styles.headerRow}>
                <View style={{ flex: 1 }}>
                    <Skeleton width="75%" height={18} borderRadius={4} style={{ marginBottom: spacing.xs }} />
                    <Skeleton width="50%" height={12} borderRadius={4} />
                </View>
                <Skeleton width={32} height={32} borderRadius={16} />
            </View>
            <View style={styles.actionsRow}>
                <Skeleton width="30%" height={32} borderRadius={borderRadius.md} />
                <Skeleton width="30%" height={32} borderRadius={borderRadius.md} />
                <Skeleton width="30%" height={32} borderRadius={borderRadius.md} />
            </View>
        </View>
    );
}

export function QuizCardSkeleton(): React.JSX.Element {
    return (
        <View style={styles.quizCard}>
            <Skeleton width={48} height={48} borderRadius={borderRadius.md} style={{ marginRight: spacing.md }} />
            <View style={{ flex: 1 }}>
                <Skeleton width="70%" height={16} borderRadius={4} style={{ marginBottom: spacing.xs }} />
                <Skeleton width="40%" height={12} borderRadius={4} style={{ marginBottom: spacing.sm }} />
                <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                    <Skeleton width={60} height={20} borderRadius={10} />
                    <Skeleton width={80} height={20} borderRadius={10} />
                </View>
            </View>
        </View>
    );
}

export function DashboardStatSkeleton(): React.JSX.Element {
    return (
        <View style={styles.statCard}>
            <Skeleton width="50%" height={12} borderRadius={4} style={{ marginBottom: spacing.sm }} />
            <Skeleton width="80%" height={28} borderRadius={4} style={{ marginBottom: spacing.xs }} />
            <Skeleton width="40%" height={10} borderRadius={4} />
        </View>
    );
}

export function PDFLoadingSkeleton(): React.JSX.Element {
    return (
        <View style={styles.pdfContainer}>
            <View style={styles.pdfHeader}>
                <Skeleton width="60%" height={16} borderRadius={4} />
            </View>
            <ScrollView contentContainerStyle={styles.pdfPages}>
                <View style={styles.pdfPage}>
                    <Skeleton width="100%" height={200} borderRadius={8} style={{ marginBottom: spacing.lg }} />
                    <Skeleton width="90%" height={12} borderRadius={4} style={{ marginBottom: spacing.sm }} />
                    <Skeleton width="95%" height={12} borderRadius={4} style={{ marginBottom: spacing.sm }} />
                    <Skeleton width="80%" height={12} borderRadius={4} style={{ marginBottom: spacing.sm }} />
                    <Skeleton width="85%" height={12} borderRadius={4} style={{ marginBottom: spacing.sm }} />
                    <Skeleton width="60%" height={12} borderRadius={4} />
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    textColumn: {
        flex: 1,
        marginLeft: spacing.md,
    },
    chapterCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.lg,
    },
    actionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: spacing.md,
    },
    quizCard: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: borderRadius.xl,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    statCard: {
        backgroundColor: '#1A1D27',
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        minWidth: 120,
        flex: 1,
        borderWidth: 1,
        borderColor: '#2D3348',
    },
    pdfContainer: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    pdfHeader: {
        height: 54,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        justifyContent: 'center',
        paddingHorizontal: spacing.md,
    },
    pdfPages: {
        padding: spacing.md,
    },
    pdfPage: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        minHeight: 400,
    },
});
