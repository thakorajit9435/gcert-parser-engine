import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Animated, Dimensions, RefreshControl } from 'react-native';
import { useSessions } from '../../hooks/useSessions';
import { useStandardContext } from '../../context/StandardContext';
import { studentColors, typography, spacing, borderRadius, shadows } from '../../theme';
import { Skeleton } from '../../components/common/Skeleton';

const { width } = Dimensions.get('window');
const TAB_WIDTH = width / 2;

export function SessionScreen({ navigation }: { route: any; navigation: any }): React.JSX.Element {
    const { selectedStandard } = useStandardContext();
    const standardId = selectedStandard;
    const { sessions, loading, refresh } = useSessions(standardId);
    const [activeTab, setActiveTab] = useState<'1' | '2'>('1');
    const [refreshing, setRefreshing] = useState(false);
    const indicatorPosition = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.spring(indicatorPosition, {
            toValue: activeTab === '1' ? 0 : 1, // 0 for tab 1, 1 for tab 2
            useNativeDriver: true,
            bounciness: 0,
            speed: 12,
        }).start();
    }, [activeTab, indicatorPosition]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        if (refresh) {refresh();}
        setTimeout(() => setRefreshing(false), 800);
    }, [refresh]);

    const filteredSessions = sessions.filter((s: any) => s.session === activeTab);

    const handleSessionTypePress = (type: string, title?: string) => {
        switch (type) {
            case 'language':
                navigation.navigate('LanguageSection', {
                    standardId, session: activeTab,
                });
                break;
            case 'blueprint':
                navigation.navigate('BlueprintList', {
                    standardId, session: activeTab,
                });
                break;
            case 'oldPapers':
                navigation.navigate('OldPapersList', {
                    standardId, session: activeTab,
                });
                break;
            default:
                navigation.navigate('SubjectAndChapterList', {
                    standardId, session: activeTab, sessionType: type, sessionTitle: title,
                });
                break;
        }
    };

    const renderSkeleton = () => (
        <View style={styles.listContent}>
            {[1, 2, 3].map((_, i) => (
                <View key={i} style={styles.card}>
                    <Skeleton width={48} height={48} borderRadius={24} />
                    <View style={styles.info}>
                        <Skeleton width={120} height={16} />
                        <Skeleton width={200} height={12} style={{ marginTop: 8 }} />
                        <Skeleton width="100%" height={4} style={{ marginTop: 12 }} />
                    </View>
                </View>
            ))}
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Top Tabs */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={styles.tab}
                    onPress={() => setActiveTab('1')}
                    activeOpacity={0.8}
                >
                    <Text style={[styles.tabText, activeTab === '1' && styles.activeTabText]}>સત્ર 1</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.tab}
                    onPress={() => setActiveTab('2')}
                    activeOpacity={0.8}
                >
                    <Text style={[styles.tabText, activeTab === '2' && styles.activeTabText]}>સત્ર 2</Text>
                </TouchableOpacity>

                {/* Animated Indicator */}
                <Animated.View
                    style={[
                        styles.indicator,
                        {
                            transform: [
                                {
                                    translateX: indicatorPosition.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0, TAB_WIDTH],
                                    }),
                                },
                            ],
                        },
                    ]}
                />
            </View>

            {/* List */}
            {loading && !refreshing ? (
                renderSkeleton()
            ) : filteredSessions.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>📭</Text>
                    <Text style={styles.emptyText}>કોઈ ડેટા ઉપલબ્ધ નથી</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredSessions}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    initialNumToRender={10}
                    maxToRenderPerBatch={8}
                    windowSize={5}
                    removeClippedSubviews={true}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[studentColors.primary]}
                            tintColor={studentColors.primary}
                        />
                    }
                    renderItem={({ item, index }) => {
                        // Dummy progress for visual completeness as requested
                        const dummyProgress = Math.max(10, 80 - index * 20);

                        return (
                            <TouchableOpacity
                                style={styles.card}
                                onPress={() => handleSessionTypePress(item.type, item.title)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.iconContainer}>
                                    <Text style={styles.icon}>
                                        {item.type === 'textbook' ? '📘' :
                                            item.type === 'mcq' ? '❓' :
                                                item.type === 'swadhyay' ? '📝' : '➕'}
                                    </Text>
                                </View>
                                <View style={styles.info}>
                                    <View style={styles.titleRow}>
                                        <Text style={styles.title}>{item.title || item.type}</Text>
                                        <Text style={styles.progressPercent}>{dummyProgress}%</Text>
                                    </View>
                                    <Text style={styles.subtitle}>View standard {standardId} {item.title || item.type}</Text>

                                    <View style={styles.progressTrack}>
                                        <View style={[styles.progressFill, { width: `${dummyProgress}%` }]} />
                                    </View>
                                </View>
                                <Text style={styles.chevron}>›</Text>
                            </TouchableOpacity>
                        );
                    }}
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
    indicator: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        height: 3,
        width: TAB_WIDTH,
        backgroundColor: studentColors.primary,
        borderTopLeftRadius: 3,
        borderTopRightRadius: 3,
    },
    tabText: {
        fontSize: typography.size.md,
        fontWeight: typography.weight.semibold,
        color: studentColors.textMuted,
    },
    activeTabText: {
        color: studentColors.primary,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: spacing.huge,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: spacing.md,
    },
    emptyText: {
        fontSize: typography.size.md,
        color: studentColors.textMuted,
    },
    listContent: {
        padding: spacing.xl,
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
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: studentColors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    icon: {
        fontSize: 24,
    },
    info: {
        flex: 1,
        marginLeft: spacing.md,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: typography.size.lg,
        fontWeight: typography.weight.semibold,
        color: studentColors.textPrimary,
    },
    progressPercent: {
        fontSize: typography.size.xs,
        fontWeight: typography.weight.bold,
        color: studentColors.primary,
    },
    subtitle: {
        fontSize: typography.size.sm,
        color: studentColors.textMuted,
        marginTop: 2,
    },
    progressTrack: {
        height: 4,
        backgroundColor: studentColors.border,
        borderRadius: 2,
        marginTop: spacing.sm,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: studentColors.primary,
        borderRadius: 2,
    },
    chevron: {
        fontSize: 24,
        color: studentColors.textMuted,
        fontWeight: typography.weight.bold,
        marginLeft: spacing.sm,
    },
});
