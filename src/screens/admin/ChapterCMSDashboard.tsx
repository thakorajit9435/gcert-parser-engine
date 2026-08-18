import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  useWindowDimensions,
  Alert,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { adminColors, typography, spacing, borderRadius } from '../../theme';
import { COLLECTIONS } from '../../constants';
import { CMSTopic } from '../../types/cms.types';

export function ChapterCMSDashboard({ route, navigation }: { route: any; navigation: any }): React.JSX.Element {
  const { chapterId, chapterTitle, subjectId, standardId, standardNumber } = route.params;

  const [topics, setTopics] = useState<CMSTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const fetchTopics = useCallback(async () => {
    try {
      const snapshot = await firestore()
        .collection(COLLECTIONS.TOPICS)
        .where('chapter_id', '==', chapterId)
        .where('isDeleted', '==', false)
        .orderBy('display_order', 'asc')
        .get();

      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as CMSTopic[];

      setTopics(data);
    } catch (err) {
      console.error('Fetch topics error:', err);
      setTopics([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [chapterId]);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  // Refresh data when screen receives focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchTopics();
    });
    return unsubscribe;
  }, [navigation, fetchTopics]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTopics();
  }, [fetchTopics]);

  const handleModulePress = (moduleName: string, collectionName: string) => {
    navigation.navigate('CMSListView', {
      moduleName,
      collectionName,
      chapterId,
      subjectId,
      standardId,
      standardNumber,
    });
  };

  const handleDeleteTopic = useCallback((item: CMSTopic) => {
    Alert.alert(
      'Delete Topic',
      `Delete "${item.title_gu}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await firestore()
                .collection(COLLECTIONS.TOPICS)
                .doc(item.id)
                .update({ isDeleted: true, updatedAt: firestore.FieldValue.serverTimestamp() });
              fetchTopics();
            } catch (err) {
              Alert.alert('Error', (err as Error).message);
            }
          },
        },
      ]
    );
  }, [fetchTopics]);

  interface ModuleCardDef {
    title: string;
    icon: string;
    collection: string;
    color: string;
  }

  const chapterModules: ModuleCardDef[] = [
    { title: 'Worksheets', icon: '📄', collection: COLLECTIONS.WORKSHEETS, color: '#3B82F6' },
    { title: 'Lesson Plans', icon: '📋', collection: COLLECTIONS.LESSON_PLANS, color: '#8B5CF6' },
    { title: 'Textbooks', icon: '📖', collection: COLLECTIONS.TEXTBOOKS, color: '#10B981' },
    { title: 'Glossary', icon: '🔤', collection: COLLECTIONS.GLOSSARY, color: '#F59E0B' },
  ];

  const renderModuleCard = (mod: ModuleCardDef) => {
    return (
      <TouchableOpacity
        key={mod.collection}
        style={[styles.moduleCard, { borderLeftColor: mod.color, borderLeftWidth: 3 }]}
        onPress={() => handleModulePress(mod.title, mod.collection)}
        activeOpacity={0.7}
      >
        <Text style={styles.moduleIcon}>{mod.icon}</Text>
        <Text style={styles.moduleTitle}>{mod.title}</Text>
        <Text style={[styles.moduleArrow, { color: mod.color }]}>›</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTextArea}>
          <Text style={styles.title} numberOfLines={1}>{chapterTitle}</Text>
          <Text style={styles.subtitle}>Chapter Content Dashboard</Text>
        </View>
        <TouchableOpacity
          style={styles.editChapterBtn}
          onPress={() => navigation.navigate('AddEditChapter', {
            subjectId,
            chapterId,
          })}
        >
          <Text style={styles.editChapterBtnText}>✏️ Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Grid of Chapter-Level Modules */}
      <Text style={styles.sectionHeader}>📂 Chapter Resources</Text>
      <View style={styles.modulesGrid}>
        {chapterModules.map(renderModuleCard)}
      </View>

      {/* Assessments Section */}
      <Text style={styles.sectionHeader}>📝 Assessments</Text>
      <View style={styles.modulesGrid}>
        <TouchableOpacity
          style={[styles.moduleCard, { borderLeftColor: '#EF4444', borderLeftWidth: 3 }]}
          onPress={() => handleModulePress('Question Bank', COLLECTIONS.QUESTION_BANK)}
          activeOpacity={0.7}
        >
          <Text style={styles.moduleIcon}>📁</Text>
          <Text style={styles.moduleTitle}>Question Bank</Text>
          <Text style={[styles.moduleArrow, { color: '#EF4444' }]}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.moduleCard, { borderLeftColor: '#EC4899', borderLeftWidth: 3 }]}
          onPress={() => handleModulePress('MCQ Bank', COLLECTIONS.MCQ_BANK)}
          activeOpacity={0.7}
        >
          <Text style={styles.moduleIcon}>🧪</Text>
          <Text style={styles.moduleTitle}>MCQ Bank</Text>
          <Text style={[styles.moduleArrow, { color: '#EC4899' }]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Topics Section */}
      <View style={styles.topicsHeaderRow}>
        <Text style={styles.sectionHeader}>📚 Topics ({topics.length})</Text>
        <TouchableOpacity
          style={styles.addTopicBtn}
          onPress={() =>
            navigation.navigate('CMSDetailForm', {
              moduleName: 'Topic',
              collectionName: COLLECTIONS.TOPICS,
              chapterId,
              subjectId,
              standardId,
              standardNumber,
            })
          }
        >
          <Text style={styles.addTopicText}>+ Add Topic</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={adminColors.primary} />
        </View>
      ) : (
        <FlatList
          data={topics}
          keyExtractor={(item) => item.id}
          numColumns={isTablet ? 2 : 1}
          key={isTablet ? 'tablet' : 'phone'}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={adminColors.primary} />
          }
          renderItem={({ item }) => (
            <View style={[styles.topicCard, isTablet && styles.topicCardTablet]}>
              <TouchableOpacity
                style={styles.topicCardLeft}
                onPress={() =>
                  navigation.navigate('TopicCMSDashboard', {
                    topicId: item.id,
                    topicTitle: item.title_gu,
                    chapterId,
                    subjectId,
                    standardId,
                    standardNumber,
                  })
                }
                activeOpacity={0.7}
              >
                <View style={styles.topicInfo}>
                  <Text style={styles.topicTitleText} numberOfLines={2}>{item.title_gu}</Text>
                  <Text style={styles.topicSubtitleText} numberOfLines={1}>{item.title_en}</Text>
                  <Text style={styles.topicMeta}>
                    {item.content_type} • Order {item.display_order}
                    {item.is_premium ? ' • 💎' : ''}
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>

              {/* Quick action buttons */}
              <View style={styles.topicActions}>
                <TouchableOpacity
                  style={styles.topicEditBtn}
                  onPress={() =>
                    navigation.navigate('CMSDetailForm', {
                      moduleName: 'Topic',
                      collectionName: COLLECTIONS.TOPICS,
                      itemId: item.id,
                      chapterId,
                      subjectId,
                      standardId,
                      standardNumber,
                    })
                  }
                >
                  <Text style={styles.topicEditBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.topicDeleteBtn}
                  onPress={() => handleDeleteTopic(item)}
                >
                  <Text style={styles.topicDeleteBtnText}>Del</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📚</Text>
              <Text style={styles.emptyTitle}>No Topics Created</Text>
              <Text style={styles.emptyMsg}>Add topics to build this chapter's content.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: adminColors.background,
  },
  centered: {
    padding: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: spacing.xl,
    backgroundColor: adminColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTextArea: {
    flex: 1,
    marginRight: spacing.md,
  },
  title: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: adminColors.textPrimary,
  },
  subtitle: {
    fontSize: typography.size.xs,
    color: adminColors.textSecondary,
    marginTop: spacing.xxs,
  },
  editChapterBtn: {
    backgroundColor: adminColors.surfaceElevated,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  editChapterBtnText: {
    fontSize: typography.size.xs,
    color: adminColors.textPrimary,
    fontWeight: typography.weight.semibold,
  },
  sectionHeader: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: adminColors.textPrimary,
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  modulesGrid: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  moduleCard: {
    backgroundColor: adminColors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  moduleIcon: {
    fontSize: 22,
    marginRight: spacing.md,
  },
  moduleTitle: {
    flex: 1,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: adminColors.textPrimary,
  },
  moduleArrow: {
    fontSize: 22,
    fontWeight: typography.weight.bold,
  },
  topicsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: spacing.xl,
    marginTop: spacing.xs,
  },
  addTopicBtn: {
    backgroundColor: adminColors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  addTopicText: {
    color: adminColors.textInverse,
    fontWeight: typography.weight.bold,
    fontSize: typography.size.xs,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.sm,
  },
  topicCard: {
    backgroundColor: adminColors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    overflow: 'hidden',
  },
  topicCardTablet: {
    width: '48%',
    marginRight: '2%',
  },
  topicCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  topicInfo: {
    flex: 1,
  },
  topicTitleText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: adminColors.textPrimary,
  },
  topicSubtitleText: {
    fontSize: typography.size.xs,
    color: adminColors.textSecondary,
    marginTop: 2,
  },
  topicMeta: {
    fontSize: typography.size.xs,
    color: adminColors.textMuted,
    marginTop: spacing.xxs,
  },
  chevron: {
    fontSize: 22,
    color: adminColors.textMuted,
    fontWeight: typography.weight.bold,
  },
  topicActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  topicEditBtn: {
    flex: 1,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: adminColors.border,
    backgroundColor: adminColors.primary + '10',
  },
  topicEditBtnText: {
    fontSize: typography.size.xs,
    color: adminColors.primary,
    fontWeight: typography.weight.semibold,
  },
  topicDeleteBtn: {
    flex: 1,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    backgroundColor: adminColors.error + '10',
  },
  topicDeleteBtnText: {
    fontSize: typography.size.xs,
    color: adminColors.error,
    fontWeight: typography.weight.semibold,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: adminColors.textPrimary,
  },
  emptyMsg: {
    fontSize: typography.size.xs,
    color: adminColors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xxs,
    paddingHorizontal: spacing.xl,
  },
});
