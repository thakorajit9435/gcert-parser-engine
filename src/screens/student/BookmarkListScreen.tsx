import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { subscribeToBookmarks } from '../../services/firebase/bookmark.service';
import { UserBookmark } from '../../types';
import { studentColors, typography, spacing, borderRadius, shadows } from '../../theme';

export function BookmarkListScreen(): React.JSX.Element {
    const { t } = useTranslation();
    const { userProfile } = useAuth();
    const navigation = useNavigation<any>();
    const [bookmarks, setBookmarks] = useState<UserBookmark[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userProfile?.uid) {
            setLoading(false);
            return;
        }

        const unsubscribe = subscribeToBookmarks(
            userProfile.uid,
            (data) => {
                setBookmarks(data);
                setLoading(false);
            },
            (error) => {
                console.error('Error fetching bookmarks:', error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [userProfile?.uid]);

    const renderItem = ({ item }: { item: UserBookmark }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('ChapterDetail', { chapterId: item.chapterId })}
            activeOpacity={0.7}
        >
            <View style={styles.cardContent}>
                <Text style={styles.subjectText}>{item.subjectName}</Text>
                <Text style={styles.titleText}>{item.chapterTitle}</Text>
                <View style={styles.tag}>
                    <Text style={styles.tagText}>Standard {item.standardId}</Text>
                </View>
            </View>
            <Text style={styles.actionIcon}>➡️</Text>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={studentColors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {bookmarks.length === 0 ? (
                <View style={styles.center}>
                    <Text style={styles.emptyEmoji}>🔖</Text>
                    <Text style={styles.emptyText}>{t('common.noData')}</Text>
                    <Text style={styles.emptySubText}>Save chapters you want to revisit later.</Text>
                </View>
            ) : (
                <FlatList
                    data={bookmarks}
                    keyExtractor={(item) => item.id || `${item.userId}_${item.chapterId}`}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    initialNumToRender={10}
                    maxToRenderPerBatch={10}
                    windowSize={5}
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
    listContent: {
        padding: spacing.lg,
    },
    card: {
        backgroundColor: studentColors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: studentColors.border,
        ...shadows.sm,
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
    actionIcon: {
        fontSize: 18,
        color: studentColors.textMuted,
    },
});
