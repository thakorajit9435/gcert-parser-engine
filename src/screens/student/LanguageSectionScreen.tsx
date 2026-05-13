import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Animated, Dimensions, ActivityIndicator } from 'react-native';
import { useLanguageSection } from '../../hooks/useLanguageSection';
import { useStandardContext } from '../../context/StandardContext';
import { studentColors, typography, spacing, borderRadius, shadows } from '../../theme';
import { LanguageItem } from '../../types';

const { width } = Dimensions.get('window');
const TAB_COUNT = 3;
const TAB_WIDTH = width / TAB_COUNT;

type LanguageTab = 'gujarati' | 'hindi' | 'english';

const TABS: { key: LanguageTab; label: string }[] = [
    { key: 'gujarati', label: 'ગુજરાતી' },
    { key: 'hindi', label: 'હિન્દી' },
    { key: 'english', label: 'English' },
];

export function LanguageSectionScreen({ navigation }: { route: any; navigation: any }): React.JSX.Element {
    const { selectedStandard } = useStandardContext();
    const std = selectedStandard;

    const [activeTab, setActiveTab] = useState<LanguageTab>('gujarati');
    const indicatorPosition = useRef(new Animated.Value(0)).current;

    const { items, loading, error } = useLanguageSection(std, activeTab);

    useEffect(() => {
        const tabIndex = TABS.findIndex(t => t.key === activeTab);
        Animated.spring(indicatorPosition, {
            toValue: tabIndex,
            useNativeDriver: true,
            bounciness: 0,
            speed: 12,
        }).start();
    }, [activeTab, indicatorPosition]);

    const handleItemPress = (item: LanguageItem) => {
        navigation.navigate('LanguageDetail', { item });
    };

    const renderItem = ({ item }: { item: LanguageItem }) => (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => handleItemPress(item)}
        >
            <View style={styles.cardIcon}>
                <Text style={styles.iconText}>
                    {activeTab === 'gujarati' ? '🔤' : activeTab === 'hindi' ? '📝' : '📖'}
                </Text>
            </View>
            <View style={styles.cardContent}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Top Tabs */}
            <View style={styles.tabContainer}>
                {TABS.map((tab) => (
                    <TouchableOpacity
                        key={tab.key}
                        style={styles.tab}
                        onPress={() => setActiveTab(tab.key)}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
                <Animated.View
                    style={[
                        styles.indicator,
                        {
                            transform: [{
                                translateX: indicatorPosition.interpolate({
                                    inputRange: [0, 1, 2],
                                    outputRange: [0, TAB_WIDTH, TAB_WIDTH * 2],
                                }),
                            }],
                        },
                    ]}
                />
            </View>

            {/* Content */}
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={studentColors.primary} />
                    <Text style={styles.loadingText}>Loading...</Text>
                </View>
            ) : error ? (
                <View style={styles.center}>
                    <Text style={styles.errorIcon}>⚠️</Text>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryBtn}>
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : items.length === 0 ? (
                <View style={styles.center}>
                    <Text style={styles.emptyIcon}>📭</Text>
                    <Text style={styles.emptyText}>No content available yet</Text>
                    <Text style={styles.emptySubText}>Check back later for updates</Text>
                </View>
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: studentColors.background,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: studentColors.surface,
        elevation: 2,
        position: 'relative',
    },
    tab: {
        flex: 1,
        paddingVertical: spacing.md,
        alignItems: 'center',
    },
    tabText: {
        fontSize: typography.size.md,
        fontWeight: typography.weight.semibold,
        color: studentColors.textMuted,
    },
    activeTabText: {
        color: studentColors.secondary,
    },
    indicator: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        height: 3,
        width: TAB_WIDTH,
        backgroundColor: studentColors.secondary,
        borderTopLeftRadius: 3,
        borderTopRightRadius: 3,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xxl,
    },
    loadingText: {
        fontSize: typography.size.md,
        color: studentColors.textMuted,
        marginTop: spacing.md,
    },
    errorIcon: {
        fontSize: 48,
        marginBottom: spacing.md,
    },
    errorText: {
        fontSize: typography.size.md,
        color: studentColors.error,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    retryBtn: {
        backgroundColor: studentColors.secondary,
        paddingHorizontal: spacing.xxl,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.xl,
    },
    retryText: {
        color: studentColors.textInverse,
        fontWeight: typography.weight.semibold,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: spacing.md,
    },
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
        backgroundColor: studentColors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconText: {
        fontSize: 24,
    },
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
        lineHeight: typography.lineHeight.md,
    },
    chevron: {
        fontSize: 24,
        color: studentColors.textMuted,
        fontWeight: typography.weight.bold,
        marginLeft: spacing.sm,
    },
});
