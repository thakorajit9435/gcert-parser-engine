import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { adminColors, typography, spacing, borderRadius } from '../../theme';
import { COLLECTIONS } from '../../constants';

interface ModuleDef {
  title: string;
  icon: string;
  collection: string;
  detailOnly?: boolean;
  color: string;
}

export function TopicCMSDashboard({ route, navigation }: { route: any; navigation: any }): React.JSX.Element {
  const { topicId, topicTitle, chapterId, subjectId, standardId, standardNumber } = route.params;

  const handleModulePress = (moduleName: string, collectionName: string, detailOnly: boolean = false) => {
    if (detailOnly) {
      navigation.navigate('CMSDetailForm', {
        moduleName,
        collectionName,
        itemId: topicId,
        chapterId,
        subjectId,
        standardId,
        standardNumber,
      });
    } else {
      navigation.navigate('CMSListView', {
        moduleName,
        collectionName,
        topicId,
        chapterId,
        subjectId,
        standardId,
        standardNumber,
      });
    }
  };

  const renderModuleCard = (mod: ModuleDef) => {
    return (
      <TouchableOpacity
        key={mod.collection + mod.title}
        style={[styles.moduleCard, { borderLeftColor: mod.color, borderLeftWidth: 3 }]}
        onPress={() => handleModulePress(mod.title, mod.collection, mod.detailOnly)}
        activeOpacity={0.7}
      >
        <Text style={styles.moduleIcon}>{mod.icon}</Text>
        <Text style={styles.moduleTitle}>{mod.title}</Text>
        <Text style={[styles.moduleArrow, { color: mod.color }]}>›</Text>
      </TouchableOpacity>
    );
  };

  const settingsModules: ModuleDef[] = [
    { title: 'Edit Topic Details', icon: '✏️', collection: COLLECTIONS.TOPICS, detailOnly: true, color: adminColors.primary },
  ];

  const academicModules: ModuleDef[] = [
    { title: 'Learning Outcomes', icon: '🎯', collection: COLLECTIONS.LEARNING_OUTCOMES, color: '#3B82F6' },
    { title: 'Flashcards', icon: '🃏', collection: COLLECTIONS.FLASHCARDS, color: '#8B5CF6' },
    { title: 'Glossary', icon: '🔤', collection: COLLECTIONS.GLOSSARY, color: '#10B981' },
    { title: 'Videos', icon: '🎥', collection: COLLECTIONS.VIDEOS, color: '#F59E0B' },
  ];

  const assessmentModules: ModuleDef[] = [
    { title: 'Question Bank', icon: '📁', collection: COLLECTIONS.QUESTION_BANK, color: '#EF4444' },
    { title: 'MCQ Bank', icon: '🧪', collection: COLLECTIONS.MCQ_BANK, color: '#EC4899' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>{topicTitle}</Text>
        <Text style={styles.subtitle}>Topic Content Dashboard</Text>
      </View>

      <Text style={styles.sectionHeader}>🛠️ Topic Settings</Text>
      <View style={styles.modulesGrid}>
        {settingsModules.map(renderModuleCard)}
      </View>

      <Text style={styles.sectionHeader}>📂 Academic Content</Text>
      <View style={styles.modulesGrid}>
        {academicModules.map(renderModuleCard)}
      </View>

      <Text style={styles.sectionHeader}>📝 Assessments</Text>
      <View style={styles.modulesGrid}>
        {assessmentModules.map(renderModuleCard)}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: adminColors.background,
  },
  content: {
    paddingBottom: spacing.xxl,
  },
  header: {
    padding: spacing.xl,
    backgroundColor: adminColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
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
});
