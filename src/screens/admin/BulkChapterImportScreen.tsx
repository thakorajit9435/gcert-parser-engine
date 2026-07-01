/**
 * BulkChapterImportScreen.tsx
 *
 * Six-phase bulk import for Chapters:
 *   Phase 1 — Schema verification (fetch real Firestore doc)
 *   Phase 2 — Uses createChapter() from content.service.ts (same as Add Chapter)
 *   Phase 3 — Payload Preview before import
 *   Phase 4 — Firestore Structure Validation (key comparison)
 *   Phase 5 — Dry Run / Safe Import Mode (preview only, no save)
 *   Phase 6 — Post-Import Verification (count check)
 *
 * ADDITIVE ONLY — does NOT touch AddEditChapterScreen or any existing code.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Share,
  FlatList,
  Animated,
  Modal,
} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import RNFetchBlob from 'react-native-blob-util';
import auth from '@react-native-firebase/auth';
import { adminColors, typography, spacing, borderRadius } from '../../theme';
import { parseCSV, generateCSV } from '../../services/bulkImport/csvParser';
import {
  validateChapterRows,
  importChapters,
  validateChapterSchemaAgainstFirestore,
  ChapterImportRow,
  ChapterImportPreview,
  ChapterCreatePayload,
  CHAPTER_CSV_TEMPLATE_HEADERS,
  CHAPTER_CSV_TEMPLATE_ROWS,
} from '../../services/bulkImport/chapterImport.service';
import { saveImportLog, fetchImportLogs, ImportLog } from '../../services/bulkImport/importLog.service';
import { getTotalChapters } from '../../services/firebase/content.service';

// ─── Step Types ───────────────────────────────────────────────────────────────

type Step =
  | 'upload'
  | 'schema_check'
  | 'validating'
  | 'dry_run'
  | 'importing'
  | 'report'
  | 'history';

// ─── Screen ───────────────────────────────────────────────────────────────────

export function BulkChapterImportScreen(): React.JSX.Element | null {
  const [step, setStep] = useState<Step>('upload');
  const [fileName, setFileName] = useState('');
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [preview, setPreview] = useState<ChapterImportPreview | null>(null);
  const [importResult, setImportResult] = useState<{
    imported: number; skipped: number; failed: number;
    failureDetails: { rowIndex: number; title: string; reason: string }[];
    countBefore: number; countAfter: number;
  } | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressTotal, setProgressTotal] = useState(0);
  const [logs, setLogs] = useState<ImportLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [schemaDoc, setSchemaDoc] = useState<Record<string, unknown> | null>(null);
  const [selectedPayload, setSelectedPayload] = useState<ChapterCreatePayload | null>(null);
  const [payloadModalVisible, setPayloadModalVisible] = useState(false);
  const progressAnim = React.useRef(new Animated.Value(0)).current;

  const handleDownloadTemplate = useCallback(async () => {
    try {
      const csv = generateCSV(CHAPTER_CSV_TEMPLATE_HEADERS, CHAPTER_CSV_TEMPLATE_ROWS);
      await Share.share({ message: csv, title: 'chapter_import_template.csv' });
    } catch (err) {
      Alert.alert('Error', 'Could not share template: ' + (err as Error).message);
    }
  }, []);

  // ─── File Picker ──────────────────────────────────────────────────────────

  const handlePickFile = useCallback(async () => {
    try {
      const res = await DocumentPicker.pickSingle({
        // Use allFiles so iOS shows CSV files regardless of how they were created
        // (Google Sheets export, Numbers, Excel, Files app, etc.)
        // Extension validation (.csv) is enforced below.
        type: [DocumentPicker.types.allFiles],
        copyTo: 'cachesDirectory',
      });

      const uri = (res.fileCopyUri || res.uri) ?? '';
      const name = res.name || 'file.csv';

      if (!name.toLowerCase().endsWith('.csv')) {
        Alert.alert('Invalid File', 'Please select a .csv file.');
        return;
      }

      setFileName(name);

      const fileUri = decodeURIComponent(uri.replace('file://', ''));
      const content = await RNFetchBlob.fs.readFile(fileUri, 'utf8');
      const { headers, rows, parseErrors: pErrors } = parseCSV(content);

      if (pErrors.length > 0) setParseErrors(pErrors);

      const required = ['standardid', 'subjectid', 'title', 'titlegu', 'order'];
      const missing = required.filter(h => !headers.includes(h));
      if (missing.length > 0) {
        Alert.alert(
          'Invalid CSV Format',
          `Missing required columns: ${missing.join(', ')}\n\nDownload the template for the correct format.`,
        );
        return;
      }

      setRawRows(rows);

      // Phase 4: Schema check
      setStep('schema_check');
      const schemaResult = await validateChapterSchemaAgainstFirestore();
      if (!schemaResult.valid) {
        Alert.alert('Schema Validation Failed', schemaResult.error ?? 'Unknown error');
        setStep('upload');
        return;
      }
      if (schemaResult.existingDoc) {
        setSchemaDoc(schemaResult.existingDoc);
      }

      // Phase 1: Row validation
      setStep('validating');
      const result = await validateChapterRows(rows, (checked, total) => {
        setProgress(checked);
        setProgressTotal(total);
      });

      setPreview(result);
      setStep('dry_run');
    } catch (err) {
      if (DocumentPicker.isCancel(err)) return;
      Alert.alert('Error', (err as Error).message);
      setStep('upload');
    }
  }, []);

  // ─── Import ───────────────────────────────────────────────────────────────

  const handleConfirmImport = useCallback(async () => {
    if (!preview || preview.validRows.length === 0) {
      Alert.alert('Nothing to import', 'No valid rows found.');
      return;
    }

    const countBefore = await getTotalChapters();

    setProgress(0);
    setProgressTotal(preview.validRows.length);
    setStep('importing');

    try {
      const result = await importChapters(preview.validRows, (done, total) => {
        setProgress(done);
        Animated.timing(progressAnim, {
          toValue: done / total,
          duration: 80,
          useNativeDriver: false,
        }).start();
      });

      const countAfter = await getTotalChapters();

      const user = auth().currentUser;
      // saveImportLog is non-critical — a failure here must NOT mark the import as failed
      try {
        await saveImportLog({
          fileName,
          type: 'chapter',
          totalRows: preview.totalRows,
          successRows: result.imported,
          skippedRows: preview.duplicateRows.length + preview.invalidRows.length,
          failedRows: result.failed,
          createdBy: user?.uid ?? 'unknown',
        });
      } catch (logErr) {
        // Log failure is silently ignored — import result is still shown
        if (__DEV__) {
          console.warn('[BulkImport] importLog save failed:', logErr);
        }
      }

      setImportResult({
        imported: result.imported,
        skipped: preview.duplicateRows.length,
        failed: result.failed + preview.invalidRows.length,
        failureDetails: result.failureDetails,
        countBefore,
        countAfter,
      });
      setStep('report');
    } catch (err) {
      Alert.alert('Import Failed', (err as Error).message);
      setStep('dry_run');
    }
  }, [preview, fileName, progressAnim]);

  const loadHistory = useCallback(async () => {
    setLogsLoading(true);
    try {
      const data = await fetchImportLogs('chapter');
      setLogs(data);
    } catch (_err) {
      Alert.alert('Error', 'Could not load import history.');
    } finally {
      setLogsLoading(false);
    }
  }, []);

  const handleReset = useCallback(() => {
    setStep('upload');
    setFileName('');
    setRawRows([]);
    setPreview(null);
    setImportResult(null);
    setProgress(0);
    setProgressTotal(0);
    setParseErrors([]);
    setSchemaDoc(null);
    progressAnim.setValue(0);
  }, [progressAnim]);

  const openPayloadPreview = useCallback((payload: ChapterCreatePayload) => {
    setSelectedPayload(payload);
    setPayloadModalVisible(true);
  }, []);

  // ─── Render Helpers ───────────────────────────────────────────────────────

  const renderStatusBadge = (status: 'valid' | 'duplicate' | 'invalid') => {
    const configs = {
      valid: { bg: adminColors.success + '25', color: adminColors.success, label: '✅ Valid' },
      duplicate: { bg: adminColors.warning + '25', color: adminColors.warning, label: '⚠️ Dup' },
      invalid: { bg: adminColors.error + '25', color: adminColors.error, label: '❌ Invalid' },
    };
    const c = configs[status];
    return (
      <View style={[styles.badge, { backgroundColor: c.bg }]}>
        <Text style={[styles.badgeText, { color: c.color }]}>{c.label}</Text>
      </View>
    );
  };

  const allPreviewRows: ChapterImportRow[] = preview
    ? [...preview.validRows, ...preview.duplicateRows, ...preview.invalidRows]
      .sort((a, b) => a.rowIndex - b.rowIndex)
    : [];

  // ─── Upload Step ──────────────────────────────────────────────────────────

  if (step === 'upload') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroCard}>
          <Text style={styles.heroIcon}>📖</Text>
          <Text style={styles.heroTitle}>Bulk Chapter Import</Text>
          <Text style={styles.heroSubtitle}>
            Uses the exact same logic as Add Chapter. Session derived from subject.
          </Text>
        </View>

        <View style={styles.phasesCard}>
          <Text style={styles.sectionTitle}>Import Phases</Text>
          {[
            { n: '4', label: 'Schema Validation', desc: 'Compare against real Firestore chapter doc' },
            { n: '1', label: 'Row Validation', desc: 'Validate required fields, subjectId existence + duplicates' },
            { n: '5', label: 'Dry Run Preview', desc: 'Review before any write' },
            { n: '3', label: 'Payload Preview', desc: 'See exact data that will be saved per row' },
            { n: '2', label: 'Import via createChapter()', desc: 'Same function as Add Chapter screen' },
            { n: '6', label: 'Post-Import Verify', desc: 'Confirm chapter count increased correctly' },
          ].map(p => (
            <View key={p.n} style={styles.phaseRow}>
              <View style={[styles.phaseNum, { backgroundColor: adminColors.accentGreen }]}>
                <Text style={styles.phaseNumText}>{p.n}</Text>
              </View>
              <View style={styles.phaseInfo}>
                <Text style={styles.phaseLabel}>{p.label}</Text>
                <Text style={styles.phaseDesc}>{p.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Important: subjectId note */}
        <View style={[styles.schemaCard, { borderColor: adminColors.warning }]}>
          <Text style={styles.sectionTitle}>⚠️ Required: subjectId</Text>
          <Text style={styles.schemaNote}>
            You must paste the exact Firestore document ID of the subject.{'\n'}
            Go to Content → Subjects to get correct IDs.{'\n\n'}
            ✅ Session field is automatically derived from the subject — do not add it manually.
          </Text>
        </View>

        <View style={styles.schemaCard}>
          <Text style={styles.sectionTitle}>📋 Fields Written to Firestore</Text>
          <Text style={styles.schemaNote}>
            ✅ Uses{' '}
            <Text style={styles.code}>createChapter()</Text>
            {' '}from content.service.ts — identical to Add Chapter
          </Text>
          <View style={styles.columnsList}>
            {[
              'title', 'titleGu', 'description', 'order', 'isPremium',
              'videoUrl', 'pdfUrl ← null', 'swadhyayPdfUrl ← null',
              'hasSwadhyay', 'hasMcq', 'hasMixedQuiz',
              'subjectId', 'standardId', 'session ← from subject',
              'isDeleted ← false', 'createdAt ← serverTimestamp', 'updatedAt ← serverTimestamp',
            ].map(col => (
              <View key={col} style={styles.columnChip}>
                <Text style={styles.columnChipText}>{col}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.templateBtn} onPress={handleDownloadTemplate}>
            <Text style={styles.templateBtnText}>⬇️ Download Template CSV</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.uploadZone} onPress={handlePickFile} activeOpacity={0.8}>
          <Text style={styles.uploadZoneIcon}>📂</Text>
          <Text style={styles.uploadZoneTitle}>Tap to select CSV file</Text>
          <Text style={styles.uploadZoneSubtitle}>Only .csv files accepted</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.historyBtn}
          onPress={() => { setStep('history'); loadHistory(); }}>
          <Text style={styles.historyBtnText}>📜 View Import History</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ─── Schema Check + Validating Steps ─────────────────────────────────────

  if (step === 'schema_check') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={adminColors.accentGreen} />
        <Text style={styles.validatingTitle}>Phase 4: Schema Validation…</Text>
        <Text style={styles.validatingSubtitle}>Comparing against existing Firestore chapter</Text>
      </View>
    );
  }

  if (step === 'validating') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={adminColors.accentGreen} />
        <Text style={styles.validatingTitle}>Phase 1: Validating Rows…</Text>
        <Text style={styles.validatingSubtitle}>{progress} / {progressTotal || rawRows.length} checked</Text>
      </View>
    );
  }

  // ─── Dry Run Preview Step (Phase 5) ───────────────────────────────────────

  if (step === 'dry_run' && preview) {
    return (
      <View style={styles.container}>
        <View style={[styles.dryRunBanner, { borderColor: adminColors.accentGreen }]}>
          <Text style={styles.dryRunIcon}>🧪</Text>
          <View style={styles.dryRunInfo}>
            <Text style={[styles.dryRunTitle, { color: adminColors.accentGreen }]}>
              Phase 5: Dry Run — No data saved yet
            </Text>
            <Text style={styles.dryRunSubtitle}>Review all rows before confirming import</Text>
          </View>
        </View>

        {schemaDoc && (
          <View style={styles.schemaCompareBar}>
            <Text style={styles.schemaCompareText}>
              ✅ Chapter schema verified ({Object.keys(schemaDoc).length} fields)
            </Text>
          </View>
        )}

        <View style={styles.summaryBar}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNum}>{preview.totalRows}</Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </View>
          <View style={[styles.summaryCard, { borderColor: adminColors.success }]}>
            <Text style={[styles.summaryNum, { color: adminColors.success }]}>{preview.validRows.length}</Text>
            <Text style={styles.summaryLabel}>Valid</Text>
          </View>
          <View style={[styles.summaryCard, { borderColor: adminColors.warning }]}>
            <Text style={[styles.summaryNum, { color: adminColors.warning }]}>{preview.duplicateRows.length}</Text>
            <Text style={styles.summaryLabel}>Duplicate</Text>
          </View>
          <View style={[styles.summaryCard, { borderColor: adminColors.error }]}>
            <Text style={[styles.summaryNum, { color: adminColors.error }]}>{preview.invalidRows.length}</Text>
            <Text style={styles.summaryLabel}>Invalid</Text>
          </View>
        </View>

        {parseErrors.length > 0 && (
          <View style={styles.parseErrorBanner}>
            <Text style={styles.parseErrorText}>⚠️ {parseErrors.length} parse warning(s)</Text>
          </View>
        )}

        <View style={styles.fileInfoRow}>
          <Text style={styles.fileInfoIcon}>📄</Text>
          <Text style={styles.fileInfoName} numberOfLines={1}>{fileName}</Text>
          <TouchableOpacity onPress={handleReset}>
            <Text style={[styles.changeFileText, { color: adminColors.accentGreen }]}>Change</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={allPreviewRows}
          keyExtractor={item => String(item.rowIndex)}
          contentContainerStyle={styles.previewList}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          renderItem={({ item }) => (
            <View style={styles.previewRow}>
              <View style={styles.previewRowLeft}>
                <Text style={styles.previewRowIndex}>#{item.rowIndex}</Text>
                <View style={styles.previewRowInfo}>
                  <Text style={styles.previewRowName} numberOfLines={1}>{item.payload.title}</Text>
                  <Text style={styles.previewRowMeta}>
                    Std {item.payload.standardId} • Sem {item.payload.session || '?'} • Order {item.payload.order}
                    {item.payload.isPremium ? ' • 💎 Premium' : ''}
                  </Text>
                  <Text style={styles.previewRowMetaSub} numberOfLines={1}>
                    Subject: {item.payload.subjectId.slice(0, 14)}…
                  </Text>
                  {item.reason ? (
                    <Text style={styles.previewRowReason}>{item.reason}</Text>
                  ) : null}
                </View>
              </View>
              <View style={styles.previewRowRight}>
                {renderStatusBadge(item.status)}
                {item.status === 'valid' && (
                  <TouchableOpacity
                    style={[styles.previewPayloadBtn, { backgroundColor: adminColors.accentGreen + '20' }]}
                    onPress={() => openPayloadPreview(item.payload)}
                  >
                    <Text style={[styles.previewPayloadBtnText, { color: adminColors.accentGreen }]}>👁 Payload</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        />

        <View style={styles.actionBar}>
          <TouchableOpacity style={styles.cancelBtn} onPress={handleReset}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.importBtn, { backgroundColor: adminColors.accentGreen }, preview.validRows.length === 0 && styles.importBtnDisabled]}
            onPress={handleConfirmImport}
            disabled={preview.validRows.length === 0}
          >
            <Text style={styles.importBtnText}>
              ✅ Import {preview.validRows.length} Chapter{preview.validRows.length !== 1 ? 's' : ''}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Phase 3: Payload Preview Modal */}
        <Modal
          visible={payloadModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setPayloadModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>📦 Phase 3: Payload Preview</Text>
              <Text style={styles.modalSubtitle}>
                This exact object will be passed to createChapter()
              </Text>
              {selectedPayload && (
                <ScrollView style={styles.payloadScroll}>
                  {Object.entries(selectedPayload).map(([k, v]) => (
                    <View key={k} style={styles.payloadRow}>
                      <Text style={[styles.payloadKey, { color: adminColors.accentGreen }]}>{k}</Text>
                      <Text style={styles.payloadValue}>{v === null ? 'null' : String(v ?? '')}</Text>
                    </View>
                  ))}
                  <View style={styles.payloadDivider} />
                  <Text style={styles.payloadNote}>Added by createChapter():</Text>
                  {['isDeleted: false', 'createdAt: serverTimestamp()', 'updatedAt: serverTimestamp()'].map(f => (
                    <Text key={f} style={[styles.payloadAutoField, { color: adminColors.accentGreen }]}>  {f}</Text>
                  ))}
                </ScrollView>
              )}
              <TouchableOpacity
                style={[styles.modalCloseBtn, { backgroundColor: adminColors.accentGreen }]}
                onPress={() => setPayloadModalVisible(false)}
              >
                <Text style={styles.modalCloseBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // ─── Importing Step ───────────────────────────────────────────────────────

  if (step === 'importing') {
    const pct = progressTotal > 0 ? progress / progressTotal : 0;
    return (
      <View style={styles.centered}>
        <View style={styles.importingCard}>
          <Text style={styles.importingTitle}>⏳ Phase 2: Importing…</Text>
          <Text style={[styles.importingNote2, { color: adminColors.accentGreen }]}>
            Calling createChapter() for each row
          </Text>
          <Text style={styles.importingSubtitle}>{progress} / {progressTotal} chapters written</Text>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressBar, { width: `${Math.round(pct * 100)}%`, backgroundColor: adminColors.accentGreen }]} />
          </View>
          <Text style={[styles.progressPct, { color: adminColors.accentGreen }]}>{Math.round(pct * 100)}%</Text>
          <Text style={styles.importingNote}>Please wait. Do not close the app.</Text>
        </View>
      </View>
    );
  }

  // ─── Report Step (Phase 6) ────────────────────────────────────────────────

  if (step === 'report' && importResult) {
    const countIncreased = importResult.countAfter > importResult.countBefore;
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.reportCard}>
          <Text style={styles.reportIcon}>{countIncreased ? '🎉' : '⚠️'}</Text>
          <Text style={styles.reportTitle}>Import Complete!</Text>
          <Text style={styles.reportFileName}>{fileName}</Text>
          <View style={styles.reportStats}>
            <View style={styles.reportStat}>
              <Text style={[styles.reportStatNum, { color: adminColors.success }]}>{importResult.imported}</Text>
              <Text style={styles.reportStatLabel}>Imported</Text>
            </View>
            <View style={styles.reportStat}>
              <Text style={[styles.reportStatNum, { color: adminColors.warning }]}>{importResult.skipped}</Text>
              <Text style={styles.reportStatLabel}>Skipped</Text>
            </View>
            <View style={styles.reportStat}>
              <Text style={[styles.reportStatNum, { color: adminColors.error }]}>{importResult.failed}</Text>
              <Text style={styles.reportStatLabel}>Failed</Text>
            </View>
          </View>
        </View>

        {/* Phase 6: Post-import verification */}
        <View style={[styles.verifyCard, { borderColor: countIncreased ? adminColors.success : adminColors.warning }]}>
          <Text style={styles.verifyTitle}>📊 Phase 6: Post-Import Verification</Text>
          <View style={styles.verifyRow}>
            <Text style={styles.verifyLabel}>Chapter count before:</Text>
            <Text style={styles.verifyValue}>{importResult.countBefore}</Text>
          </View>
          <View style={styles.verifyRow}>
            <Text style={styles.verifyLabel}>Chapter count after:</Text>
            <Text style={[styles.verifyValue, { color: adminColors.success }]}>{importResult.countAfter}</Text>
          </View>
          <View style={styles.verifyRow}>
            <Text style={styles.verifyLabel}>Net increase:</Text>
            <Text style={[styles.verifyValue, { color: countIncreased ? adminColors.success : adminColors.warning }]}>
              +{importResult.countAfter - importResult.countBefore}
            </Text>
          </View>
          {countIncreased ? (
            <Text style={styles.verifyPass}>
              ✅ Chapters are now visible in ManageChaptersScreen and student side
            </Text>
          ) : (
            <Text style={[styles.verifyPass, { color: adminColors.warning }]}>
              ⚠️ Count did not increase — check errors below
            </Text>
          )}
        </View>

        {importResult.failureDetails.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>❌ Failed Rows</Text>
            {importResult.failureDetails.map((f, idx) => (
              <View key={idx} style={styles.failureRow}>
                <Text style={styles.failureRowText}>
                  Row {f.rowIndex} ({f.title}): {f.reason}
                </Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity style={[styles.importBtn, { backgroundColor: adminColors.accentGreen }]} onPress={handleReset}>
          <Text style={styles.importBtnText}>Import Another File</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.cancelBtn, { marginTop: spacing.md }]}
          onPress={() => { setStep('history'); loadHistory(); }}>
          <Text style={styles.cancelBtnText}>View History</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ─── History Step ─────────────────────────────────────────────────────────

  if (step === 'history') {
    return (
      <View style={styles.container}>
        <View style={styles.historyHeader}>
          <TouchableOpacity onPress={handleReset}>
            <Text style={[styles.backBtnText, { color: adminColors.accentGreen }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.historyTitle}>Chapter Import History</Text>
        </View>
        {logsLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={adminColors.accentGreen} />
          </View>
        ) : (
          <FlatList
            data={logs}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.previewList}
            renderItem={({ item }) => (
              <View style={styles.logCard}>
                <View style={styles.logCardHeader}>
                  <Text style={styles.logFileName} numberOfLines={1}>{item.fileName}</Text>
                  <View style={[styles.badge, { backgroundColor: adminColors.accentGreen + '25' }]}>
                    <Text style={[styles.badgeText, { color: adminColors.accentGreen }]}>chapter</Text>
                  </View>
                </View>
                <View style={styles.logStats}>
                  <Text style={[styles.logStat, { color: adminColors.success }]}>✅ {item.successRows}</Text>
                  <Text style={[styles.logStat, { color: adminColors.warning }]}>⏭ {item.skippedRows}</Text>
                  <Text style={[styles.logStat, { color: adminColors.error }]}>❌ {item.failedRows}</Text>
                </View>
                <Text style={styles.logDate}>
                  {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString() : 'N/A'}
                </Text>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyHistory}>
                <Text style={styles.emptyHistoryText}>No import history yet</Text>
              </View>
            }
          />
        )}
      </View>
    );
  }

  return null;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: adminColors.background },
  scrollContent: { padding: spacing.xl, paddingBottom: 60 },
  centered: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: adminColors.background, padding: spacing.xl,
  },
  heroCard: {
    backgroundColor: adminColors.surface, borderRadius: borderRadius.xl,
    padding: spacing.xxl, alignItems: 'center', marginBottom: spacing.lg,
    borderWidth: 1, borderColor: adminColors.border,
  },
  heroIcon: { fontSize: 44, marginBottom: spacing.sm },
  heroTitle: { fontSize: typography.size.xxl, fontWeight: typography.weight.bold, color: adminColors.textPrimary, textAlign: 'center' },
  heroSubtitle: { fontSize: typography.size.sm, color: adminColors.textMuted, marginTop: spacing.xs, textAlign: 'center' },
  phasesCard: {
    backgroundColor: adminColors.surface, borderRadius: borderRadius.lg,
    padding: spacing.xl, marginBottom: spacing.lg, borderWidth: 1, borderColor: adminColors.border,
  },
  phaseRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.md },
  phaseNum: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: adminColors.primary,
    justifyContent: 'center', alignItems: 'center', marginRight: spacing.md, marginTop: 2,
  },
  phaseNumText: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: '#FFFFFF' },
  phaseInfo: { flex: 1 },
  phaseLabel: { fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: adminColors.textPrimary },
  phaseDesc: { fontSize: typography.size.xs, color: adminColors.textMuted, marginTop: 1 },
  schemaCard: {
    backgroundColor: adminColors.surface, borderRadius: borderRadius.lg,
    padding: spacing.xl, marginBottom: spacing.xl, borderWidth: 1, borderColor: adminColors.border,
  },
  schemaNote: { fontSize: typography.size.sm, color: adminColors.textSecondary, marginBottom: spacing.md, lineHeight: 20 },
  code: { fontFamily: 'monospace', color: adminColors.accentGreen },
  sectionCard: {
    backgroundColor: adminColors.surface, borderRadius: borderRadius.lg,
    padding: spacing.xl, marginBottom: spacing.xl, borderWidth: 1, borderColor: adminColors.border,
  },
  sectionTitle: { fontSize: typography.size.md, fontWeight: typography.weight.bold, color: adminColors.textPrimary, marginBottom: spacing.md },
  columnsList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  columnChip: {
    backgroundColor: adminColors.surfaceElevated, paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs, borderRadius: borderRadius.full, borderWidth: 1, borderColor: adminColors.border,
  },
  columnChipText: { fontSize: typography.size.xs, color: adminColors.accentGreen, fontWeight: typography.weight.semibold },
  templateBtn: {
    backgroundColor: adminColors.secondary + '20', borderWidth: 1, borderColor: adminColors.secondary,
    borderRadius: borderRadius.md, paddingVertical: spacing.md, alignItems: 'center',
  },
  templateBtnText: { fontSize: typography.size.md, color: adminColors.secondaryLight, fontWeight: typography.weight.semibold },
  uploadZone: {
    borderWidth: 2, borderStyle: 'dashed', borderColor: adminColors.accentGreen,
    borderRadius: borderRadius.xl, padding: spacing.xxxl, alignItems: 'center',
    marginBottom: spacing.xl, backgroundColor: adminColors.accentGreen + '08',
  },
  uploadZoneIcon: { fontSize: 40, marginBottom: spacing.md },
  uploadZoneTitle: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: adminColors.accentGreen },
  uploadZoneSubtitle: { fontSize: typography.size.sm, color: adminColors.textMuted, marginTop: spacing.xs },
  historyBtn: { alignItems: 'center', paddingVertical: spacing.md },
  historyBtnText: { fontSize: typography.size.md, color: adminColors.textMuted },
  validatingTitle: { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: adminColors.textPrimary, marginTop: spacing.xl },
  validatingSubtitle: { fontSize: typography.size.sm, color: adminColors.textMuted, marginTop: spacing.sm },
  dryRunBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: adminColors.info + '15',
    margin: spacing.lg, borderRadius: borderRadius.md, padding: spacing.md, borderWidth: 1,
  },
  dryRunIcon: { fontSize: 24, marginRight: spacing.md },
  dryRunInfo: { flex: 1 },
  dryRunTitle: { fontSize: typography.size.sm, fontWeight: typography.weight.bold },
  dryRunSubtitle: { fontSize: typography.size.xs, color: adminColors.textMuted, marginTop: 2 },
  schemaCompareBar: {
    backgroundColor: adminColors.success + '15', marginHorizontal: spacing.lg,
    borderRadius: borderRadius.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  schemaCompareText: { fontSize: typography.size.xs, color: adminColors.success },
  summaryBar: { flexDirection: 'row', paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, gap: spacing.sm },
  summaryCard: {
    flex: 1, backgroundColor: adminColors.surface, borderRadius: borderRadius.lg,
    padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: adminColors.border,
  },
  summaryNum: { fontSize: typography.size.xxl, fontWeight: typography.weight.bold, color: adminColors.textPrimary },
  summaryLabel: { fontSize: typography.size.xs, color: adminColors.textMuted, marginTop: 2 },
  parseErrorBanner: {
    backgroundColor: adminColors.warning + '20', marginHorizontal: spacing.lg,
    borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm,
  },
  parseErrorText: { fontSize: typography.size.sm, color: adminColors.warning },
  fileInfoRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, marginBottom: spacing.xs,
  },
  fileInfoIcon: { fontSize: 16, marginRight: spacing.sm },
  fileInfoName: { flex: 1, fontSize: typography.size.sm, color: adminColors.textSecondary },
  changeFileText: { fontSize: typography.size.sm, fontWeight: typography.weight.semibold },
  previewList: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  previewRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: adminColors.surface, borderRadius: borderRadius.md, padding: spacing.md,
  },
  previewRowLeft: { flexDirection: 'row', alignItems: 'flex-start', flex: 1 },
  previewRowIndex: { fontSize: typography.size.xs, color: adminColors.textMuted, width: 28, marginTop: 2 },
  previewRowInfo: { flex: 1 },
  previewRowName: { fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: adminColors.textPrimary },
  previewRowMeta: { fontSize: typography.size.xs, color: adminColors.textMuted, marginTop: 2 },
  previewRowMetaSub: { fontSize: typography.size.xs, color: adminColors.textMuted, marginTop: 1 },
  previewRowReason: { fontSize: typography.size.xs, color: adminColors.error, marginTop: 2 },
  previewRowRight: { alignItems: 'flex-end', gap: spacing.xs },
  previewPayloadBtn: {
    paddingHorizontal: spacing.sm, paddingVertical: 2,
    borderRadius: borderRadius.xs, marginTop: spacing.xs,
  },
  previewPayloadBtnText: { fontSize: typography.size.xs },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs, borderRadius: borderRadius.xs },
  badgeText: { fontSize: typography.size.xs, fontWeight: typography.weight.semibold },
  actionBar: {
    flexDirection: 'row', padding: spacing.lg, gap: spacing.md,
    backgroundColor: adminColors.surface, borderTopWidth: 1, borderTopColor: adminColors.border,
    position: 'absolute', bottom: 0, left: 0, right: 0,
  },
  cancelBtn: {
    flex: 1, borderWidth: 1, borderColor: adminColors.border,
    borderRadius: borderRadius.md, paddingVertical: spacing.md, alignItems: 'center',
  },
  cancelBtnText: { fontSize: typography.size.md, color: adminColors.textSecondary, fontWeight: typography.weight.semibold },
  importBtn: { flex: 2, borderRadius: borderRadius.md, paddingVertical: spacing.md, alignItems: 'center' },
  importBtnDisabled: { opacity: 0.4 },
  importBtnText: { fontSize: typography.size.md, color: '#FFFFFF', fontWeight: typography.weight.bold },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: adminColors.surface, borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl, padding: spacing.xl, maxHeight: '80%',
  },
  modalTitle: { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: adminColors.textPrimary, marginBottom: spacing.xs },
  modalSubtitle: { fontSize: typography.size.sm, color: adminColors.textMuted, marginBottom: spacing.lg },
  payloadScroll: { maxHeight: 350 },
  payloadRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: adminColors.border,
  },
  payloadKey: { fontSize: typography.size.sm, fontWeight: typography.weight.semibold, flex: 1 },
  payloadValue: { fontSize: typography.size.sm, color: adminColors.textPrimary, flex: 2, textAlign: 'right' },
  payloadDivider: { height: 1, backgroundColor: adminColors.border, marginVertical: spacing.md },
  payloadNote: { fontSize: typography.size.xs, color: adminColors.textMuted, marginBottom: spacing.xs },
  payloadAutoField: { fontSize: typography.size.xs, fontFamily: 'monospace' },
  modalCloseBtn: { borderRadius: borderRadius.md, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.lg },
  modalCloseBtnText: { fontSize: typography.size.md, fontWeight: typography.weight.bold, color: '#FFFFFF' },
  importingCard: {
    backgroundColor: adminColors.surface, borderRadius: borderRadius.xl, padding: spacing.xxxl,
    alignItems: 'center', width: '90%', borderWidth: 1, borderColor: adminColors.border,
  },
  importingTitle: { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: adminColors.textPrimary, marginBottom: spacing.xs },
  importingNote2: { fontSize: typography.size.xs, marginBottom: spacing.md },
  importingSubtitle: { fontSize: typography.size.md, color: adminColors.textSecondary, marginBottom: spacing.xl },
  progressTrack: {
    width: '100%', height: 8, backgroundColor: adminColors.surfaceElevated,
    borderRadius: 4, overflow: 'hidden', marginBottom: spacing.sm,
  },
  progressBar: { height: 8, borderRadius: 4 },
  progressPct: { fontSize: typography.size.lg, fontWeight: typography.weight.bold },
  importingNote: { fontSize: typography.size.xs, color: adminColors.textMuted, marginTop: spacing.md, textAlign: 'center' },
  reportCard: {
    backgroundColor: adminColors.surface, borderRadius: borderRadius.xl,
    padding: spacing.xxl, alignItems: 'center', marginBottom: spacing.xl,
    borderWidth: 1, borderColor: adminColors.border,
  },
  reportIcon: { fontSize: 52, marginBottom: spacing.md },
  reportTitle: { fontSize: typography.size.xxl, fontWeight: typography.weight.bold, color: adminColors.textPrimary },
  reportFileName: { fontSize: typography.size.xs, color: adminColors.textMuted, marginTop: spacing.xs, marginBottom: spacing.xl },
  reportStats: { flexDirection: 'row', gap: spacing.xl },
  reportStat: { alignItems: 'center' },
  reportStatNum: { fontSize: typography.size.xxl, fontWeight: typography.weight.bold },
  reportStatLabel: { fontSize: typography.size.xs, color: adminColors.textMuted, marginTop: spacing.xs },
  verifyCard: {
    backgroundColor: adminColors.surface, borderRadius: borderRadius.lg,
    padding: spacing.xl, marginBottom: spacing.xl, borderWidth: 2,
  },
  verifyTitle: { fontSize: typography.size.md, fontWeight: typography.weight.bold, color: adminColors.textPrimary, marginBottom: spacing.md },
  verifyRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm },
  verifyLabel: { fontSize: typography.size.sm, color: adminColors.textSecondary },
  verifyValue: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: adminColors.textPrimary },
  verifyPass: { fontSize: typography.size.sm, color: adminColors.success, marginTop: spacing.md, fontWeight: typography.weight.semibold },
  failureRow: { backgroundColor: adminColors.error + '10', borderRadius: borderRadius.sm, padding: spacing.sm, marginBottom: spacing.xs },
  failureRowText: { fontSize: typography.size.sm, color: adminColors.error },
  historyHeader: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.xl,
    borderBottomWidth: 1, borderBottomColor: adminColors.border,
  },
  backBtnText: { fontSize: typography.size.md, fontWeight: typography.weight.semibold, marginRight: spacing.md },
  historyTitle: { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: adminColors.textPrimary },
  logCard: {
    backgroundColor: adminColors.surface, borderRadius: borderRadius.lg,
    padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: adminColors.border,
  },
  logCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  logFileName: { flex: 1, fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: adminColors.textPrimary },
  logStats: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.xs },
  logStat: { fontSize: typography.size.sm, fontWeight: typography.weight.semibold },
  logDate: { fontSize: typography.size.xs, color: adminColors.textMuted },
  emptyHistory: { alignItems: 'center', paddingVertical: spacing.huge },
  emptyHistoryText: { fontSize: typography.size.md, color: adminColors.textMuted },
});
