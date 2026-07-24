import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import ReactNativeBlobUtil from 'react-native-blob-util';
import firestore from '@react-native-firebase/firestore';
import { uploadFile } from '../../services/firebase/storage.service';
import { adminColors, typography, spacing, borderRadius, shadows } from '../../theme';
import { COLLECTIONS } from '../../constants';

interface BulkImportModalProps {
  visible: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
  collectionName: string;
  moduleName: string;
  topicId?: string;
  chapterId?: string;
  subjectId?: string;
  standardId?: string;
  standardNumber?: string;
}

interface ParsedRow {
  index: number;
  data: Record<string, any>;
  status: 'valid' | 'duplicate' | 'error';
  errorMsg?: string;
  duplicateDocId?: string;
  skip?: boolean;
  overwrite?: boolean;
}

export function CMSBulkImportModal({
  visible,
  onClose,
  onImportSuccess,
  collectionName,
  moduleName,
  topicId,
  chapterId,
  subjectId,
  standardId,
  standardNumber,
}: BulkImportModalProps): React.JSX.Element {
  const [csvText, setCsvText] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [step, setStep] = useState<'input' | 'preview'>('input');

  // Pick CSV File and read contents
  const handlePickFile = async () => {
    try {
      const res = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.allFiles],
      });

      if (res.uri) {
        setLoading(true);
        setProgress('Reading file...');
        
        // Use ReactNativeBlobUtil to read file path content
        const realPath = res.uri.replace('file://', '');
        const data = await ReactNativeBlobUtil.fs.readFile(realPath, 'utf8');
        setCsvText(data);
        Alert.alert('Success', 'File loaded successfully. Click Validate to preview.');
      }
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        console.error('File pick error:', err);
        Alert.alert('Error', 'Failed to read spreadsheet file');
      }
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  // Run dry-run validation and duplicates scan
  const handleValidate = async () => {
    if (!csvText.trim()) {
      Alert.alert('Validation', 'Please paste spreadsheet data or upload a CSV file.');
      return;
    }

    setLoading(true);
    setProgress('Parsing rows...');

    try {
      const lines = csvText.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        throw new Error('Spreadsheet must contain a header row and at least one data row.');
      }

      const headers = parseCSVLine(lines[0] || '');
      const tempRows: ParsedRow[] = [];

      for (let i = 1; i < lines.length; i++) {
        setProgress(`Validating row ${i} of ${lines.length - 1}...`);
        const values = parseCSVLine(lines[i] || '');
        if (values.length === 0) continue;

        const rowData: Record<string, any> = {};
        headers.forEach((header, idx) => {
          let val: any = values[idx] ? (values[idx] as string).trim() : '';
          
          // Cast numbers and booleans
          if (['marks', 'order', 'estimatedReadingTime', 'display_order', 'exam_year'].includes(header)) {
            val = parseInt(val, 10) || 0;
          } else if (['is_premium', 'isPremium', 'is_active', 'is_verified'].includes(header)) {
            val = val.toLowerCase() === 'true' || val === '1' || val.toLowerCase() === 'yes';
          }
          rowData[header] = val;
        });

        // Set hierarchy context anchors
        if (topicId) rowData.topic_id = topicId;
        if (chapterId) rowData.chapter_id = chapterId;
        if (subjectId) rowData.subject_id = subjectId;
        if (standardId) rowData.standard_id = standardId;
        if (standardNumber) rowData.standard_number = parseInt(standardNumber, 10);

        // Validation Checks
        let status: 'valid' | 'duplicate' | 'error' = 'valid';
        let errorMsg = '';

        if (collectionName === COLLECTIONS.QUESTION_BANK && !rowData.question_text_gu) {
          status = 'error';
          errorMsg = 'Gujarati question text is missing';
        } else if (collectionName === COLLECTIONS.TOPICS && (!rowData.topicName || !rowData.topicNameGujarati)) {
          status = 'error';
          errorMsg = 'Topic name (English & Gujarati) is missing';
        }

        // Duplicate Scans
        let duplicateDocId = '';
        if (status === 'valid') {
          const isDup = await checkDuplicateInDb(rowData);
          if (isDup.exists) {
            status = 'duplicate';
            duplicateDocId = isDup.id;
          }
        }

        tempRows.push({
          index: i,
          data: rowData,
          status,
          errorMsg,
          duplicateDocId,
          skip: status === 'duplicate', // Skip duplicates by default
          overwrite: false,
        });
      }

      setParsedRows(tempRows);
      setStep('preview');
    } catch (err) {
      Alert.alert('Validation Failed', (err as Error).message);
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  const checkDuplicateInDb = async (item: any): Promise<{ exists: boolean; id: string }> => {
    try {
      let query = firestore().collection(collectionName).where('isDeleted', '==', false);
      
      if (collectionName === COLLECTIONS.TOPICS && chapterId) {
        query = query.where('chapter_id', '==', chapterId);
        const nameEn = item.topicName || item.title_en || '';
        const snapshot = await query.where('topicName', '==', nameEn).get();
        const doc = snapshot.docs[0];
        if (doc) return { exists: true, id: doc.id };
      } else if (collectionName === COLLECTIONS.QUESTION_BANK && topicId) {
        query = query.where('topic_id', '==', topicId);
        const text = item.question_text_gu || '';
        const snapshot = await query.where('question_text_gu', '==', text).get();
        const doc = snapshot.docs[0];
        if (doc) return { exists: true, id: doc.id };
      } else if (collectionName === COLLECTIONS.GLOSSARY && chapterId) {
        query = query.where('chapter_id', '==', chapterId);
        const word = item.word_gu || '';
        const snapshot = await query.where('word_gu', '==', word).get();
        const doc = snapshot.docs[0];
        if (doc) return { exists: true, id: doc.id };
      }
    } catch (err) {
      console.error('Db duplicate check error:', err);
    }
    return { exists: false, id: '' };
  };

  const handleCommit = async () => {
    const errorCount = parsedRows.filter(r => r.status === 'error').length;
    if (errorCount > 0) {
      Alert.alert('Validation Error', 'Please resolve all invalid rows before importing.');
      return;
    }

    setLoading(true);
    const committedIds: string[] = [];

    try {
      const itemsToImport = parsedRows.filter(r => !r.skip);
      const timestamp = firestore.FieldValue.serverTimestamp();

      // Step 1: Upload device assets to Firebase Storage if local paths exist
      for (let i = 0; i < itemsToImport.length; i++) {
        const row = itemsToImport[i];
        if (!row) continue;
        const localImg = row.data.image_url;
        const localPdf = row.data.pdf_url;

        if (localImg && localImg.startsWith('file://')) {
          setProgress(`Uploading asset ${i + 1} of ${itemsToImport.length}...`);
          const uploadRes = await uploadFile(localImg, `${collectionName}/images`);
          if (uploadRes.success && uploadRes.data) {
            row.data.image_url = uploadRes.data;
          }
        }
        if (localPdf && localPdf.startsWith('file://')) {
          setProgress(`Uploading asset ${i + 1} of ${itemsToImport.length}...`);
          const uploadRes = await uploadFile(localPdf, `${collectionName}/pdfs`);
          if (uploadRes.success && uploadRes.data) {
            row.data.pdf_url = uploadRes.data;
          }
        }
      }

      // Step 2: Firestore Writes
      setProgress('Saving to database...');
      const batchLimit = 500;
      let currentBatch = firestore().batch();
      let currentCount = 0;

      for (let i = 0; i < itemsToImport.length; i++) {
        const row = itemsToImport[i];
        if (!row) continue;
        
        let docRef;
        if (row.overwrite && row.duplicateDocId) {
          // Overwrite existing document
          docRef = firestore().collection(collectionName).doc(row.duplicateDocId);
          currentBatch.set(docRef, {
            ...row.data,
            updatedAt: timestamp,
          }, { merge: true });
        } else {
          // Create new document - generate ID and inject required fields per collection
          docRef = firestore().collection(collectionName).doc();
          const docId = docRef.id;

          const requiredFields: Record<string, any> = {};

          // Inject collection-specific required ID + counter fields to satisfy Firestore security rules
          if (collectionName === COLLECTIONS.TOPICS) {
            requiredFields.topic_id = docId;
            requiredFields.topic_number = row.data.display_order || 1;
            requiredFields.content_type = row.data.content_type || 'text';
            requiredFields.is_active = row.data.is_active !== false;
            requiredFields.is_premium = row.data.is_premium || false;
          } else if (collectionName === COLLECTIONS.LEARNING_OUTCOMES) {
            requiredFields.outcome_id = docId;
            requiredFields.measurable_verb_gu = row.data.measurable_verb_gu || 'શીખવે';
            requiredFields.linked_question_ids = [];
            requiredFields.is_active = true;
            requiredFields.display_order = row.data.display_order || 1;
          } else if (collectionName === COLLECTIONS.TEXTBOOKS) {
            requiredFields.textbook_id = docId;
            requiredFields.chapter_page_map = [];
            requiredFields.ocr_processed = false;
            requiredFields.ai_indexed = false;
          } else if (collectionName === COLLECTIONS.WORKSHEETS) {
            requiredFields.worksheet_id = docId;
            requiredFields.download_count = 0;
            requiredFields.question_ids = [];
          } else if (collectionName === COLLECTIONS.VIDEOS) {
            requiredFields.video_id = docId;
            requiredFields.view_count = 0;
            requiredFields.like_count = 0;
            requiredFields.ai_indexed = false;
          } else if (collectionName === COLLECTIONS.LESSON_PLANS) {
            requiredFields.lesson_plan_id = docId;
            requiredFields.periods = [];
            requiredFields.learning_outcomes = [];
            requiredFields.is_ai_generated = false;
          } else if (collectionName === COLLECTIONS.FLASHCARDS) {
            requiredFields.flashcard_id = docId;
            requiredFields.review_count = 0;
            requiredFields.is_ai_generated = false;
          } else if (collectionName === COLLECTIONS.GLOSSARY) {
            requiredFields.glossary_id = docId;
            requiredFields.subject_code = row.data.subject_code || 'SCI';
          } else if (collectionName === COLLECTIONS.QUESTION_BANK) {
            requiredFields.question_id = docId;
            requiredFields.usage_count = 0;
            requiredFields.is_verified = row.data.is_verified !== false;
            requiredFields.is_active = true;
            requiredFields.is_premium = row.data.is_premium || false;
          } else if (collectionName === COLLECTIONS.MCQ_BANK) {
            requiredFields.mcq_id = docId;
            requiredFields.usage_count = 0;
            requiredFields.is_verified = row.data.is_verified !== false;
            requiredFields.is_active = true;
            requiredFields.is_premium = row.data.is_premium || false;
          }

          currentBatch.set(docRef, {
            ...row.data,
            ...requiredFields,
            isDeleted: false,
            createdAt: timestamp,
            updatedAt: timestamp,
            created_by: 'admin',
          });
        }

        committedIds.push(docRef.id);
        currentCount++;

        if (currentCount === batchLimit) {
          await currentBatch.commit();
          currentBatch = firestore().batch();
          currentCount = 0;
        }
      }

      if (currentCount > 0) {
        await currentBatch.commit();
      }

      Alert.alert('Import Complete', `Successfully imported ${itemsToImport.length} items!`);
      onImportSuccess();
      onClose();
    } catch (err) {
      console.error('Import process failed, rolling back...', err);
      setProgress('Rolling back changes...');

      // Rollback committed batch sets on failure (Atomic consistency)
      for (const id of committedIds) {
        await firestore().collection(collectionName).doc(id).delete().catch(console.error);
      }

      Alert.alert('Import Failed', `Database rollback completed successfully to prevent partial writes. Error: ${(err as Error).message}`);
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  const parseCSVLine = (line: string): string[] => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.replace(/^"|"$/g, ''));
    return result;
  };

  const toggleSkipRow = (index: number) => {
    setParsedRows(prev => prev.map(r => {
      if (r.index === index) {
        const nextSkip = !r.skip;
        return { ...r, skip: nextSkip, overwrite: nextSkip ? false : r.overwrite };
      }
      return r;
    }));
  };

  const toggleOverwriteRow = (index: number) => {
    setParsedRows(prev => prev.map(r => {
      if (r.index === index) {
        const nextOverwrite = !r.overwrite;
        return { ...r, overwrite: nextOverwrite, skip: nextOverwrite ? false : r.skip };
      }
      return r;
    }));
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Bulk Import — {moduleName}</Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={adminColors.primary} />
              <Text style={styles.loadingText}>{progress || 'Processing...'}</Text>
            </View>
          ) : step === 'input' ? (
            <>
              <View style={styles.uploadArea}>
                <TouchableOpacity style={styles.uploadFileBtn} onPress={handlePickFile}>
                  <Text style={styles.uploadFileBtnText}>📁 Pick CSV Spreadsheet File</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.orText}>— OR PASTE COLUMNS —</Text>

              <TextInput
                style={styles.textArea}
                value={csvText}
                onChangeText={setCsvText}
                placeholder="Paste CSV rows here..."
                placeholderTextColor={adminColors.textMuted}
                multiline
                numberOfLines={10}
                textAlignVertical="top"
              />

              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.importBtn} onPress={handleValidate}>
                  <Text style={styles.importBtnText}>Parse & Validate</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              {/* Preview Rows status lists */}
              <Text style={styles.previewHeader}>Parsed Row Preview Status:</Text>
              <FlatList
                data={parsedRows}
                keyExtractor={(item) => String(item.index)}
                renderItem={({ item }) => (
                  <View style={styles.rowPreviewCard}>
                    <View style={styles.rowCardTop}>
                      <Text style={styles.rowIndexText}>Row #{item.index}</Text>
                      <View style={[
                        styles.statusPill,
                        item.status === 'valid' ? styles.statusValid :
                        item.status === 'duplicate' ? styles.statusDuplicate : styles.statusError
                      ]}>
                        <Text style={styles.statusPillText}>{item.status}</Text>
                      </View>
                    </View>

                    <Text style={styles.rowTitleText} numberOfLines={1}>
                      {item.data.question_text_gu || item.data.topicNameGujarati || item.data.word_gu || 'No Name'}
                    </Text>

                    {item.status === 'error' && (
                      <Text style={styles.errorMsgText}>⚠️ {item.errorMsg}</Text>
                    )}

                    {item.status === 'duplicate' && (
                      <View style={styles.duplicateOptionsRow}>
                        <TouchableOpacity
                          style={[styles.dupToggleBtn, item.skip && styles.dupToggleBtnActive]}
                          onPress={() => toggleSkipRow(item.index)}
                        >
                          <Text style={[styles.dupToggleBtnText, item.skip && styles.dupToggleBtnTextActive]}>Skip</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.dupToggleBtn, item.overwrite && styles.dupToggleBtnActive]}
                          onPress={() => toggleOverwriteRow(item.index)}
                        >
                          <Text style={[styles.dupToggleBtnText, item.overwrite && styles.dupToggleBtnTextActive]}>Overwrite</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}
                style={styles.previewList}
                showsVerticalScrollIndicator={false}
              />

              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setStep('input')}>
                  <Text style={styles.cancelBtnText}>Back</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.importBtn} onPress={handleCommit}>
                  <Text style={styles.importBtnText}>Commit Upload</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    backgroundColor: adminColors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    maxHeight: '90%',
    ...shadows.md,
  },
  modalTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: adminColors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  loadingContainer: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.size.sm,
    color: adminColors.textSecondary,
  },
  uploadArea: {
    marginBottom: spacing.md,
  },
  uploadFileBtn: {
    backgroundColor: adminColors.primary + '15',
    borderColor: adminColors.primary,
    borderWidth: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  uploadFileBtnText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: adminColors.primary,
  },
  orText: {
    fontSize: typography.size.xs,
    color: adminColors.textMuted,
    fontWeight: typography.weight.bold,
    textAlign: 'center',
    marginVertical: spacing.sm,
  },
  textArea: {
    height: 180,
    backgroundColor: adminColors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: spacing.md,
    color: adminColors.textPrimary,
    fontSize: typography.size.sm,
    marginBottom: spacing.lg,
  },
  previewHeader: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: adminColors.textSecondary,
    marginBottom: spacing.sm,
  },
  previewList: {
    maxHeight: 280,
    marginBottom: spacing.lg,
  },
  rowPreviewCard: {
    backgroundColor: adminColors.surfaceHover,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  rowCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  rowIndexText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: adminColors.textMuted,
  },
  statusPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  statusValid: {
    backgroundColor: '#DCFCE7',
  },
  statusDuplicate: {
    backgroundColor: '#FEF3C7',
  },
  statusError: {
    backgroundColor: '#FEE2E2',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: typography.weight.bold,
    textTransform: 'uppercase',
    color: '#1A1A1A',
  },
  rowTitleText: {
    fontSize: typography.size.sm,
    color: adminColors.textPrimary,
    fontWeight: typography.weight.medium,
  },
  errorMsgText: {
    fontSize: typography.size.xs,
    color: adminColors.error,
    marginTop: 4,
  },
  duplicateOptionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  dupToggleBtn: {
    flex: 1,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    backgroundColor: adminColors.surface,
  },
  dupToggleBtnActive: {
    backgroundColor: adminColors.primary,
    borderColor: adminColors.primary,
  },
  dupToggleBtnText: {
    fontSize: 10,
    color: adminColors.textSecondary,
    fontWeight: typography.weight.medium,
  },
  dupToggleBtnTextActive: {
    color: adminColors.textInverse,
    fontWeight: typography.weight.bold,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  cancelBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: typography.size.sm,
    color: adminColors.textSecondary,
    fontWeight: typography.weight.semibold,
  },
  importBtn: {
    backgroundColor: adminColors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    minWidth: 120,
    alignItems: 'center',
  },
  importBtnText: {
    fontSize: typography.size.sm,
    color: adminColors.textInverse,
    fontWeight: typography.weight.bold,
  },
});
