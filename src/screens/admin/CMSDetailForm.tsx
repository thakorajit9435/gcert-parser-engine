import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { adminColors, typography, spacing, borderRadius } from '../../theme';
import { createCMSItem, updateCMSItem } from '../../services/firebase/cms.service';
import { useAuth } from '../../hooks/useAuth';
import { COLLECTIONS } from '../../constants';
import DocumentPicker from 'react-native-document-picker';
import { uploadPdf, uploadImage } from '../../services/firebase/storage.service';

export function CMSDetailForm({ route, navigation }: { route: any; navigation: any }): React.JSX.Element {
  const { moduleName, collectionName, itemId, topicId, chapterId, subjectId, standardId, standardNumber } = route.params;

  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Unified form state map
  const [fields, setFields] = useState<Record<string, any>>({
    is_active: true,
    is_premium: false,
    is_verified: true,
    is_downloadable: true,
    is_ai_generated: false,
    display_order: 1,
    difficulty_level: 'medium',
    bloom_level: 'understand',
    marks: 1,
    exam_year: new Date().getFullYear(),
    language: 'Gujarati',
  });

  // MCQ custom options state
  const [mcqOptions, setMcqOptions] = useState<{ id: string; text_gu: string }[]>([
    { id: 'A', text_gu: '' },
    { id: 'B', text_gu: '' },
    { id: 'C', text_gu: '' },
    { id: 'D', text_gu: '' },
  ]);

  // Load existing data if editing
  useEffect(() => {
    if (!itemId) {return;}

    const loadItem = async () => {
      setLoading(true);
      try {
        const doc = await firestore().collection(collectionName).doc(itemId).get();
        if (doc.exists) {
          const data = doc.data() || {};
          
          // Adapter for topics
          if (collectionName === COLLECTIONS.TOPICS) {
            data.topicName = data.topicName || data.title_en || '';
            data.topicNameGujarati = data.topicNameGujarati || data.title_gu || '';
            data.description = data.description || data.content_gu || '';
            data.estimatedReadingTime = data.estimatedReadingTime || 5;
            data.difficulty = data.difficulty || data.difficulty_level || 'medium';
            data.isPremium = data.isPremium !== undefined ? data.isPremium : (data.is_premium || false);
            data.status = data.status || (data.is_active !== false ? 'active' : 'inactive');
            data.order = data.order !== undefined ? data.order : (data.display_order || 1);
            
            if (Array.isArray(data.keywords)) {
              data.keywordsString = data.keywords.join(', ');
            } else if (Array.isArray(data.ai_keywords)) {
              data.keywordsString = data.ai_keywords.join(', ');
            } else {
              data.keywordsString = '';
            }

            if (Array.isArray(data.learningOutcomeIds)) {
              data.outcomesString = data.learningOutcomeIds.join(', ');
            } else {
              data.outcomesString = '';
            }
          }

          // Adapter for questions
          if (collectionName === COLLECTIONS.QUESTION_BANK || collectionName === COLLECTIONS.MCQ_BANK) {
            if (Array.isArray(data.tags)) {
              data.tagsString = data.tags.join(', ');
            } else {
              data.tagsString = '';
            }
            if (data.options) {
              setMcqOptions(data.options);
            }
          }

          setFields(prev => ({
            ...prev,
            ...data,
          }));

          // Special mapping for MCQ options if loading MCQ
          if (collectionName === COLLECTIONS.MCQ_BANK && data.options) {
            setMcqOptions(data.options);
          }
        }
      } catch (err) {
        Alert.alert('Error', 'Failed to load details');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    loadItem();
  }, [itemId, collectionName]);

  const updateField = (key: string, value: any) => {
    setFields(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handlePickAndUploadFile = async (fieldKey: string, fileType: 'pdf' | 'image') => {
    try {
      const res = await DocumentPicker.pickSingle({
        type: fileType === 'pdf' ? [DocumentPicker.types.pdf] : [DocumentPicker.types.images],
      });

      if (res.uri) {
        setSaving(true);
        Alert.alert('Uploading', 'Uploading file to Firebase Storage...');
        
        let uploadRes;
        if (fileType === 'pdf') {
          uploadRes = await uploadPdf(res.uri, `${collectionName}/pdfs`);
        } else {
          uploadRes = await uploadImage(res.uri, `${collectionName}/images`);
        }

        if (uploadRes.success && uploadRes.data) {
          updateField(fieldKey, uploadRes.data);
          Alert.alert('Success', 'File uploaded and URL set successfully!');
        } else {
          Alert.alert('Upload Failed', uploadRes.error || 'Failed to upload file');
        }
      }
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        console.error('File pick error:', err);
        Alert.alert('Error', 'Failed to pick file');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    // ── Validation ──────────────────────────────────────────────
    if (collectionName === COLLECTIONS.TOPICS) {
      const activeTopicName = fields.topicName || fields.title_en || '';
      const activeTopicNameGujarati = fields.topicNameGujarati || fields.title_gu || '';
      
      if (!activeTopicName.trim() || !activeTopicNameGujarati.trim()) {
        Alert.alert('Validation', 'Topic Name in English and Gujarati are required.');
        return;
      }
      
      setSaving(true);
      // Perform duplicate validation check
      try {
        const querySnapshot = await firestore()
          .collection(COLLECTIONS.TOPICS)
          .where('chapter_id', '==', chapterId)
          .where('isDeleted', '==', false)
          .get();
        
        let hasDuplicate = false;
        querySnapshot.forEach(doc => {
          if (doc.id !== itemId) {
            const data = doc.data();
            const nameEn = data.topicName || data.title_en || '';
            const nameGu = data.topicNameGujarati || data.title_gu || '';
            
            if (nameEn.toLowerCase().trim() === activeTopicName.toLowerCase().trim() ||
                nameGu.toLowerCase().trim() === activeTopicNameGujarati.toLowerCase().trim()) {
              hasDuplicate = true;
            }
          }
        });
        
        if (hasDuplicate) {
          Alert.alert('Duplicate Alert', 'A topic with this English or Gujarati name already exists in this chapter.');
          setSaving(false);
          return;
        }
      } catch (err) {
        console.error('Duplicate check error:', err);
      }
    }

    if (collectionName === COLLECTIONS.LEARNING_OUTCOMES && !fields.outcome_text_gu?.trim()) {
      Alert.alert('Validation', 'Outcome text in Gujarati is required.');
      return;
    }
    if (collectionName === COLLECTIONS.GLOSSARY && (!fields.word_gu?.trim() || !fields.word_en?.trim() || !fields.definition_gu?.trim())) {
      Alert.alert('Validation', 'Word and Definition are required.');
      return;
    }
    if ((collectionName === COLLECTIONS.QUESTION_BANK || collectionName === COLLECTIONS.MCQ_BANK) && !fields.question_text_gu?.trim()) {
      Alert.alert('Validation', 'Question text is required.');
      return;
    }
    if (collectionName === COLLECTIONS.WORKSHEETS && !fields.title_gu?.trim()) {
      Alert.alert('Validation', 'Worksheet title (Gujarati) is required.');
      return;
    }
    if (collectionName === COLLECTIONS.VIDEOS && (!fields.title_gu?.trim() || !fields.video_url?.trim())) {
      Alert.alert('Validation', 'Title and Video URL are required.');
      return;
    }

    if (!saving) {
      setSaving(true);
    }

    // Context anchors
    const payload: Record<string, any> = {
      ...fields,
    };

    // Remove UI-only helper keys
    delete payload.keywordsString;
    delete payload.outcomesString;
    delete payload.tagsString;

    // Mapping tags and options for questions
    if (collectionName === COLLECTIONS.QUESTION_BANK || collectionName === COLLECTIONS.MCQ_BANK) {
      if (fields.tagsString) {
        payload.tags = fields.tagsString.split(',').map((t: string) => t.trim()).filter(Boolean);
      }
      if (payload.question_type === 'mcq') {
        payload.options = mcqOptions;
      }
    }

    // Mapping topics properties to core keys to maintain compatibility
    if (collectionName === COLLECTIONS.TOPICS) {
      payload.title_en = fields.topicName || fields.title_en;
      payload.title_gu = fields.topicNameGujarati || fields.title_gu;
      payload.content_gu = fields.description || fields.content_gu || '';
      payload.difficulty_level = fields.difficulty || fields.difficulty_level || 'medium';
      payload.is_premium = fields.isPremium !== undefined ? fields.isPremium : (fields.is_premium || false);
      payload.is_active = fields.status === 'active';
      payload.display_order = fields.order !== undefined ? parseInt(fields.order, 10) : (fields.display_order || 1);

      // Handle keywords list
      if (fields.keywordsString) {
        const keywordList = fields.keywordsString.split(',').map((k: string) => k.trim()).filter(Boolean);
        payload.keywords = keywordList;
        payload.ai_keywords = keywordList;
      }
      
      // Handle learning outcomes list
      if (fields.outcomesString) {
        const outcomesList = fields.outcomesString.split(',').map((o: string) => o.trim()).filter(Boolean);
        payload.learningOutcomeIds = outcomesList;
      }
    }

    // Inject parent hierarchy IDs if creating
    let generatedId: string | undefined;
    if (!itemId) {
      generatedId = firestore().collection(collectionName).doc().id;

      if (topicId) {payload.topic_id = topicId;}
      if (chapterId) {payload.chapter_id = chapterId;}
      if (subjectId) {payload.subject_id = subjectId;}
      if (standardId) {payload.standard_id = standardId;}
      if (standardNumber) {payload.standard_number = parseInt(standardNumber, 10);}

      // Map required attributes to satisfy Firestore security rules
      if (collectionName === COLLECTIONS.TOPICS) {
        payload.topic_id = generatedId;
        payload.topic_number = payload.display_order || 1;
        payload.content_type = payload.content_type || 'text';
      } else if (collectionName === COLLECTIONS.LEARNING_OUTCOMES) {
        payload.outcome_id = generatedId;
        payload.measurable_verb_gu = payload.measurable_verb_gu || 'શીખવે';
        payload.linked_question_ids = [];
      } else if (collectionName === COLLECTIONS.TEXTBOOKS) {
        payload.textbook_id = generatedId;
        payload.chapter_page_map = [];
        payload.ocr_processed = false;
        payload.ai_indexed = false;
        payload.title_en = payload.title_en || payload.title_gu || 'Textbook';
        payload.publisher = payload.publisher || 'GSEB (Gujarat Board)';
        payload.edition_year = payload.edition_year || 2024;
      } else if (collectionName === COLLECTIONS.WORKSHEETS) {
        payload.worksheet_id = generatedId;
        payload.download_count = 0;
        payload.question_ids = [];
        payload.tags = [];
      } else if (collectionName === COLLECTIONS.VIDEOS) {
        payload.video_id = generatedId;
        payload.view_count = 0;
        payload.like_count = 0;
        payload.ai_indexed = false;
        payload.tags = [];
      } else if (collectionName === COLLECTIONS.LESSON_PLANS) {
        payload.lesson_plan_id = generatedId;
        payload.periods = [];
        payload.learning_outcomes = [];
        payload.is_ai_generated = false;
        payload.standard_number = payload.standard_number || parseInt(standardNumber, 10) || 1;
        payload.total_periods = payload.total_periods || parseInt(fields.total_periods, 10) || 1;
        payload.period_duration_min = payload.period_duration_min || parseInt(fields.period_duration_min, 10) || 45;
      } else if (collectionName === COLLECTIONS.FLASHCARDS) {
        payload.flashcard_id = generatedId;
        payload.review_count = 0;
        payload.is_ai_generated = false;
        payload.tags = [];
      } else if (collectionName === COLLECTIONS.GLOSSARY) {
        payload.glossary_id = generatedId;
        payload.subject_code = payload.subject_code || 'SCI';
        payload.tags = [];
      } else if (collectionName === COLLECTIONS.QUESTION_BANK) {
        payload.question_id = generatedId;
        payload.usage_count = 0;
        payload.answer_hints = [];
        payload.learning_outcome_ids = [];
      } else if (collectionName === COLLECTIONS.MCQ_BANK) {
        payload.mcq_id = generatedId;
        payload.usage_count = 0;
      }
    }

    // Special formats for arrays/numbers
    if (payload.display_order !== undefined) {
      payload.display_order = parseInt(payload.display_order, 10) || 1;
    }
    if (payload.marks !== undefined) {
      payload.marks = parseInt(payload.marks, 10) || 1;
    }
    if (payload.exam_year !== undefined) {
      payload.exam_year = parseInt(payload.exam_year, 10) || new Date().getFullYear();
    }
    if (payload.total_questions !== undefined) {
      payload.total_questions = parseInt(payload.total_questions, 10) || 0;
    }
    if (payload.total_marks !== undefined) {
      payload.total_marks = parseInt(payload.total_marks, 10) || 0;
    }
    if (payload.total_pages !== undefined) {
      payload.total_pages = parseInt(payload.total_pages, 10) || 0;
    }

    // Embed options for MCQ
    if (collectionName === COLLECTIONS.MCQ_BANK) {
      payload.options = mcqOptions;
      if (!payload.correct_option_id) {
        payload.correct_option_id = 'A';
      }
    }

    try {
      let res;
      if (itemId) {
        res = await updateCMSItem(collectionName, itemId, payload as any);
      } else {
        res = await createCMSItem(collectionName, payload as any, userProfile?.uid || 'admin', generatedId);
      }

      if (res.success) {
        Alert.alert('Success', `Saved successfully!`);
        navigation.goBack();
      } else {
        Alert.alert('Error', res.error || 'Failed to save');
      }
    } catch (err) {
      Alert.alert('Error', (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const renderTextInput = (label: string, fieldKey: string, placeholder = '', multiline = false, numeric = false) => {
    const isPdfField = fieldKey === 'pdf_url' || fieldKey === 'swadhyayPdfUrl';
    const isImageField = fieldKey === 'image_url' || fieldKey === 'thumbnail_url';
    const hasAction = isPdfField || isImageField;

    return (
      <View style={styles.formGroup}>
        <Text style={styles.label}>{label}</Text>
        <View style={hasAction ? styles.inputContainerWithAction : null}>
          <TextInput
            style={[styles.input, hasAction && styles.flexInput, multiline && styles.inputMultiline]}
            value={fields[fieldKey] !== undefined ? String(fields[fieldKey]) : ''}
            onChangeText={(val) => updateField(fieldKey, numeric ? parseInt(val, 10) || '' : val)}
            placeholder={placeholder}
            placeholderTextColor={adminColors.textMuted}
            multiline={multiline}
            keyboardType={numeric ? 'number-pad' : 'default'}
          />
          {isPdfField && (
            <TouchableOpacity
              style={styles.inputActionBtn}
              onPress={() => handlePickAndUploadFile(fieldKey, 'pdf')}
            >
              <Text style={styles.inputActionBtnText}>📤 Upload</Text>
            </TouchableOpacity>
          )}
          {isImageField && (
            <TouchableOpacity
              style={styles.inputActionBtn}
              onPress={() => handlePickAndUploadFile(fieldKey, 'image')}
            >
              <Text style={styles.inputActionBtnText}>📤 Upload</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderSwitchInput = (label: string, fieldKey: string) => {
    return (
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>{label}</Text>
        <Switch
          value={!!fields[fieldKey]}
          onValueChange={(val) => updateField(fieldKey, val)}
          trackColor={{ false: adminColors.border, true: adminColors.primary + '60' }}
          thumbColor={fields[fieldKey] ? adminColors.primary : adminColors.textMuted}
        />
      </View>
    );
  };

  const renderDropdownInput = (label: string, fieldKey: string, options: string[]) => {
    return (
      <View style={styles.formGroup}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.dropdownContainer}>
          {options.map((opt) => {
            const isSelected = fields[fieldKey] === opt;
            return (
              <TouchableOpacity
                key={opt}
                style={[styles.dropdownItem, isSelected && styles.dropdownItemActive]}
                onPress={() => updateField(fieldKey, opt)}
              >
                <Text style={[styles.dropdownText, isSelected && styles.dropdownTextActive]}>{opt}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={adminColors.primary} />
        <Text style={styles.loadingText}>Loading details…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.formTitle}>
          {itemId ? 'Edit' : 'Create'} {moduleName}
        </Text>

        {/* Dynamic Fields rendering depending on Collection name */}
        {collectionName === COLLECTIONS.TOPICS && (
          <>
            {renderTextInput('Topic Name (English)', 'topicName', 'e.g. Chemical Reactions Introduction')}
            {renderTextInput('Topic Name (Gujarati)', 'topicNameGujarati', 'e.g. રાસાયણિક પ્રક્રિયા પરિચય')}
            {renderTextInput('Description / Content (Gujarati)', 'description', 'Syllabus content explanation...', true)}
            {renderTextInput('Estimated Reading Time (minutes)', 'estimatedReadingTime', 'e.g. 5', false, true)}
            {renderTextInput('Keywords (comma-separated)', 'keywordsString', 'e.g. chemical, equation, GSEB')}
            {renderTextInput('Learning Outcome IDs (comma-separated)', 'outcomesString', 'e.g. lo_001, lo_002')}
            {renderDropdownInput('Difficulty Level', 'difficulty', ['easy', 'medium', 'hard'])}
            {renderTextInput('Display Order', 'order', 'e.g. 1', false, true)}
            {renderDropdownInput('Status', 'status', ['active', 'inactive'])}
            {renderSwitchInput('Premium Gate', 'isPremium')}
          </>
        )}

        {collectionName === COLLECTIONS.LEARNING_OUTCOMES && (
          <>
            {renderTextInput('Outcome text (Gujarati)', 'outcome_text_gu', 'e.g. વિદ્યાર્થી સમીકરણો સંતુલિત કરી શકે.', true)}
            {renderDropdownInput('Bloom Level', 'bloom_level', ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'])}
            {renderTextInput('Measurable Verb (Gujarati)', 'measurable_verb_gu', 'e.g. લખી શકે')}
            {renderTextInput('Display Order', 'display_order', 'e.g. 1', false, true)}
            {renderSwitchInput('Active Status', 'is_active')}
          </>
        )}

        {collectionName === COLLECTIONS.QUESTION_BANK && (
          <>
            {renderTextInput('Question text (Gujarati)', 'question_text_gu', 'Question content...', true)}
            {renderTextInput('Image URL (Optional)', 'image_url', 'e.g. https://.../image.png')}
            {fields.image_url ? (
              <View style={styles.imagePreviewContainer}>
                <Text style={styles.previewLabel}>Image Preview:</Text>
                <Image source={{ uri: fields.image_url }} style={styles.imagePreview} resizeMode="contain" />
              </View>
            ) : null}
            {renderTextInput('Session', 'session', 'e.g. 2025-26')}
            {renderDropdownInput('Question Type', 'question_type', [
              'mcq',
              'true_false',
              'fill_blank',
              'match',
              'short_answer',
              'long_answer',
              'diagram',
            ])}

            {/* MCQ Options editor */}
            {fields.question_type === 'mcq' && (
              <>
                <Text style={styles.subHeader}>Options Configuration</Text>
                {mcqOptions.map((opt, index) => (
                  <View key={opt.id} style={styles.optionRow}>
                    <Text style={styles.optionId}>{opt.id}</Text>
                    <TextInput
                      style={styles.optionInput}
                      value={opt.text_gu}
                      onChangeText={(val) => {
                        const newOpts = [...mcqOptions];
                        newOpts[index] = { ...opt, text_gu: val };
                        setMcqOptions(newOpts);
                      }}
                      placeholder={`Option ${opt.id} Gujarati text`}
                      placeholderTextColor={adminColors.textMuted}
                    />
                  </View>
                ))}
                {renderDropdownInput('Correct Option ID', 'correct_option_id', ['A', 'B', 'C', 'D'])}
              </>
            )}

            {/* True/False Options */}
            {fields.question_type === 'true_false' && (
              <>
                {renderDropdownInput('Correct Answer Choice', 'answer_gu', ['True', 'False'])}
              </>
            )}

            {/* Assertion & Reason Options */}
            {fields.question_type === 'assertion_reason' && (
              <>
                {renderTextInput('Assertion Statement', 'assertion_text', 'Assertion (A)...', true)}
                {renderTextInput('Reason Statement', 'reason_text', 'Reason (R)...', true)}
                {renderDropdownInput('Correct Option ID', 'correct_option_id', ['A', 'B', 'C', 'D'])}
              </>
            )}

            {/* General Answer input if not True/False */}
            {fields.question_type !== 'true_false' && (
              <>
                {renderTextInput('Suggested Answer (Gujarati)', 'answer_gu', 'Ideal key answer description...', true)}
              </>
            )}

            {renderTextInput('Explanation (Gujarati)', 'explanation_gu', 'Provide solution steps / explanation...', true)}
            {renderDropdownInput('Bloom Level', 'bloom_level', ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'])}
            {renderDropdownInput('Difficulty Level', 'difficulty_level', ['easy', 'medium', 'hard'])}
            {renderTextInput('Marks', 'marks', 'e.g. 2', false, true)}
            {renderTextInput('Tags (comma-separated)', 'tagsString', 'e.g. physics, light, mirror')}
            {renderTextInput('Exam Source / Board', 'source', 'e.g. GSEB Board March')}
            {renderTextInput('Exam Year', 'exam_year', 'e.g. 2024', false, true)}
            {renderSwitchInput('Verified Question', 'is_verified')}
            {renderSwitchInput('Premium Gate', 'is_premium')}
            {renderSwitchInput('Active Status', 'is_active')}
          </>
        )}

        {collectionName === COLLECTIONS.MCQ_BANK && (
          <>
            {renderTextInput('MCQ Question text (Gujarati)', 'question_text_gu', 'Question text...', true)}
            
            {/* MCQ Options editor */}
            <Text style={styles.subHeader}>Options Configuration</Text>
            {mcqOptions.map((opt, index) => (
              <View key={opt.id} style={styles.optionRow}>
                <Text style={styles.optionId}>{opt.id}</Text>
                <TextInput
                  style={styles.optionInput}
                  value={opt.text_gu}
                  onChangeText={(val) => {
                    const newOpts = [...mcqOptions];
                    newOpts[index] = { ...opt, text_gu: val };
                    setMcqOptions(newOpts);
                  }}
                  placeholder={`Option ${opt.id} Gujarati text`}
                  placeholderTextColor={adminColors.textMuted}
                />
              </View>
            ))}

            {renderDropdownInput('Correct Option ID', 'correct_option_id', ['A', 'B', 'C', 'D'])}
            {renderTextInput('Explanation (Gujarati)', 'explanation_gu', 'Provide solution steps...', true)}
            {renderDropdownInput('Bloom Level', 'bloom_level', ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'])}
            {renderDropdownInput('Difficulty Level', 'difficulty_level', ['easy', 'medium', 'hard'])}
            {renderTextInput('Marks', 'marks', 'e.g. 1', false, true)}
            {renderTextInput('Exam Source / Board', 'source', 'e.g. GSEB Board March')}
            {renderTextInput('Exam Year', 'exam_year', 'e.g. 2024', false, true)}
            {renderSwitchInput('Verified Question', 'is_verified')}
            {renderSwitchInput('Premium Gate', 'is_premium')}
            {renderSwitchInput('Active Status', 'is_active')}
          </>
        )}

        {collectionName === COLLECTIONS.WORKSHEETS && (
          <>
            {renderTextInput('Worksheet Title (Gujarati)', 'title_gu', 'e.g. સંતુલન સ્વાધ્યાય પત્રક')}
            {renderDropdownInput('Worksheet Type', 'worksheet_type', ['practice', 'revision', 'assignment', 'homework'])}
            {renderDropdownInput('Difficulty Level', 'difficulty_level', ['easy', 'medium', 'hard'])}
            {renderTextInput('PDF URL', 'pdf_url', 'https://cdn.gyandeep.com/ws.pdf')}
            {renderTextInput('Total Questions', 'total_questions', 'e.g. 10', false, true)}
            {renderTextInput('Total Marks', 'total_marks', 'e.g. 20', false, true)}
            {renderSwitchInput('Downloadable', 'is_downloadable')}
            {renderSwitchInput('Premium Gate', 'is_premium')}
            {renderSwitchInput('Active Status', 'is_active')}
          </>
        )}

        {collectionName === COLLECTIONS.LESSON_PLANS && (
          <>
            {renderTextInput('Lesson Plan Title (Gujarati)', 'title_gu', 'e.g. પ્રક્રિયાઓ પાઠ આયોજન')}
            {renderTextInput('Total Periods Required', 'total_periods', 'e.g. 6', false, true)}
            {renderTextInput('Period Duration (minutes)', 'period_duration_min', 'e.g. 45', false, true)}
            {renderSwitchInput('AI Generated Plan', 'is_ai_generated')}
            {renderSwitchInput('Active Status', 'is_active')}
          </>
        )}

        {collectionName === COLLECTIONS.FLASHCARDS && (
          <>
            {renderTextInput('Front Side Text (Gujarati)', 'front_text_gu', 'Front question or formula...', true)}
            {renderTextInput('Back Side Text (Gujarati)', 'back_text_gu', 'Back definition or answer...', true)}
            {renderDropdownInput('Card Type', 'card_type', ['definition', 'formula', 'concept', 'date', 'equation'])}
            {renderDropdownInput('Difficulty Level', 'difficulty_level', ['easy', 'medium', 'hard'])}
            {renderSwitchInput('AI Generated', 'is_ai_generated')}
            {renderSwitchInput('Premium Gate', 'is_premium')}
            {renderSwitchInput('Active Status', 'is_active')}
          </>
        )}

        {collectionName === COLLECTIONS.GLOSSARY && (
          <>
            {renderTextInput('Subject Code', 'subject_code', 'e.g. SCI10')}
            {renderTextInput('Word (Gujarati)', 'word_gu', 'e.g. ઉદ્દીપક')}
            {renderTextInput('Word (English)', 'word_en', 'e.g. Catalyst')}
            {renderTextInput('Definition (Gujarati)', 'definition_gu', 'Definition explanation...', true)}
            {renderTextInput('Example Sentence (Gujarati)', 'example_sentence_gu', 'Usage example...', true)}
            {renderSwitchInput('Active Status', 'is_active')}
          </>
        )}

        {collectionName === COLLECTIONS.VIDEOS && (
          <>
            {renderTextInput('Video Title (Gujarati)', 'title_gu', 'e.g. પ્રકરણ ૧ પ્રયોગ નિદર્શન')}
            {renderDropdownInput('Video Source', 'video_source', ['youtube', 'vimeo', 'gcs', 'cloudflare'])}
            {renderTextInput('Video URL', 'video_url', 'e.g. https://www.youtube.com/watch?v=...')}
            {renderTextInput('Thumbnail URL', 'thumbnail_url', 'https://cdn.gyandeep.com/thumbnail.png')}
            {renderTextInput('Duration (seconds)', 'duration_seconds', 'e.g. 300', false, true)}
            {renderDropdownInput('Language', 'language', ['Gujarati', 'English'])}
            {renderDropdownInput('Content Type', 'content_type', ['lecture', 'animation', 'experiment', 'revision'])}
            {renderTextInput('AI Transcript (Gujarati)', 'ai_transcript_gu', 'Automatic transcription text...', true)}
            {renderSwitchInput('AI Indexed', 'ai_indexed')}
            {renderSwitchInput('Premium Gate', 'is_premium')}
            {renderSwitchInput('Active Status', 'is_active')}
          </>
        )}

        {collectionName === COLLECTIONS.TEXTBOOKS && (
          <>
            {renderTextInput('Textbook Title (Gujarati)', 'title_gu', 'e.g. વિજ્ઞાન પાઠ્યપુસ્તક')}
            {renderTextInput('Textbook Title (English)', 'title_en', 'e.g. Science Textbook')}
            {renderTextInput('Publisher', 'publisher', 'e.g. GSEB (Gujarat Board)')}
            {renderTextInput('Edition Year', 'edition_year', 'e.g. 2024', false, true)}
            {renderTextInput('Total Pages', 'total_pages', 'e.g. 250', false, true)}
            {renderTextInput('Total Chapters', 'total_chapters', 'e.g. 15', false, true)}
            {renderTextInput('PDF File URL', 'pdf_url', 'https://cdn.gyandeep.com/book.pdf')}
            {renderDropdownInput('Language', 'language', ['Gujarati', 'English'])}
            {renderSwitchInput('Downloadable', 'is_downloadable')}
            {renderSwitchInput('OCR Processed', 'ocr_processed')}
            {renderSwitchInput('AI Indexed', 'ai_indexed')}
            {renderSwitchInput('Premium Gate', 'is_premium')}
            {renderSwitchInput('Active Status', 'is_active')}
          </>
        )}

        {/* Action Button */}
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#0F172A" />
          ) : (
            <Text style={styles.saveBtnText}>Save Configuration</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: adminColors.background,
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
  scrollContent: {
    padding: spacing.xl,
  },
  formTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: adminColors.textPrimary,
    marginBottom: spacing.xl,
  },
  subHeader: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: adminColors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  formGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: adminColors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: adminColors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: adminColors.textPrimary,
    fontSize: typography.size.sm,
  },
  inputMultiline: {
    height: 100,
    textAlignVertical: 'top',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingVertical: spacing.xxs,
  },
  switchLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: adminColors.textSecondary,
  },
  dropdownContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xxs,
  },
  dropdownItem: {
    backgroundColor: adminColors.surface,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  dropdownItemActive: {
    backgroundColor: adminColors.primary,
    borderColor: adminColors.primary,
  },
  dropdownText: {
    fontSize: typography.size.xs,
    color: adminColors.textSecondary,
  },
  dropdownTextActive: {
    color: adminColors.textInverse,
    fontWeight: typography.weight.bold,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  optionId: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: adminColors.primary,
    width: 20,
  },
  optionInput: {
    flex: 1,
    backgroundColor: adminColors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    color: adminColors.textPrimary,
    fontSize: typography.size.sm,
  },
  saveBtn: {
    backgroundColor: adminColors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
  },
  saveBtnText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: adminColors.textInverse,
  },
  imagePreviewContainer: {
    marginBottom: spacing.md,
    backgroundColor: adminColors.surfaceHover,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  previewLabel: {
    fontSize: typography.size.xs,
    color: adminColors.textSecondary,
    marginBottom: spacing.xs,
    fontWeight: typography.weight.semibold,
  },
  imagePreview: {
    width: '100%',
    height: 150,
    borderRadius: borderRadius.sm,
  },
  inputContainerWithAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  flexInput: {
    flex: 1,
  },
  inputActionBtn: {
    backgroundColor: adminColors.primary + '15',
    borderColor: adminColors.primary,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputActionBtnText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: adminColors.primary,
  },
});
