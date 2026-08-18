import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Linking,
  Alert,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { studentColors, typography, spacing, borderRadius, shadows } from '../../theme';

export function StudentResourceListScreen({ route, navigation }: { route: any; navigation: any }): React.JSX.Element {
  const { resourceType, chapterId } = route.params;

  const [items, setItems] = useState<any[]>([]);
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  const collectionMap: Record<string, string> = {
    textbooks: 'textbooks',
    videos: 'videos',
    worksheets: 'worksheets',
    lesson_plans: 'lesson_plans',
    glossary: 'glossary',
  };

  useEffect(() => {
    if (!chapterId || !resourceType) return;

    const fetchResources = async () => {
      try {
        const collectionName = collectionMap[resourceType];
        if (!collectionName) return;

        let data: any[] = [];
        if (resourceType === 'textbooks') {
          // Textbook spans the entire subject, not a specific chapter.
          const chapDoc = await firestore().collection('chapters').doc(chapterId).get();
          const chapData = chapDoc.data();
          if (chapData) {
            const subjectId = chapData.subjectId || chapData.subject_id;

            // Fetch subject Gujarati name for listing visibility
            let subjectNameGu = '';
            const subDoc = await firestore().collection('subjects').doc(subjectId).get();
            const subData = subDoc.data();
            if (subData) {
              subjectNameGu = subData.nameGu || subData.name || '';
            }

            const snapshot = await firestore()
              .collection('textbooks')
              .where('subject_id', '==', subjectId)
              .get();
            // Attach the chapter page boundaries so PdfViewerScreen opens at the right page
            data = snapshot.docs.map(doc => ({
              id: doc.id,
              subjectNameGu: subjectNameGu,
              _chapterStartPage: chapData.startPage ?? undefined,
              _chapterEndPage: chapData.endPage ?? undefined,
              _chapterBookStartPage: chapData.bookStartPage ?? undefined,
              ...doc.data(),
            }));
          }
        } else {
          const snapshot = await firestore()
            .collection(collectionName)
            .where('chapter_id', '==', chapterId)
            .get();
          data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
        }

        // Filter out soft-deleted items client-side
        data = data.filter((item: any) => item.isDeleted !== true);

        // Sort items by display order if present
        data.sort((a: any, b: any) => {
          const orderA = a.order !== undefined ? a.order : (a.display_order || 99);
          const orderB = b.order !== undefined ? b.order : (b.display_order || 99);
          return orderA - orderB;
        });

        setItems(data);
        setFilteredItems(data);
      } catch (err) {
        console.error('Error fetching resources:', err);
        Alert.alert('Error', 'Failed to load resources');
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, [chapterId, resourceType]);

  const handleSearch = (text: string) => {
    setSearchText(text);
    if (!text.trim()) {
      setFilteredItems(items);
      return;
    }

    const lower = text.toLowerCase();
    const filtered = items.filter(item => {
      const matchWord = item.title_gu || item.title_en || item.word_gu || item.word_en || '';
      const matchDef = item.definition_gu || item.definition_en || item.description || '';
      return (
        matchWord.toLowerCase().includes(lower) ||
        matchDef.toLowerCase().includes(lower)
      );
    });
    setFilteredItems(filtered);
  };

  const handleItemPress = async (item: any) => {
    if (resourceType === 'textbooks' || resourceType === 'worksheets') {
      if (!item.pdf_url) {
        Alert.alert('Notice', 'No PDF file linked to this resource.');
        return;
      }
      // Pass chapter page boundaries so PdfViewerScreen opens to the right chapter page
      const chapterStartPage = item._chapterStartPage || undefined;
      const chapterEndPage = item._chapterEndPage || undefined;
      const chapterBookStartPage = item._chapterBookStartPage || undefined;

      navigation.navigate('PdfViewer', {
        url: item.pdf_url,
        title: item.title_gu || item.title || 'PDF Document',
        pdfId: item.id,
        pdfType: resourceType,
        startPage: chapterStartPage,
        endPage: chapterEndPage,
        bookStartPage: chapterBookStartPage,
      });
    } else if (resourceType === 'videos') {
      if (!item.video_url) {
        Alert.alert('Notice', 'No video link available.');
        return;
      }
      const canOpen = await Linking.canOpenURL(item.video_url).catch(() => false);
      if (canOpen) {
        await Linking.openURL(item.video_url);
      } else {
        Alert.alert('Error', 'Unable to play video URL on this device.');
      }
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    if (resourceType === 'glossary') {
      return (
        <View style={styles.glossaryCard}>
          <View style={styles.glossaryHeader}>
            <Text style={styles.glossaryWordGu}>{item.word_gu}</Text>
            {item.word_en ? <Text style={styles.glossaryWordEn}>{item.word_en}</Text> : null}
          </View>
          <Text style={styles.glossaryDef}>{item.definition_gu}</Text>
        </View>
      );
    }

    if (resourceType === 'lesson_plans') {
      return (
        <View style={styles.planCard}>
          <Text style={styles.planTitle}>{item.title_gu || item.title}</Text>
          <Text style={styles.planMeta}>⏱️ Periods: {item.total_periods} | Duration: {item.period_duration_min} mins</Text>
          
          {item.periods && item.periods.length > 0 && (
            <View style={styles.periodsList}>
              <Text style={styles.periodsHeader}>Timeline / Activity Outlines:</Text>
              {item.periods.map((p: any, idx: number) => (
                <View key={idx} style={styles.periodRow}>
                  <Text style={styles.periodNum}>P{p.period_number || idx + 1}</Text>
                  <View style={styles.periodContent}>
                    <Text style={styles.periodTitle}>{p.topic_title_gu}</Text>
                    {p.activities_gu && p.activities_gu.map((act: string, actIdx: number) => (
                      <Text key={actIdx} style={styles.periodActivity}>• {act}</Text>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={styles.resourceCard}
        onPress={() => handleItemPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.resourceHeader}>
          <Text style={styles.resourceEmoji}>
            {resourceType === 'textbooks' ? '📘' : resourceType === 'videos' ? '🎥' : '📝'}
          </Text>
          <View style={styles.resourceInfo}>
            <Text style={styles.resourceTitle}>{item.title_gu || item.title || 'Untitled Resource'}</Text>
            {resourceType === 'textbooks' && item.subjectNameGu ? (
              <Text style={styles.resourceSubject}>વિષય: {item.subjectNameGu}</Text>
            ) : null}
            {resourceType === 'videos' && item.duration_seconds ? (
              <Text style={styles.resourceDuration}>Duration: {Math.round(item.duration_seconds / 60)} mins</Text>
            ) : null}
            {item.publisher ? (
              <Text style={styles.resourcePublisher}>Publisher: {item.publisher}</Text>
            ) : null}
          </View>
          <Text style={styles.chevron}>➔</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={studentColors.primary} />
        <Text style={styles.loadingText}>સંસાધનો લોડ થઈ રહ્યા છે...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Input for Glossary or filters */}
      {resourceType === 'glossary' && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            value={searchText}
            onChangeText={handleSearch}
            placeholder="શબ્દ અથવા વ્યાખ્યા શોધો... (Search...)"
            placeholderTextColor={studentColors.textMuted}
          />
        </View>
      )}

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>કોઈ સામગ્રી ઉપલબ્ધ નથી (No resources available).</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: studentColors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: studentColors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    color: studentColors.textSecondary,
    fontSize: typography.size.sm,
  },
  listContent: {
    padding: spacing.lg,
  },
  searchContainer: {
    padding: spacing.md,
    backgroundColor: studentColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: studentColors.border,
  },
  searchInput: {
    backgroundColor: studentColors.background,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    fontSize: typography.size.sm,
    color: studentColors.textPrimary,
    borderWidth: 1,
    borderColor: studentColors.border,
  },
  resourceCard: {
    backgroundColor: studentColors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: studentColors.border,
    ...shadows.sm,
  },
  resourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resourceEmoji: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  resourceInfo: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: studentColors.textPrimary,
  },
  resourceDuration: {
    fontSize: typography.size.xs,
    color: studentColors.textMuted,
    marginTop: 2,
  },
  resourcePublisher: {
    fontSize: typography.size.xs,
    color: studentColors.textMuted,
    marginTop: 2,
  },
  resourceSubject: {
    fontSize: typography.size.xs,
    color: studentColors.primary,
    fontWeight: typography.weight.bold,
    marginTop: 2,
  },
  chevron: {
    fontSize: 16,
    color: studentColors.textMuted,
  },
  glossaryCard: {
    backgroundColor: studentColors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: studentColors.border,
    ...shadows.sm,
  },
  glossaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: studentColors.border + '30',
    paddingBottom: spacing.xs,
    marginBottom: spacing.sm,
  },
  glossaryWordGu: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: studentColors.textPrimary,
  },
  glossaryWordEn: {
    fontSize: typography.size.xs,
    color: studentColors.textSecondary,
  },
  glossaryDef: {
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.md,
    color: studentColors.textPrimary,
  },
  planCard: {
    backgroundColor: studentColors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: studentColors.border,
    ...shadows.sm,
  },
  planTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: studentColors.textPrimary,
    marginBottom: spacing.xs,
  },
  planMeta: {
    fontSize: typography.size.xs,
    color: studentColors.textMuted,
    marginBottom: spacing.md,
  },
  periodsList: {
    borderTopWidth: 1,
    borderTopColor: studentColors.border + '50',
    paddingTop: spacing.md,
  },
  periodsHeader: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: studentColors.textSecondary,
    marginBottom: spacing.sm,
  },
  periodRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  periodNum: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: studentColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: studentColors.textPrimary,
    textAlign: 'center',
    textAlignVertical: 'center',
    marginRight: spacing.sm,
    overflow: 'hidden',
  },
  periodContent: {
    flex: 1,
  },
  periodTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: studentColors.textPrimary,
    marginBottom: 4,
  },
  periodActivity: {
    fontSize: typography.size.xs,
    color: studentColors.textSecondary,
    lineHeight: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    fontSize: typography.size.sm,
    color: studentColors.textMuted,
    textAlign: 'center',
  },
});
