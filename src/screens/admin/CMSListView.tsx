import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  TextInput,
  Switch,
} from 'react-native';
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { adminColors, typography, spacing, borderRadius } from '../../theme';
import { getCMSItemsPaginated, softDeleteCMSItem, restoreCMSItem } from '../../services/firebase/cms.service';
import { COLLECTIONS } from '../../constants';
import { CMSBulkImportModal } from './CMSBulkImportModal';

export function CMSListView({ route, navigation }: { route: any; navigation: any }): React.JSX.Element {
  const { moduleName, collectionName, topicId, chapterId, subjectId, standardId, standardNumber } = route.params;

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showDeleted, setShowDeleted] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [importModalVisible, setImportModalVisible] = useState(false);

  const lastDocRef = useRef<FirebaseFirestoreTypes.QueryDocumentSnapshot | null>(null);
  const pageSize = 15;

  const fetchItems = useCallback(async (isLoadMore = false, overrideShowDeleted?: boolean) => {
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      lastDocRef.current = null;
    }

    // Build filters based on parent context
    const filters: Array<{ field: string; operator: FirebaseFirestoreTypes.WhereFilterOp; value: unknown }> = [];
    
    if (collectionName === COLLECTIONS.TEXTBOOKS) {
      if (subjectId) {
        filters.push({ field: 'subject_id', operator: '==', value: subjectId });
      } else if (standardId) {
        filters.push({ field: 'standard_id', operator: '==', value: standardId });
      }
    } else {
      if (topicId) {
        filters.push({ field: 'topic_id', operator: '==', value: topicId });
      } else if (chapterId) {
        filters.push({ field: 'chapter_id', operator: '==', value: chapterId });
      } else if (subjectId) {
        filters.push({ field: 'subject_id', operator: '==', value: subjectId });
      }
    }

    // Map search field based on collection
    let searchField = 'title_gu';
    if (collectionName === COLLECTIONS.GLOSSARY) {
      searchField = 'word_gu';
    } else if (collectionName === COLLECTIONS.LEARNING_OUTCOMES) {
      searchField = 'outcome_text_gu';
    } else if (collectionName === COLLECTIONS.QUESTION_BANK || collectionName === COLLECTIONS.MCQ_BANK) {
      searchField = 'question_text_gu';
    }

    const shouldIncludeDeleted = overrideShowDeleted !== undefined ? overrideShowDeleted : showDeleted;

    const result = await getCMSItemsPaginated<any>(
      collectionName,
      pageSize,
      lastDocRef.current,
      filters,
      searchText,
      searchField,
      shouldIncludeDeleted
    );

    if (result.success && result.data) {
      const newItems = result.data.data;
      lastDocRef.current = result.data.lastDoc;
      setHasMore(result.data.hasMore);

      if (isLoadMore) {
        setItems(prev => [...prev, ...newItems]);
      } else {
        setItems(newItems);
      }
    } else {
      Alert.alert('Error', result.error || 'Failed to fetch items');
    }

    setLoading(false);
    setLoadingMore(false);
    setRefreshing(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName, topicId, chapterId, subjectId, searchText]);

  // Re-fetch whenever showDeleted toggles - pass it directly to avoid stale closure
  useEffect(() => {
    setItems([]);
    setHasMore(true);
    lastDocRef.current = null;
    fetchItems(false, showDeleted);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDeleted]);

  // Initial fetch
  useEffect(() => {
    fetchItems();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch on screen focus (handles additions/updates)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setItems([]);
      setHasMore(true);
      lastDocRef.current = null;
      fetchItems();
    });
    return unsubscribe;
  }, [navigation, fetchItems]);

  const handleSearch = () => {
    fetchItems();
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setItems([]);
    setHasMore(true);
    lastDocRef.current = null;
    await fetchItems();
  }, [fetchItems]);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !loadingMore && !loading) {
      fetchItems(true);
    }
  }, [hasMore, loadingMore, loading, fetchItems]);

  const handleToggleDelete = async (item: any) => {
    const action = item.isDeleted ? 'Restore' : 'Delete';
    Alert.alert(
      `${action} Item`,
      `Are you sure you want to ${action.toLowerCase()} this item?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action,
          style: item.isDeleted ? 'default' : 'destructive',
          onPress: async () => {
            const res = item.isDeleted
              ? await restoreCMSItem(collectionName, item.id)
              : await softDeleteCMSItem(collectionName, item.id);

            if (res.success) {
              Alert.alert('Success', `Item ${action.toLowerCase()}d successfully`);
              fetchItems();
            } else {
              Alert.alert('Error', res.error || 'Operation failed');
            }
          },
        },
      ]
    );
  };

  const getItemTitle = (item: any) => {
    if (collectionName === COLLECTIONS.GLOSSARY) {
      return `${item.word_gu} (${item.word_en})`;
    }
    if (collectionName === COLLECTIONS.LEARNING_OUTCOMES) {
      return item.outcome_text_gu;
    }
    if (collectionName === COLLECTIONS.QUESTION_BANK || collectionName === COLLECTIONS.MCQ_BANK) {
      return item.question_text_gu;
    }
    return item.title_gu || item.title || 'Untitled';
  };

  const getItemMeta = (item: any) => {
    if (collectionName === COLLECTIONS.GLOSSARY) {
      return item.definition_gu;
    }
    if (collectionName === COLLECTIONS.LEARNING_OUTCOMES) {
      return `Bloom Level: ${item.bloom_level} • Verb: ${item.measurable_verb_gu}`;
    }
    if (collectionName === COLLECTIONS.QUESTION_BANK) {
      return `Type: ${item.question_type} • Marks: ${item.marks} • Bloom: ${item.bloom_level}`;
    }
    if (collectionName === COLLECTIONS.MCQ_BANK) {
      return `Marks: ${item.marks} • Options: ${item.options?.length || 0} • Correct: ${item.correct_option_id}`;
    }
    if (collectionName === COLLECTIONS.FLASHCARDS) {
      return `Card Type: ${item.card_type} • Difficulty: ${item.difficulty_level}`;
    }
    if (collectionName === COLLECTIONS.WORKSHEETS) {
      return `Type: ${item.worksheet_type} • Questions: ${item.total_questions} • Marks: ${item.total_marks}`;
    }
    if (collectionName === COLLECTIONS.VIDEOS) {
      return `Source: ${item.video_source} • Duration: ${Math.round(item.duration_seconds / 60)} min`;
    }
    if (collectionName === COLLECTIONS.TEXTBOOKS) {
      return `Publisher: ${item.publisher} • Year: ${item.edition_year} • Pages: ${item.total_pages}`;
    }
    return `ID: ${item.id}`;
  };

  return (
    <View style={styles.container}>
      {/* Module Title Banner */}
      <View style={styles.moduleBanner}>
        <Text style={styles.moduleBannerText}>{moduleName}</Text>
        <Text style={styles.moduleBannerCount}>{items.length} items</Text>
      </View>

      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
            placeholder={`Search ${moduleName}…`}
            placeholderTextColor={adminColors.textMuted}
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
            <Text style={styles.searchBtnText}>🔍</Text>
          </TouchableOpacity>
        </View>

        {/* Filters */}
        <View style={styles.filtersRow}>
          <View style={styles.switchContainer}>
            <Text style={styles.filterLabel}>Show Deleted</Text>
            <Switch
              value={showDeleted}
              onValueChange={setShowDeleted}
              trackColor={{ false: adminColors.border, true: adminColors.primary + '60' }}
              thumbColor={showDeleted ? adminColors.primary : adminColors.textMuted}
            />
          </View>

          <View style={styles.actionButtonsContainer}>
            {(collectionName === COLLECTIONS.QUESTION_BANK || collectionName === COLLECTIONS.TOPICS || collectionName === COLLECTIONS.GLOSSARY) && (
              <TouchableOpacity
                style={styles.importButton}
                onPress={() => setImportModalVisible(true)}
              >
                <Text style={styles.importButtonText}>📥 Import</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.addButton}
              onPress={() =>
                navigation.navigate('CMSDetailForm', {
                  moduleName,
                  collectionName,
                  topicId,
                  chapterId,
                  subjectId,
                  standardId,
                  standardNumber,
                })
              }
            >
              <Text style={styles.addButtonText}>+ Add New</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {loading && items.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={adminColors.primary} />
          <Text style={styles.loadingText}>Fetching items…</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={adminColors.primary} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          renderItem={({ item }) => (
            <View style={[styles.card, item.isDeleted && styles.cardDeleted]}>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle} numberOfLines={2}>{getItemTitle(item)}</Text>
                <Text style={styles.cardMeta} numberOfLines={2}>{getItemMeta(item)}</Text>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() =>
                    navigation.navigate('CMSDetailForm', {
                      moduleName,
                      collectionName,
                      itemId: item.id,
                      topicId,
                      chapterId,
                      subjectId,
                      standardId,
                      standardNumber,
                    })
                  }
                >
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.deleteBtn, item.isDeleted && styles.restoreBtn]}
                  onPress={() => handleToggleDelete(item)}
                >
                  <Text style={styles.deleteBtnText}>{item.isDeleted ? 'Restore' : 'Delete'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={adminColors.primary} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyTitle}>No Items Found</Text>
              <Text style={styles.emptyMsg}>Add some content to get started.</Text>
            </View>
          }
        />
      )}

      <CMSBulkImportModal
        visible={importModalVisible}
        onClose={() => setImportModalVisible(false)}
        onImportSuccess={() => fetchItems()}
        collectionName={collectionName}
        moduleName={moduleName}
        topicId={topicId}
        chapterId={chapterId}
        subjectId={subjectId}
        standardId={standardId}
        standardNumber={standardNumber}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: adminColors.background,
  },
  moduleBanner: {
    backgroundColor: adminColors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moduleBannerText: {
    color: adminColors.textInverse,
    fontWeight: typography.weight.bold,
    fontSize: typography.size.sm,
  },
  moduleBannerCount: {
    color: adminColors.textInverse + 'BB',
    fontSize: typography.size.xs,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.size.sm,
    color: adminColors.textSecondary,
  },
  searchHeader: {
    padding: spacing.xl,
    backgroundColor: adminColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  searchBar: {
    flexDirection: 'row',
    backgroundColor: adminColors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: adminColors.textPrimary,
    fontSize: typography.size.sm,
  },
  searchBtn: {
    padding: spacing.md,
  },
  searchBtnText: {
    fontSize: 16,
  },
  filtersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  filterLabel: {
    fontSize: typography.size.xs,
    color: adminColors.textSecondary,
  },
  addButton: {
    backgroundColor: adminColors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  addButtonText: {
    color: adminColors.textInverse,
    fontWeight: typography.weight.bold,
    fontSize: typography.size.xs,
  },
  listContent: {
    padding: spacing.xl,
  },
  card: {
    backgroundColor: adminColors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardDeleted: {
    opacity: 0.5,
    borderColor: adminColors.accentRed,
  },
  cardInfo: {
    flex: 1,
    paddingRight: spacing.md,
  },
  cardTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: adminColors.textPrimary,
  },
  cardMeta: {
    fontSize: typography.size.xs,
    color: adminColors.textSecondary,
    marginTop: spacing.xs,
  },
  cardActions: {
    flexDirection: 'column',
    gap: spacing.sm,
  },
  editBtn: {
    backgroundColor: adminColors.surfaceElevated,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
  },
  editBtnText: {
    fontSize: typography.size.xs,
    color: adminColors.textPrimary,
  },
  deleteBtn: {
    backgroundColor: adminColors.error + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: adminColors.error,
    alignItems: 'center',
  },
  restoreBtn: {
    backgroundColor: adminColors.success + '20',
    borderColor: adminColors.success,
  },
  deleteBtnText: {
    fontSize: typography.size.xs,
    color: adminColors.textPrimary,
  },
  footerLoader: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    color: adminColors.textMuted,
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
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  importButton: {
    backgroundColor: adminColors.surface,
    borderWidth: 1,
    borderColor: adminColors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  importButtonText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: adminColors.primary,
  },
});
