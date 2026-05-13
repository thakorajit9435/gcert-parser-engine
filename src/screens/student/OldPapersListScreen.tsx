import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useOldPapers } from '../../hooks/useOldPapers';
import { useStandardContext } from '../../context/StandardContext';
import { studentColors, typography, spacing, borderRadius, shadows } from '../../theme';
import { OldPaper } from '../../types';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '../../components/common/EmptyState';

export function OldPapersListScreen({ route, navigation }: { route: any; navigation: any }): React.JSX.Element {
    const { t } = useTranslation();
    const { session } = route.params || {};
    const { selectedStandard } = useStandardContext();
    const std = selectedStandard;
    const sem = session || '1';

    const { papers, loading, error } = useOldPapers(std, sem);

    const handlePress = (paper: OldPaper) => {
        navigation.navigate('OldPaperDetail', { paper });
    };

    const renderItem = ({ item }: { item: OldPaper }) => (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => handlePress(item)}
        >
            <View style={styles.cardIcon}>
                <Text style={styles.iconText}>📄</Text>
            </View>
            <View style={styles.cardContent}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.title || `${item.subject} - ${item.year}`}
                </Text>
                <View style={styles.tagRow}>
                    <View style={styles.tag}>
                        <Text style={styles.tagText}>{item.subject}</Text>
                    </View>
                    <View style={[styles.tag, styles.yearTag]}>
                        <Text style={[styles.tagText, styles.yearTagText]}>{item.year}</Text>
                    </View>
                </View>
            </View>
            <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={studentColors.primary} />
                <Text style={styles.loadingText}>Loading old papers...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    if (papers.length === 0) {
        return (
            <View style={styles.center}>
                <EmptyState
                    icon="📭"
                    title={t('common.noData')}
                    message="No old papers available. Check back later for updates."
                />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.headerBar}>
                <Text style={styles.headerTitle}>📄 જુના પેપર્સ</Text>
                <Text style={styles.headerSub}>Semester {sem} • {papers.length} papers</Text>
            </View>
            <FlatList
                data={papers}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={5}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: studentColors.background },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: studentColors.background,
        padding: spacing.xxl,
    },
    headerBar: {
        backgroundColor: studentColors.surface,
        padding: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: studentColors.border,
    },
    headerTitle: {
        fontSize: typography.size.xl,
        fontWeight: typography.weight.bold,
        color: studentColors.textPrimary,
    },
    headerSub: {
        fontSize: typography.size.sm,
        color: studentColors.textMuted,
        marginTop: spacing.xs,
    },
    loadingText: { fontSize: typography.size.md, color: studentColors.textMuted, marginTop: spacing.md },
    errorIcon: { fontSize: 48, marginBottom: spacing.md },
    errorText: { fontSize: typography.size.md, color: studentColors.error, textAlign: 'center' },
    emptyIcon: { fontSize: 48, marginBottom: spacing.md },
    emptyText: {
        fontSize: typography.size.lg,
        fontWeight: typography.weight.semibold,
        color: studentColors.textPrimary,
        marginBottom: spacing.xs,
    },
    emptySubText: { fontSize: typography.size.md, color: studentColors.textMuted },
    listContent: { padding: spacing.lg },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: studentColors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: studentColors.border,
        ...shadows.sm,
    },
    cardIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FFF3E0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconText: { fontSize: 24 },
    cardContent: {
        flex: 1,
        marginLeft: spacing.md,
    },
    cardTitle: {
        fontSize: typography.size.lg,
        fontWeight: typography.weight.semibold,
        color: studentColors.textPrimary,
        marginBottom: spacing.sm,
    },
    tagRow: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    tag: {
        backgroundColor: studentColors.secondary + '15',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xxs,
        borderRadius: borderRadius.sm,
    },
    tagText: {
        fontSize: typography.size.xs,
        fontWeight: typography.weight.semibold,
        color: studentColors.secondary,
    },
    yearTag: {
        backgroundColor: studentColors.primary + '30',
    },
    yearTagText: {
        color: studentColors.textOnPrimary,
    },
    chevron: {
        fontSize: 24,
        color: studentColors.textMuted,
        fontWeight: typography.weight.bold,
        marginLeft: spacing.sm,
    },
});
