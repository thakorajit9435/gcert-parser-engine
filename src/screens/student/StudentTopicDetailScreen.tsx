import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { studentColors, typography, spacing, borderRadius, shadows } from '../../theme';
import { CMSTopic } from '../../types/cms.types';

export function StudentTopicDetailScreen({ route, navigation }: { route: any; navigation: any }): React.JSX.Element {
  const { topicId } = route.params;

  const [topic, setTopic] = useState<CMSTopic | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<'gu' | 'en'>('gu');

  useEffect(() => {
    if (!topicId) return;

    const fetchTopic = async () => {
      try {
        const doc = await firestore().collection('topics').doc(topicId).get();
        if (doc.exists) {
          const data = doc.data() as CMSTopic;
          
          // Map schema keys to unified properties
          const mapped: CMSTopic = {
            ...data,
            id: doc.id,
            topicName: data.topicName || data.title_en || '',
            topicNameGujarati: data.topicNameGujarati || data.title_gu || '',
            description: data.description || data.content_gu || '',
            estimatedReadingTime: data.estimatedReadingTime || 5,
            difficulty: data.difficulty || data.difficulty_level || 'medium',
            keywords: data.keywords || data.ai_keywords || [],
          };
          
          setTopic(mapped);
        } else {
          Alert.alert('Error', 'Topic not found');
          navigation.goBack();
        }
      } catch (err) {
        console.error('Error loading topic detail:', err);
        Alert.alert('Error', 'Failed to load topic details');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    fetchTopic();
  }, [topicId]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={studentColors.secondary} />
        <Text style={styles.loadingText}>વિષય લોડ થઈ રહ્યો છે...</Text>
      </View>
    );
  }

  if (!topic) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>માહિતી ઉપલબ્ધ નથી.</Text>
      </View>
    );
  }

  const hasEnglishContent = !!topic.content_en;
  const contentText = language === 'gu' ? topic.description : (topic.content_en || topic.description);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header card */}
      <View style={styles.headerCard}>
        <Text style={styles.topicTitleGu}>{topic.topicNameGujarati}</Text>
        <Text style={styles.topicTitleEn}>{topic.topicName}</Text>

        {/* Metadata row */}
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>⏱️ {topic.estimatedReadingTime} મિનિટ વાંચન</Text>
          <View style={[
            styles.difficultyBadge,
            topic.difficulty === 'easy' ? styles.difficultyEasy :
            topic.difficulty === 'hard' ? styles.difficultyHard : styles.difficultyMedium
          ]}>
            <Text style={styles.difficultyText}>{topic.difficulty}</Text>
          </View>
        </View>

        {/* Keywords */}
        {topic.keywords && topic.keywords.length > 0 && (
          <View style={styles.keywordsContainer}>
            {topic.keywords.map((kw, i) => (
              <View key={i} style={styles.keywordBadge}>
                <Text style={styles.keywordText}>#{kw}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Language Switcher if English content exists */}
      {hasEnglishContent && (
        <View style={styles.switcherContainer}>
          <TouchableOpacity
            style={[styles.switchBtn, language === 'gu' && styles.switchBtnActive]}
            onPress={() => setLanguage('gu')}
          >
            <Text style={[styles.switchBtnText, language === 'gu' && styles.switchBtnTextActive]}>ગુજરાતી</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.switchBtn, language === 'en' && styles.switchBtnActive]}
            onPress={() => setLanguage('en')}
          >
            <Text style={[styles.switchBtnText, language === 'en' && styles.switchBtnTextActive]}>English</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Topic Content Body */}
      <View style={styles.contentCard}>
        <Text style={styles.contentHeader}>વિગતવાર સમજૂતી (Detailed Explanation)</Text>
        <Text style={styles.contentText}>{contentText}</Text>
      </View>

      {/* AI Tutor Explanation Trigger */}
      <TouchableOpacity
        style={styles.aiTutorTriggerCard}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('AITutor', { subject: topic.subject_id, topic: topic.topicNameGujarati })}
      >
        <Ionicons name="chatbubble-ellipses" size={22} color="#FFFFFF" style={{ marginRight: 8 }} />
        <Text style={styles.aiTutorTriggerText}>🤖 AI ટ્યુટર સાથે આ વિષય સમજો (Explain with AI)</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: studentColors.background,
  },
  scrollContent: {
    padding: spacing.lg,
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
  errorText: {
    color: studentColors.error,
    fontSize: typography.size.md,
  },
  headerCard: {
    backgroundColor: studentColors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: studentColors.border,
    ...shadows.sm,
  },
  topicTitleGu: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    color: studentColors.textPrimary,
  },
  topicTitleEn: {
    fontSize: typography.size.md,
    color: studentColors.textSecondary,
    marginTop: spacing.xxs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: studentColors.border + '30',
    paddingTop: spacing.sm,
  },
  metaText: {
    fontSize: typography.size.sm,
    color: studentColors.textMuted,
  },
  difficultyBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.sm,
  },
  difficultyEasy: {
    backgroundColor: '#D1FAE5',
  },
  difficultyMedium: {
    backgroundColor: '#FEF3C7',
  },
  difficultyHard: {
    backgroundColor: '#FEE2E2',
  },
  difficultyText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    textTransform: 'uppercase',
    color: studentColors.textPrimary,
  },
  keywordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  keywordBadge: {
    backgroundColor: studentColors.surfaceHover,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: studentColors.border,
  },
  keywordText: {
    fontSize: typography.size.xs,
    color: studentColors.textSecondary,
  },
  switcherContainer: {
    flexDirection: 'row',
    backgroundColor: studentColors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xxs,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: studentColors.border,
    alignSelf: 'flex-start',
  },
  switchBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  switchBtnActive: {
    backgroundColor: studentColors.primary,
  },
  switchBtnText: {
    fontSize: typography.size.sm,
    color: studentColors.textSecondary,
    fontWeight: typography.weight.medium,
  },
  switchBtnTextActive: {
    color: studentColors.textInverse,
    fontWeight: typography.weight.bold,
  },
  contentCard: {
    backgroundColor: studentColors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: studentColors.border,
    ...shadows.sm,
  },
  contentHeader: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: studentColors.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: studentColors.border,
    paddingBottom: spacing.sm,
    marginBottom: spacing.md,
  },
  contentText: {
    fontSize: typography.size.md,
    lineHeight: typography.lineHeight.md,
    color: studentColors.textPrimary,
  },
  aiTutorTriggerCard: {
    backgroundColor: studentColors.secondary,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    ...shadows.sm,
  },
  aiTutorTriggerText: {
    color: '#FFFFFF',
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
  },
});
