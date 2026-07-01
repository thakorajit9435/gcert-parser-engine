import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    RefreshControl,
    ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../hooks/useAuth';
import { useBookmarks } from '../../hooks/useBookmarks';
import { useStandardContext } from '../../context/StandardContext';
import { UserBookmark } from '../../types';
import { studentColors, typography, spacing, borderRadius, shadows } from '../../theme';

export function BookmarkListScreen(): React.JSX.Element {
    const { userProfile } = useAuth();
    const navigation = useNavigation<any>();
    const { bookmarks, loading, error, toggle } = useBookmarks(userProfile?.uid);
    const { setSelectedStandard } = useStandardContext();

    const [searchQuery, setSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [deletingMap, setDeletingMap] = useState<{ [chapterId: string]: boolean }>({});

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        setTimeout(() => {
            setRefreshing(false);
        }, 800);
    }, []);

    const handleOpenBookmark = (item: UserBookmark) => {
        if (!item.chapterId) return;
        if (item.standardId) {
            setSelectedStandard(item.standardId);
        }
        // Navigate to the correct Subject first
        navigation.navigate('MainTabs', {
            screen: 'Subjects',
            params: {
                subjectId: item.subjectId,
                subjectName: item.subjectName,
            }
        });
        // Open the Chapter Detail screen
        navigation.navigate('ChapterDetail', { chapterId: item.chapterId });
    };

    const handleRemoveBookmark = async (item: UserBookmark) => {
        if (deletingMap[item.chapterId]) return;
        setDeletingMap(prev => ({ ...prev, [item.chapterId]: true }));
        try {
            await toggle(item.chapterId, item);
        } catch (err) {
            console.error('Failed to remove bookmark:', err);
        } finally {
            setDeletingMap(prev => ({ ...prev, [item.chapterId]: false }));
        }
    };

    // Filter bookmarks based on search query
    const filteredBookmarks = bookmarks.filter(bm =>
        (bm.chapterTitle || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (bm.subjectName || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderItem = ({ item }: { item: UserBookmark }) => (
        <View style={styles.card}>
            <TouchableOpacity
                style={styles.cardClickable}
                onPress={() => handleOpenBookmark(item)}
                activeOpacity={0.7}
            >
                <View style={styles.cardContent}>
                    <Text style={styles.subjectText}>{item.subjectName || 'Subject'}</Text>
                    <Text style={styles.titleText}>{item.chapterTitle || 'Chapter'}</Text>
                    <View style={styles.tag}>
                        <Text style={styles.tagText}>{item.standardName || `Std ${item.standardId || '—'}`}</Text>
                    </View>
                </View>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => handleRemoveBookmark(item)}
                disabled={deletingMap[item.chapterId]}
                activeOpacity={0.7}
            >
                {deletingMap[item.chapterId] ? (
                    <ActivityIndicator size="small" color={studentColors.error} style={{ width: 20, height: 20 }} />
                ) : (
                    <Ionicons name="trash-outline" size={20} color={studentColors.error} />
                )}
            </TouchableOpacity>
        </View>
    );

    if (loading && bookmarks.length === 0) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={studentColors.primary} />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorEmoji}>⚠️</Text>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    if (bookmarks.length === 0) {
        return (
            <View style={styles.container}>
                <ScrollView
                    contentContainerStyle={styles.center}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[studentColors.primary]}
                            tintColor={studentColors.primary}
                        />
                    }
                >
                    <Text style={styles.emptyEmoji}>🔖</Text>
                    <Text style={styles.emptyText}>No Bookmarks Found</Text>
                    <Text style={styles.emptySubText}>Start bookmarking chapters to access them quickly.</Text>
                </ScrollView>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Search Input */}
            <View style={styles.searchContainer}>
                <Ionicons name="search-outline" size={20} color={studentColors.textMuted} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search bookmarks or subjects..."
                    placeholderTextColor={studentColors.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    clearButtonMode="while-editing"
                />
            </View>

            {filteredBookmarks.length === 0 ? (
                <ScrollView
                    contentContainerStyle={styles.center}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[studentColors.primary]}
                            tintColor={studentColors.primary}
                        />
                    }
                >
                    <Text style={styles.emptyEmoji}>🔍</Text>
                    <Text style={styles.emptyText}>No Results Found</Text>
                    <Text style={styles.emptySubText}>No bookmarks match "{searchQuery}"</Text>
                </ScrollView>
            ) : (
                <FlatList
                    data={filteredBookmarks}
                    keyExtractor={(item) => item.id || `${item.userId}_${item.chapterId}`}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    initialNumToRender={10}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[studentColors.primary]}
                            tintColor={studentColors.primary}
                        />
                    }
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
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: studentColors.surface,
        borderRadius: borderRadius.md,
        margin: spacing.lg,
        paddingHorizontal: spacing.md,
        borderWidth: 1,
        borderColor: studentColors.border,
        ...shadows.sm,
    },
    searchIcon: {
        marginRight: spacing.sm,
    },
    searchInput: {
        flex: 1,
        height: 44,
        fontSize: typography.size.md,
        color: studentColors.textPrimary,
    },
    emptyEmoji: {
        fontSize: 48,
        marginBottom: spacing.md,
    },
    emptyText: {
        fontSize: typography.size.lg,
        fontWeight: typography.weight.bold,
        color: studentColors.textPrimary,
        marginBottom: spacing.xs,
    },
    emptySubText: {
        fontSize: typography.size.md,
        color: studentColors.textSecondary,
        textAlign: 'center',
    },
    errorEmoji: {
        fontSize: 48,
        marginBottom: spacing.md,
    },
    errorText: {
        fontSize: typography.size.md,
        color: studentColors.error,
        textAlign: 'center',
        fontWeight: typography.weight.medium,
    },
    listContent: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.lg,
    },
    card: {
        backgroundColor: studentColors.surface,
        borderRadius: borderRadius.lg,
        paddingLeft: spacing.lg,
        marginBottom: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: studentColors.border,
        ...shadows.sm,
    },
    cardClickable: {
        flex: 1,
        paddingVertical: spacing.lg,
    },
    cardContent: {
        flex: 1,
        paddingRight: spacing.md,
    },
    subjectText: {
        fontSize: typography.size.xs,
        color: studentColors.secondary,
        fontWeight: typography.weight.bold,
        textTransform: 'uppercase',
        marginBottom: spacing.xxs,
    },
    titleText: {
        fontSize: typography.size.md,
        fontWeight: typography.weight.semibold,
        color: studentColors.textPrimary,
        marginBottom: spacing.sm,
    },
    tag: {
        backgroundColor: studentColors.surfaceHover,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xxs,
        borderRadius: borderRadius.sm,
        alignSelf: 'flex-start',
    },
    tagText: {
        fontSize: typography.size.xs,
        color: studentColors.textSecondary,
        fontWeight: typography.weight.medium,
    },
    removeBtn: {
        padding: spacing.lg,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
