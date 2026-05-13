import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useBlueprints } from '../../hooks/useBlueprints';
import { useStandardContext } from '../../context/StandardContext';
import { studentColors, typography, spacing, borderRadius, shadows } from '../../theme';
import { Blueprint } from '../../types';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '../../components/common/EmptyState';

export function BlueprintListScreen({ route, navigation }: { route: any; navigation: any }): React.JSX.Element {
    const { t } = useTranslation();
    const { session } = route.params || {};
    const { selectedStandard } = useStandardContext();
    const std = selectedStandard;
    const sem = session || '1';

    const { blueprints, loading, error } = useBlueprints(std, sem);

    const handlePress = (item: Blueprint) => {
        navigation.navigate('BlueprintDetail', { blueprint: item });
    };

    const renderItem = ({ item, index }: { item: Blueprint; index: number }) => (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => handlePress(item)}
        >
            <View style={[styles.cardIcon, { backgroundColor: index % 2 === 0 ? '#E3F2FD' : '#FFF3E0' }]}>
                <Text style={styles.iconText}>📋</Text>
            </View>
            <View style={styles.cardContent}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                {item.description ? (
                    <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>
                ) : null}
            </View>
            <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={studentColors.primary} />
                <Text style={styles.loadingText}>Loading blueprints...</Text>
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

    if (blueprints.length === 0) {
        return (
            <View style={styles.center}>
                <EmptyState
                    icon="📭"
                    title={t('common.noData')}
                    message="No blueprints available. Check back later."
                />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.headerBar}>
                <Text style={styles.headerTitle}>📋 Blueprint</Text>
                <Text style={styles.headerSub}>Semester {sem} • {blueprints.length} items</Text>
            </View>
            <FlatList
                data={blueprints}
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
    container: {
        flex: 1,
        backgroundColor: studentColors.background,
    },
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
    loadingText: {
        fontSize: typography.size.md,
        color: studentColors.textMuted,
        marginTop: spacing.md,
    },
    errorIcon: { fontSize: 48, marginBottom: spacing.md },
    errorText: {
        fontSize: typography.size.md,
        color: studentColors.error,
        textAlign: 'center',
    },
    emptyIcon: { fontSize: 48, marginBottom: spacing.md },
    emptyText: {
        fontSize: typography.size.lg,
        fontWeight: typography.weight.semibold,
        color: studentColors.textPrimary,
        marginBottom: spacing.xs,
    },
    emptySubText: {
        fontSize: typography.size.md,
        color: studentColors.textMuted,
    },
    listContent: {
        padding: spacing.lg,
    },
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
        marginBottom: spacing.xs,
    },
    cardDescription: {
        fontSize: typography.size.sm,
        color: studentColors.textSecondary,
    },
    chevron: {
        fontSize: 24,
        color: studentColors.textMuted,
        fontWeight: typography.weight.bold,
        marginLeft: spacing.sm,
    },
});
