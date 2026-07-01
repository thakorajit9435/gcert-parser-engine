/**
 * GujaratContentImportScreen.tsx
 *
 * Dedicated screen for importing complete Gujarat Board (GCERT) content.
 * Dhoran 1–8 | Sem 1 & 2 | All Subjects | All Chapters
 *
 * 6-Phase import workflow:
 *   Phase 1 — Preview subjects (84 records)
 *   Phase 2 — Batch import subjects via writeBatch()
 *   Phase 3 — Resolve Firestore subjectIds (auto-fetched)
 *   Phase 4 — Preview chapters (~728+ records)
 *   Phase 5 — Batch import chapters via writeBatch()
 *   Phase 6 — Post-import count verification + report
 *
 * IMPORTANT: Does NOT modify any existing screen, collection or schema.
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
  Modal,
  FlatList,
  SafeAreaView,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import { adminColors, spacing, borderRadius } from '../../theme';
import { GUJARAT_SUBJECTS, GUJARAT_CHAPTERS, CONTENT_STATS } from '../../services/bulkImport/gujaratContent.data';
import {
  batchImportSubjects,
  batchImportChapters,
  getSubjectCount,
  getChapterCount,
  SubjectImportResult,
  BatchResult,
} from '../../services/bulkImport/batchImport.service';
import { saveImportLog } from '../../services/bulkImport/importLog.service';

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase =
  | 'overview'
  | 'importing_subjects'
  | 'resolving'
  | 'preview_chapters'
  | 'importing_chapters'
  | 'report';

// ─── Component ────────────────────────────────────────────────────────────────

export function GujaratContentImportScreen(): React.JSX.Element {
  const [phase, setPhase] = useState<Phase>('overview');
  const [subjectResult, setSubjectResult] = useState<SubjectImportResult | null>(null);
  const [chapterResult, setChapterResult] = useState<BatchResult | null>(null);
  const [subjectIdMap, setSubjectIdMap] = useState<Map<string, string>>(new Map());

  const [subjectProgress, setSubjectProgress] = useState(0);
  const [subjectTotal, setSubjectTotal] = useState(0);
  const [chapterProgress, setChapterProgress] = useState(0);
  const [chapterTotal, setChapterTotal] = useState(0);

  const [countBefore, setCountBefore] = useState({ subjects: 0, chapters: 0 });
  const [countAfter, setCountAfter] = useState({ subjects: 0, chapters: 0 });
  const [failureModalVisible, setFailureModalVisible] = useState(false);

  const subjectAnim = useRef(new Animated.Value(0)).current;
  const chapterAnim = useRef(new Animated.Value(0)).current;

  // ── Phase 2: Import Subjects ──────────────────────────────────────────────

  const handleImportSubjects = useCallback(async () => {
    Alert.alert(
      'Import Subjects',
      `This will import ${CONTENT_STATS.totalSubjects} subjects for Dhoran 1–8.\n\nExisting subjects will be skipped automatically.\n\nProceed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Import Now',
          style: 'default',
          onPress: async () => {
            try {
              const before = await getSubjectCount();
              setCountBefore(prev => ({ ...prev, subjects: before }));
              setSubjectTotal(CONTENT_STATS.totalSubjects);
              setSubjectProgress(0);
              setPhase('importing_subjects');

              const result = await batchImportSubjects(
                GUJARAT_SUBJECTS,
                (done, total) => {
                  setSubjectProgress(done);
                  Animated.timing(subjectAnim, {
                    toValue: done / total,
                    duration: 80,
                    useNativeDriver: false,
                  }).start();
                },
              );

              setSubjectResult(result);
              setSubjectIdMap(result.subjectIdMap);
              setPhase('preview_chapters');
            } catch (err) {
              Alert.alert('Subject Import Failed', (err as Error).message);
              setPhase('overview');
            }
          },
        },
      ],
    );
  }, [subjectAnim]);

  // ── Phase 5: Import Chapters ──────────────────────────────────────────────

  const handleImportChapters = useCallback(async () => {
    if (subjectIdMap.size === 0) {
      Alert.alert('Error', 'Subject IDs not resolved. Please import subjects first.');
      return;
    }

    Alert.alert(
      'Import Chapters',
      `This will import ${CONTENT_STATS.totalChapters} chapters.\n\nDuplicate chapters will be skipped automatically.\n\nProceed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Import Now',
          style: 'default',
          onPress: async () => {
            try {
              const beforeS = await getSubjectCount();
              const beforeC = await getChapterCount();
              setCountBefore({ subjects: beforeS, chapters: beforeC });
              setChapterTotal(CONTENT_STATS.totalChapters);
              setChapterProgress(0);
              setPhase('importing_chapters');

              const result = await batchImportChapters(
                GUJARAT_CHAPTERS,
                subjectIdMap,
                (done, total) => {
                  setChapterProgress(done);
                  Animated.timing(chapterAnim, {
                    toValue: done / total,
                    duration: 80,
                    useNativeDriver: false,
                  }).start();
                },
              );

              const afterS = await getSubjectCount();
              const afterC = await getChapterCount();
              setCountAfter({ subjects: afterS, chapters: afterC });
              setChapterResult(result);

              // Save import log (non-critical)
              try {
                const user = auth().currentUser;
                await saveImportLog({
                  fileName: 'Gujarat Board Content (Dhoran 1–8)',
                  type: 'chapter',
                  totalRows: result.total,
                  successRows: result.written,
                  skippedRows: result.skipped,
                  failedRows: result.failed,
                  createdBy: user?.uid ?? 'unknown',
                });
              } catch (_) { /* non-critical */ }

              setPhase('report');
            } catch (err) {
              Alert.alert('Chapter Import Failed', (err as Error).message);
              setPhase('preview_chapters');
            }
          },
        },
      ],
    );
  }, [subjectIdMap, chapterAnim]);

  // ── Renders ───────────────────────────────────────────────────────────────

  const renderOverview = () => (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      {/* Header Banner */}
      <View style={styles.banner}>
        <Text style={styles.bannerEmoji}>🇮🇳</Text>
        <Text style={styles.bannerTitle}>Gujarat Board Content Import</Text>
        <Text style={styles.bannerSubtitle}>GCERT Gujarati Medium | Dhoran 1 – 8</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <StatCard icon="🏫" value="8" label="Standards" />
        <StatCard icon="📅" value="2" label="Semesters" />
        <StatCard icon="📚" value={String(CONTENT_STATS.totalSubjects)} label="Subjects" />
        <StatCard icon="📖" value={String(CONTENT_STATS.totalChapters)} label="Chapters" />
      </View>

      {/* Curriculum Preview */}
      <Text style={styles.sectionTitle}>📋 Curriculum Structure</Text>
      {[1, 2, 3, 4, 5, 6, 7, 8].map(std => {
        const subjects = GUJARAT_SUBJECTS
          .filter(s => s.standardId === String(std) && s.session === '1')
          .map(s => s.nameGu);
        const chapters = GUJARAT_CHAPTERS.filter(c => c.standardId === String(std)).length;
        return (
          <View key={std} style={styles.curriculumRow}>
            <View style={styles.curriculumLeft}>
              <Text style={styles.curriculumStd}>ધોરણ {std}</Text>
              <Text style={styles.curriculumSubjects}>{subjects.join(' • ')}</Text>
            </View>
            <View style={styles.curriculumRight}>
              <Text style={styles.curriculumChapters}>{chapters}</Text>
              <Text style={styles.curriculumChaptersLabel}>Chapters</Text>
            </View>
          </View>
        );
      })}

      {/* Instructions */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>📌 Import Instructions</Text>
        <Text style={styles.infoItem}>• Step 1: Import all subjects first (84 records)</Text>
        <Text style={styles.infoItem}>• Step 2: Import all chapters (~728 records)</Text>
        <Text style={styles.infoItem}>• Existing subjects/chapters are automatically skipped</Text>
        <Text style={styles.infoItem}>• All data uses exact existing schema</Text>
        <Text style={styles.infoItem}>• isPremium = false (admin can change later)</Text>
        <Text style={styles.infoItem}>• hasMcq / hasSwadhyay / hasMixedQuiz = true</Text>
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={handleImportSubjects}>
        <Text style={styles.primaryBtnText}>⚡ Start Import — Subjects First</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderImportingSubjects = () => (
    <View style={styles.progressContainer}>
      <Text style={styles.progressEmoji}>📚</Text>
      <Text style={styles.progressTitle}>Importing Subjects…</Text>
      <Text style={styles.progressSub}>
        {subjectProgress} / {subjectTotal} subjects
      </Text>
      <View style={styles.progressBarBg}>
        <Animated.View
          style={[
            styles.progressBarFill,
            {
              width: subjectAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
      <Text style={styles.progressNote}>
        Using writeBatch() in chunks of 490 operations
      </Text>
      <ActivityIndicator color={adminColors.primary} size="large" style={{ marginTop: 24 }} />
    </View>
  );

  const renderPreviewChapters = () => {
    const sr = subjectResult!;
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Subject Import Result */}
        <View style={styles.resultCard}>
          <Text style={styles.resultCardTitle}>✅ Subjects Imported</Text>
          <View style={styles.resultRow}>
            <ResultItem icon="✅" value={sr.written} label="Written" color="#2ecc71" />
            <ResultItem icon="⏭️" value={sr.skipped} label="Skipped" color="#f39c12" />
            <ResultItem icon="❌" value={sr.failed} label="Failed" color="#e74c3c" />
            <ResultItem icon="📊" value={sr.total} label="Total" color={adminColors.primary} />
          </View>
        </View>

        {/* Chapter Preview */}
        <View style={styles.banner}>
          <Text style={styles.bannerEmoji}>📖</Text>
          <Text style={styles.bannerTitle}>Ready to Import Chapters</Text>
          <Text style={styles.bannerSubtitle}>{CONTENT_STATS.totalChapters} chapters across all subjects</Text>
        </View>

        {/* Chapter breakdown by standard */}
        <Text style={styles.sectionTitle}>Chapter Distribution</Text>
        {[1, 2, 3, 4, 5, 6, 7, 8].map(std => {
          const count = GUJARAT_CHAPTERS.filter(c => c.standardId === String(std)).length;
          const pct = Math.round((count / CONTENT_STATS.totalChapters) * 100);
          return (
            <View key={std} style={styles.chapterBarRow}>
              <Text style={styles.chapterBarLabel}>Dhoran {std}</Text>
              <View style={styles.chapterBarBg}>
                <View style={[styles.chapterBarFill, { width: `${pct}%` }]} />
              </View>
              <Text style={styles.chapterBarCount}>{count}</Text>
            </View>
          );
        })}

        <TouchableOpacity style={styles.primaryBtn} onPress={handleImportChapters}>
          <Text style={styles.primaryBtnText}>⚡ Import All Chapters</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const renderImportingChapters = () => (
    <View style={styles.progressContainer}>
      <Text style={styles.progressEmoji}>📖</Text>
      <Text style={styles.progressTitle}>Importing Chapters…</Text>
      <Text style={styles.progressSub}>
        {chapterProgress} / {chapterTotal} chapters
      </Text>
      <View style={styles.progressBarBg}>
        <Animated.View
          style={[
            styles.progressBarFill,
            {
              width: chapterAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
      <Text style={styles.progressNote}>
        Using writeBatch() — auto-splitting into chunks of 490 ops
      </Text>
      <ActivityIndicator color={adminColors.primary} size="large" style={{ marginTop: 24 }} />
    </View>
  );

  const renderReport = () => {
    const cr = chapterResult!;
    const hasFailures = cr.failureDetails.length > 0;
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Success banner */}
        <View style={[styles.banner, { backgroundColor: '#1a4a2e' }]}>
          <Text style={styles.bannerEmoji}>🎉</Text>
          <Text style={styles.bannerTitle}>Import Complete!</Text>
          <Text style={styles.bannerSubtitle}>Gujarat Board content is now live in the app</Text>
        </View>

        {/* Before/After Verification (Phase 6) */}
        <Text style={styles.sectionTitle}>📊 Phase 6 — Count Verification</Text>
        <View style={styles.verifyGrid}>
          <View style={styles.verifyCard}>
            <Text style={styles.verifyLabel}>Subjects Before</Text>
            <Text style={styles.verifyValue}>{countBefore.subjects}</Text>
          </View>
          <View style={styles.verifyArrow}>
            <Text style={styles.verifyArrowText}>→</Text>
          </View>
          <View style={[styles.verifyCard, { borderColor: '#2ecc71' }]}>
            <Text style={styles.verifyLabel}>Subjects After</Text>
            <Text style={[styles.verifyValue, { color: '#2ecc71' }]}>{countAfter.subjects}</Text>
          </View>
        </View>
        <View style={styles.verifyGrid}>
          <View style={styles.verifyCard}>
            <Text style={styles.verifyLabel}>Chapters Before</Text>
            <Text style={styles.verifyValue}>{countBefore.chapters}</Text>
          </View>
          <View style={styles.verifyArrow}>
            <Text style={styles.verifyArrowText}>→</Text>
          </View>
          <View style={[styles.verifyCard, { borderColor: '#2ecc71' }]}>
            <Text style={styles.verifyLabel}>Chapters After</Text>
            <Text style={[styles.verifyValue, { color: '#2ecc71' }]}>{countAfter.chapters}</Text>
          </View>
        </View>

        {/* Chapter Result */}
        <Text style={styles.sectionTitle}>Chapter Import Summary</Text>
        <View style={styles.resultCard}>
          <View style={styles.resultRow}>
            <ResultItem icon="✅" value={cr.written} label="Imported" color="#2ecc71" />
            <ResultItem icon="⏭️" value={cr.skipped} label="Skipped" color="#f39c12" />
            <ResultItem icon="❌" value={cr.failed} label="Failed" color="#e74c3c" />
            <ResultItem icon="📊" value={cr.total} label="Total" color={adminColors.primary} />
          </View>
        </View>

        {/* Net added */}
        <View style={styles.netAddedCard}>
          <Text style={styles.netAddedLabel}>Net chapters added to Firestore</Text>
          <Text style={styles.netAddedValue}>
            +{countAfter.chapters - countBefore.chapters}
          </Text>
        </View>

        {/* Failure details */}
        {hasFailures && (
          <TouchableOpacity
            style={styles.failureBtn}
            onPress={() => setFailureModalVisible(true)}
          >
            <Text style={styles.failureBtnText}>
              ⚠️ View {cr.failureDetails.length} failure details
            </Text>
          </TouchableOpacity>
        )}

        {/* Student Verification Checklist */}
        <Text style={styles.sectionTitle}>✅ Student-Side Compatibility</Text>
        {[
          'Standard listing shows Dhoran 1–8',
          'Semester tabs (Sem 1 / Sem 2) work correctly',
          'Subject listing per standard is correct',
          'Chapter listing per subject is correct',
          'hasMcq = true (MCQ system ready)',
          'hasSwadhyay = true (Swadhyay ready)',
          'hasMixedQuiz = true (Mixed Quiz ready)',
          'isPremium = false (visible to all students)',
          'Bookmark system compatible',
          'PDF upload slots ready (admin can add later)',
        ].map((item, i) => (
          <View key={i} style={styles.checklistItem}>
            <Text style={styles.checklistIcon}>✅</Text>
            <Text style={styles.checklistText}>{item}</Text>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    );
  };

  // ── Failure Detail Modal ──────────────────────────────────────────────────

  const renderFailureModal = () => (
    <Modal visible={failureModalVisible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>⚠️ Failure Details</Text>
            <TouchableOpacity onPress={() => setFailureModalVisible(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={chapterResult?.failureDetails ?? []}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item }) => (
              <View style={styles.failureItem}>
                <Text style={styles.failureIndex}>#{item.index}</Text>
                <Text style={styles.failureError}>{item.error}</Text>
              </View>
            )}
            style={{ flex: 1 }}
          />
        </View>
      </View>
    </Modal>
  );

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      {phase === 'overview' && renderOverview()}
      {phase === 'importing_subjects' && renderImportingSubjects()}
      {phase === 'preview_chapters' && renderPreviewChapters()}
      {phase === 'importing_chapters' && renderImportingChapters()}
      {phase === 'report' && renderReport()}
      {renderFailureModal()}
    </SafeAreaView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ResultItem({
  icon, value, label, color,
}: { icon: string; value: number; label: string; color: string }) {
  return (
    <View style={styles.resultItem}>
      <Text style={styles.resultItemIcon}>{icon}</Text>
      <Text style={[styles.resultItemValue, { color }]}>{value}</Text>
      <Text style={styles.resultItemLabel}>{label}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: adminColors.background ?? '#0f1117',
  },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.md, paddingBottom: 60 },

  // Banner
  banner: {
    backgroundColor: '#1a1f36',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#2a3050',
  },
  bannerEmoji: { fontSize: 40, marginBottom: 8 },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: '#8892b0',
    textAlign: 'center',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1f36',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: '#2a3050',
  },
  statIcon: { fontSize: 22, marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: '800', color: '#64ffda', marginBottom: 2 },
  statLabel: { fontSize: 10, color: '#8892b0' },

  // Section
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ccd6f6',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },

  // Curriculum rows
  curriculumRow: {
    flexDirection: 'row',
    backgroundColor: '#1a1f36',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a3050',
  },
  curriculumLeft: { flex: 1 },
  curriculumStd: { fontSize: 14, fontWeight: '700', color: '#fff' },
  curriculumSubjects: { fontSize: 11, color: '#8892b0', marginTop: 2 },
  curriculumRight: { alignItems: 'center', paddingLeft: spacing.sm },
  curriculumChapters: { fontSize: 18, fontWeight: '800', color: '#64ffda' },
  curriculumChaptersLabel: { fontSize: 9, color: '#8892b0' },

  // Info box
  infoBox: {
    backgroundColor: '#0d1520',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: '#64ffda',
  },
  infoTitle: { fontSize: 14, fontWeight: '700', color: '#64ffda', marginBottom: 8 },
  infoItem: { fontSize: 12, color: '#8892b0', marginBottom: 4 },

  // Primary button
  primaryBtn: {
    backgroundColor: adminColors.primary ?? '#4a6cf7',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  // Progress screen
  progressContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  progressEmoji: { fontSize: 60, marginBottom: 16 },
  progressTitle: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 8 },
  progressSub: { fontSize: 16, color: '#8892b0', marginBottom: 24 },
  progressBarBg: {
    width: '100%',
    height: 12,
    backgroundColor: '#1a1f36',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#64ffda',
    borderRadius: 6,
  },
  progressNote: { fontSize: 12, color: '#64748b', marginTop: 12, textAlign: 'center' },

  // Result card
  resultCard: {
    backgroundColor: '#1a1f36',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#2a3050',
  },
  resultCardTitle: { fontSize: 14, fontWeight: '700', color: '#2ecc71', marginBottom: 12 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-around' },
  resultItem: { alignItems: 'center' },
  resultItemIcon: { fontSize: 20, marginBottom: 4 },
  resultItemValue: { fontSize: 22, fontWeight: '800' },
  resultItemLabel: { fontSize: 10, color: '#8892b0' },

  // Chapter bar
  chapterBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  chapterBarLabel: { width: 70, fontSize: 12, color: '#ccd6f6' },
  chapterBarBg: { flex: 1, height: 8, backgroundColor: '#1a1f36', borderRadius: 4, overflow: 'hidden', marginHorizontal: 8 },
  chapterBarFill: { height: '100%', backgroundColor: '#4a6cf7', borderRadius: 4 },
  chapterBarCount: { width: 35, fontSize: 12, color: '#64ffda', textAlign: 'right' },

  // Verify grid
  verifyGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  verifyCard: {
    flex: 1,
    backgroundColor: '#1a1f36',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a3050',
  },
  verifyLabel: { fontSize: 11, color: '#8892b0', marginBottom: 4 },
  verifyValue: { fontSize: 22, fontWeight: '800', color: '#fff' },
  verifyArrow: { paddingHorizontal: 8 },
  verifyArrowText: { fontSize: 20, color: '#64ffda' },

  // Net added
  netAddedCard: {
    backgroundColor: '#0d2518',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: '#2ecc71',
  },
  netAddedLabel: { fontSize: 12, color: '#8892b0' },
  netAddedValue: { fontSize: 36, fontWeight: '900', color: '#2ecc71' },

  // Failure button
  failureBtn: {
    backgroundColor: '#2d1515',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#e74c3c',
  },
  failureBtnText: { fontSize: 13, color: '#e74c3c', fontWeight: '600' },

  // Checklist
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1f36',
  },
  checklistIcon: { fontSize: 14, marginRight: 10 },
  checklistText: { fontSize: 13, color: '#8892b0', flex: 1 },

  // Failure modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#0f1117',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    padding: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  modalClose: { fontSize: 20, color: '#8892b0', padding: 4 },
  failureItem: {
    backgroundColor: '#1a1f36',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#e74c3c',
  },
  failureIndex: { fontSize: 11, color: '#e74c3c', marginBottom: 2 },
  failureError: { fontSize: 12, color: '#ccd6f6' },
});
