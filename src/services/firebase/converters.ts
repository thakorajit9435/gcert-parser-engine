import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import {
  CMSTopic,
  CMSLearningOutcome,
  CMSQuestion,
  CMSMCQ,
  CMSWorksheet,
  CMSLessonPlan,
  CMSFlashcard,
  CMSGlossary,
  CMSVideo,
  CMSTextbook,
  CMSSubTopic,
  CMSChapterSummary,
  CMSActivity,
  CMSKeyword
} from '../../types/cms.types';

// Generic Firestore Data Converter helper
export const createConverter = <T extends { id: string }>(
  toDb: (data: Partial<T>) => any,
  fromDb: (id: string, data: any) => T
) => ({
  toFirestore(model: Partial<T>): FirebaseFirestoreTypes.DocumentData {
    return toDb(model);
  },
  fromFirestore(snapshot: any): T {
    return fromDb(snapshot.id, snapshot.data());
  }
});

// Helper to preserve Firebase Timestamp objects
const parseDate = (val: any): any => {
  if (val && typeof val.toDate === 'function') {
    return val;
  }
  return val;
};

// ─── 1. Topics Converter ──────────────────────────────────────

export const topicsConverter = createConverter<CMSTopic>(
  (data) => {
    const payload: any = { ...data };
    if (data.topicId) payload.topic_id = data.topicId;
    if (data.chapterId) payload.chapter_id = data.chapterId;
    if (data.subjectId) payload.subject_id = data.subjectId;
    if (data.standardId) payload.standard_id = data.standardId;
    if (data.isActive !== undefined) payload.is_active = data.isActive;
    if (data.isPremium !== undefined) payload.is_premium = data.isPremium;
    if (data.order !== undefined) payload.display_order = data.order;
    return payload;
  },
  (id, data) => ({
    id,
    ...data,
    topicId: data.topic_id || id,
    chapterId: data.chapter_id || '',
    subjectId: data.subject_id || '',
    standardId: data.standard_id || '',
    title_en: data.title_en || '',
    title_gu: data.title_gu || '',
    description_en: data.description_en || data.content_en || '',
    description_gu: data.description_gu || data.content_gu || '',
    order: data.display_order || 1,
    isActive: data.is_active !== false,
    isPremium: !!data.is_premium,
    createdAt: parseDate(data.createdAt),
    updatedAt: parseDate(data.updatedAt),
    created_by: data.created_by || ''
  })
);

// ─── 2. Sub Topics Converter ──────────────────────────────────

export const subTopicsConverter = createConverter<CMSSubTopic>(
  (data) => {
    const payload: any = { ...data };
    if (data.topicId) payload.topic_id = data.topicId;
    if (data.isActive !== undefined) payload.is_active = data.isActive;
    if (data.order !== undefined) payload.display_order = data.order;
    return payload;
  },
  (id, data) => ({
    id,
    ...data,
    sub_topic_id: data.sub_topic_id || id,
    topicId: data.topic_id || '',
    title_en: data.title_en || '',
    title_gu: data.title_gu || '',
    order: data.display_order || 1,
    isActive: data.is_active !== false,
    createdAt: parseDate(data.createdAt),
    updatedAt: parseDate(data.updatedAt),
    created_by: data.created_by || ''
  })
);

// ─── 3. Learning Outcomes Converter ───────────────────────────

export const learningOutcomesConverter = createConverter<CMSLearningOutcome>(
  (data) => {
    const payload: any = { ...data };
    if (data.topicId) payload.topic_id = data.topicId;
    if (data.chapterId) payload.chapter_id = data.chapterId;
    if (data.subjectId) payload.subject_id = data.subjectId;
    if (data.standardId) payload.standard_id = data.standardId;
    return payload;
  },
  (id, data) => ({
    id,
    ...data,
    outcome_id: data.outcome_id || id,
    topic_id: data.topic_id || '',
    topicId: data.topic_id || '',
    chapter_id: data.chapter_id || '',
    chapterId: data.chapter_id || '',
    subject_id: data.subject_id || '',
    subjectId: data.subject_id || '',
    standard_id: data.standard_id || '',
    standardId: data.standard_id || '',
    outcome_text_gu: data.outcome_text_gu || '',
    outcome_text_en: data.outcome_text_en || '',
    bloom_level: data.bloom_level || 'remember',
    measurable_verb_gu: data.measurable_verb_gu || '',
    is_active: data.is_active !== false,
    display_order: data.display_order || 1,
    createdAt: parseDate(data.createdAt),
    updatedAt: parseDate(data.updatedAt),
    created_by: data.created_by || ''
  })
);

// ─── 4. Chapter Summaries Converter ───────────────────────────

export const chapterSummariesConverter = createConverter<CMSChapterSummary>(
  (data) => {
    const payload: any = { ...data };
    if (data.chapterId) payload.chapter_id = data.chapterId;
    if (data.standardId) payload.standard_id = data.standardId;
    if (data.subjectId) payload.subject_id = data.subjectId;
    if (data.keyPoints) payload.key_points = data.keyPoints;
    if (data.importantFormulas) payload.important_formulas = data.importantFormulas;
    if (data.diagramReferences) payload.diagram_references = data.diagramReferences;
    if (data.revisionNotes_en) payload.revision_notes_en = data.revisionNotes_en;
    if (data.revisionNotes_gu) payload.revision_notes_gu = data.revisionNotes_gu;
    return payload;
  },
  (id, data) => ({
    id,
    ...data,
    summary_id: data.summary_id || id,
    chapterId: data.chapter_id || '',
    standardId: data.standard_id || '',
    subjectId: data.subject_id || '',
    summary_en: data.summary_en || '',
    summary_gu: data.summary_gu || '',
    keyPoints: data.key_points || [],
    importantFormulas: data.important_formulas || [],
    diagramReferences: data.diagram_references || [],
    revisionNotes_en: data.revision_notes_en || '',
    revisionNotes_gu: data.revision_notes_gu || '',
    is_active: data.is_active !== false,
    createdAt: parseDate(data.createdAt),
    updatedAt: parseDate(data.updatedAt),
    created_by: data.created_by || ''
  })
);

// ─── 5. Question Bank Converter ───────────────────────────────

export const questionBankConverter = createConverter<CMSQuestion>(
  (data) => {
    const payload: any = { ...data };
    if (data.difficulty) payload.difficulty_level = data.difficulty;
    return payload;
  },
  (id, data) => ({
    id,
    ...data,
    question_id: data.question_id || id,
    topic_id: data.topic_id || '',
    chapter_id: data.chapter_id || '',
    subject_id: data.subject_id || '',
    standard_id: data.standard_id || '',
    standard_number: data.standard_number || 1,
    question_text_gu: data.question_text_gu || '',
    question_text_en: data.question_text_en || '',
    question_type: data.question_type || 'short_answer',
    answer_gu: data.answer_gu || '',
    answer_en: data.answer_en || '',
    explanation_gu: data.explanation_gu || '',
    explanation_en: data.explanation_en || '',
    bloom_level: data.bloom_level || 'remember',
    difficulty_level: data.difficulty_level || 'medium',
    difficulty: data.difficulty_level || 'medium',
    marks: data.marks || 1,
    previous_year: data.previous_year || null,
    is_verified: !!data.is_verified,
    is_active: data.is_active !== false,
    is_premium: !!data.is_premium,
    usage_count: data.usage_count || 0,
    tags: data.tags || [],
    createdAt: parseDate(data.createdAt),
    updatedAt: parseDate(data.updatedAt),
    created_by: data.created_by || ''
  })
);

// ─── 6. MCQ Bank Converter ───────────────────────────────────

export const mcqBankConverter = createConverter<CMSMCQ>(
  (data) => {
    const payload: any = { ...data };
    if (data.difficulty) payload.difficulty_level = data.difficulty;
    if (data.correctOptionId) payload.correct_option_id = data.correctOptionId;
    return payload;
  },
  (id, data) => ({
    id,
    ...data,
    mcq_id: data.mcq_id || id,
    topic_id: data.topic_id || '',
    chapter_id: data.chapter_id || '',
    subject_id: data.subject_id || '',
    standard_id: data.standard_id || '',
    standard_number: data.standard_number || 1,
    question_text_gu: data.question_text_gu || '',
    question_text_en: data.question_text_en || '',
    options: data.options || [],
    correct_option_id: data.correct_option_id || 'A',
    correctOptionId: data.correct_option_id || 'A',
    answer_gu: data.answer_gu || '',
    answer_en: data.answer_en || '',
    explanation_gu: data.explanation_gu || '',
    explanation_en: data.explanation_en || '',
    bloom_level: data.bloom_level || 'remember',
    difficulty_level: data.difficulty_level || 'medium',
    difficulty: data.difficulty_level || 'medium',
    marks: data.marks || 1,
    previous_year: data.previous_year || null,
    is_verified: !!data.is_verified,
    is_active: data.is_active !== false,
    is_premium: !!data.is_premium,
    usage_count: data.usage_count || 0,
    tags: data.tags || [],
    createdAt: parseDate(data.createdAt),
    updatedAt: parseDate(data.updatedAt),
    created_by: data.created_by || ''
  })
);

// ─── 7. Worksheets Converter ─────────────────────────────────

export const worksheetsConverter = createConverter<CMSWorksheet>(
  (data) => {
    const payload: any = { ...data };
    if (data.difficulty) payload.difficulty_level = data.difficulty;
    if (data.topicId) payload.topic_id = data.topicId;
    if (data.chapterId) payload.chapter_id = data.chapterId;
    if (data.subjectId) payload.subject_id = data.subjectId;
    if (data.standardId) payload.standard_id = data.standardId;
    if (data.fileUrl) payload.pdf_url = data.fileUrl;
    if (data.questionIds) payload.question_ids = data.questionIds;
    if (data.estimatedTimeMinutes) payload.estimated_time_minutes = data.estimatedTimeMinutes;
    return payload;
  },
  (id, data) => ({
    id,
    ...data,
    worksheet_id: data.worksheet_id || id,
    topic_id: data.topic_id || '',
    topicId: data.topic_id || '',
    chapter_id: data.chapter_id || '',
    chapterId: data.chapter_id || '',
    subject_id: data.subject_id || '',
    subjectId: data.subject_id || '',
    standard_id: data.standard_id || '',
    standardId: data.standard_id || '',
    title_gu: data.title_gu || '',
    title_en: data.title_en || '',
    worksheet_type: data.worksheet_type || 'practice',
    difficulty_level: data.difficulty_level || 'medium',
    difficulty: data.difficulty_level || 'medium',
    pdf_url: data.pdf_url || '',
    fileUrl: data.pdf_url || '',
    total_questions: data.total_questions || 0,
    total_marks: data.total_marks || 0,
    question_ids: data.question_ids || [],
    questionIds: data.question_ids || [],
    estimated_time_minutes: data.estimated_time_minutes || 0,
    estimatedTimeMinutes: data.estimated_time_minutes || 0,
    is_downloadable: data.is_downloadable !== false,
    is_active: data.is_active !== false,
    is_premium: !!data.is_premium,
    download_count: data.download_count || 0,
    createdAt: parseDate(data.createdAt),
    updatedAt: parseDate(data.updatedAt),
    created_by: data.created_by || ''
  })
);

// ─── 8. Lesson Plans Converter ────────────────────────────────

export const lessonPlansConverter = createConverter<CMSLessonPlan>(
  (data) => {
    const payload: any = { ...data };
    if (data.chapterId) payload.chapter_id = data.chapterId;
    if (data.subjectId) payload.subject_id = data.subjectId;
    if (data.standardId) payload.standard_id = data.standardId;
    if (data.durationMinutes) payload.duration_minutes = data.durationMinutes;
    if (data.materialsNeeded) payload.materials_needed = data.materialsNeeded;
    if (data.assessmentNotes_en) payload.assessment_notes_en = data.assessmentNotes_en;
    if (data.assessmentNotes_gu) payload.assessment_notes_gu = data.assessmentNotes_gu;
    return payload;
  },
  (id, data) => ({
    id,
    ...data,
    lesson_plan_id: data.lesson_plan_id || id,
    chapter_id: data.chapter_id || '',
    chapterId: data.chapter_id || '',
    subject_id: data.subject_id || '',
    subjectId: data.subject_id || '',
    standard_id: data.standard_id || '',
    standardId: data.standard_id || '',
    title_gu: data.title_gu || '',
    title_en: data.title_en || '',
    objective_en: data.objective_en || '',
    objective_gu: data.objective_gu || '',
    duration_minutes: data.duration_minutes || data.period_duration_min || 45,
    durationMinutes: data.duration_minutes || data.period_duration_min || 45,
    materials_needed: data.materials_needed || [],
    materialsNeeded: data.materials_needed || [],
    steps: data.steps || [],
    total_periods: data.total_periods || 1,
    period_duration_min: data.period_duration_min || 45,
    periods: data.periods || [],
    learning_outcomes: data.learning_outcomes || [],
    assessment_notes_en: data.assessment_notes_en || '',
    assessment_notes_gu: data.assessment_notes_gu || '',
    assessmentNotes_en: data.assessment_notes_en || '',
    assessmentNotes_gu: data.assessment_notes_gu || '',
    is_active: data.is_active !== false,
    is_ai_generated: !!data.is_ai_generated,
    createdAt: parseDate(data.createdAt),
    updatedAt: parseDate(data.updatedAt),
    created_by: data.created_by || ''
  })
);

// ─── 9. Flashcards Converter ─────────────────────────────────

export const flashcardsConverter = createConverter<CMSFlashcard>(
  (data) => {
    const payload: any = { ...data };
    if (data.topicId) payload.topic_id = data.topicId;
    if (data.chapterId) payload.chapter_id = data.chapterId;
    if (data.subjectId) payload.subject_id = data.subjectId;
    if (data.standardId) payload.standard_id = data.standardId;
    if (data.imageUrl) payload.image_url = data.imageUrl;
    if (data.audioUrl) payload.audio_url = data.audioUrl;
    // Map spec aliases to DB fields
    if (data.question_gu) payload.front_text_gu = data.question_gu;
    if (data.question_en) payload.front_text_en = data.question_en;
    if (data.answer_gu) payload.back_text_gu = data.answer_gu;
    if (data.answer_en) payload.back_text_en = data.answer_en;
    return payload;
  },
  (id, data) => ({
    id,
    ...data,
    flashcard_id: data.flashcard_id || id,
    topic_id: data.topic_id || '',
    topicId: data.topic_id || '',
    chapter_id: data.chapter_id || '',
    chapterId: data.chapter_id || '',
    subject_id: data.subject_id || '',
    subjectId: data.subject_id || '',
    standard_id: data.standard_id || '',
    standardId: data.standard_id || '',
    front_text_gu: data.front_text_gu || data.question_gu || '',
    front_text_en: data.front_text_en || data.question_en || '',
    back_text_gu: data.back_text_gu || data.answer_gu || '',
    back_text_en: data.back_text_en || data.answer_en || '',
    question_gu: data.front_text_gu || data.question_gu || '',
    question_en: data.front_text_en || data.question_en || '',
    answer_gu: data.back_text_gu || data.answer_gu || '',
    answer_en: data.back_text_en || data.answer_en || '',
    image_url: data.image_url || '',
    imageUrl: data.image_url || '',
    audio_url: data.audio_url || '',
    audioUrl: data.audio_url || '',
    card_type: data.card_type || 'concept',
    difficulty_level: data.difficulty_level || 'medium',
    is_active: data.is_active !== false,
    is_premium: !!data.is_premium,
    is_ai_generated: !!data.is_ai_generated,
    review_count: data.review_count || 0,
    createdAt: parseDate(data.createdAt),
    updatedAt: parseDate(data.updatedAt),
    created_by: data.created_by || ''
  })
);

// ─── 10. Glossary Converter ──────────────────────────────────

export const glossaryConverter = createConverter<CMSGlossary>(
  (data) => {
    const payload: any = { ...data };
    if (data.chapterId) payload.chapter_id = data.chapterId;
    if (data.subjectId) payload.subject_id = data.subjectId;
    if (data.standardId) payload.standard_id = data.standardId;
    return payload;
  },
  (id, data) => ({
    id,
    ...data,
    glossary_id: data.glossary_id || id,
    chapter_id: data.chapter_id || '',
    chapterId: data.chapter_id || '',
    subject_id: data.subject_id || '',
    subjectId: data.subject_id || '',
    standard_id: data.standard_id || '',
    standardId: data.standard_id || '',
    standard_number: data.standard_number || 1,
    subject_code: data.subject_code || '',
    word_gu: data.word_gu || '',
    word_en: data.word_en || '',
    meaning_gu: data.meaning_gu || '',
    meaning_en: data.meaning_en || '',
    definition_gu: data.definition_gu || '',
    definition_en: data.definition_en || '',
    example_gu: data.example_gu || data.example_sentence_gu || '',
    example_en: data.example_en || '',
    is_active: data.is_active !== false,
    createdAt: parseDate(data.createdAt),
    updatedAt: parseDate(data.updatedAt),
    created_by: data.created_by || ''
  })
);

// ─── 11. Videos Converter ────────────────────────────────────

export const videosConverter = createConverter<CMSVideo>(
  (data) => {
    const payload: any = { ...data };
    if (data.topicId) payload.topic_id = data.topicId;
    if (data.chapterId) payload.chapter_id = data.chapterId;
    if (data.subjectId) payload.subject_id = data.subjectId;
    if (data.standardId) payload.standard_id = data.standardId;
    if (data.videoUrl) payload.video_url = data.videoUrl;
    if (data.thumbnailUrl) payload.thumbnail_url = data.thumbnailUrl;
    if (data.durationSeconds !== undefined) payload.duration_seconds = data.durationSeconds;
    if (data.source) payload.video_source = data.source;
    return payload;
  },
  (id, data) => ({
    id,
    ...data,
    video_id: data.video_id || id,
    chapter_id: data.chapter_id || '',
    chapterId: data.chapter_id || '',
    topic_id: data.topic_id || '',
    topicId: data.topic_id || '',
    subject_id: data.subject_id || '',
    subjectId: data.subject_id || '',
    standard_id: data.standard_id || '',
    standardId: data.standard_id || '',
    standard_number: data.standard_number || 1,
    title_gu: data.title_gu || '',
    title_en: data.title_en || '',
    description_en: data.description_en || '',
    description_gu: data.description_gu || '',
    video_source: data.video_source || 'youtube',
    source: data.video_source || 'youtube',
    video_url: data.video_url || '',
    videoUrl: data.video_url || '',
    thumbnail_url: data.thumbnail_url || '',
    thumbnailUrl: data.thumbnail_url || '',
    duration_seconds: data.duration_seconds || 0,
    durationSeconds: data.duration_seconds || 0,
    language: data.language || 'Gujarati',
    content_type: data.content_type || 'lecture',
    view_count: data.view_count || 0,
    like_count: data.like_count || 0,
    is_active: data.is_active !== false,
    is_premium: !!data.is_premium,
    ai_indexed: !!data.ai_indexed,
    createdAt: parseDate(data.createdAt),
    updatedAt: parseDate(data.updatedAt),
    created_by: data.created_by || ''
  })
);

// ─── 12. Textbooks Converter ─────────────────────────────────

export const textbooksConverter = createConverter<CMSTextbook>(
  (data) => {
    const payload: any = { ...data };
    if (data.subjectId) payload.subject_id = data.subjectId;
    if (data.standardId) payload.standard_id = data.standardId;
    if (data.pdfUrl) payload.pdf_url = data.pdfUrl;
    if (data.totalPages) payload.total_pages = data.totalPages;
    if (data.chapterMap) payload.chapter_page_map = data.chapterMap;
    if (data.editionYear) payload.edition_year = data.editionYear;
    return payload;
  },
  (id, data) => ({
    id,
    ...data,
    textbook_id: data.textbook_id || id,
    subject_id: data.subject_id || '',
    subjectId: data.subject_id || '',
    standard_id: data.standard_id || '',
    standardId: data.standard_id || '',
    standard_number: data.standard_number || 1,
    title_gu: data.title_gu || '',
    title_en: data.title_en || '',
    publisher: data.publisher || '',
    edition_year: data.edition_year || 2024,
    editionYear: data.edition_year || 2024,
    total_pages: data.total_pages || 0,
    totalPages: data.total_pages || 0,
    total_chapters: data.total_chapters || 0,
    pdf_url: data.pdf_url || '',
    pdfUrl: data.pdf_url || '',
    chapter_page_map: data.chapter_page_map || [],
    chapterMap: data.chapter_page_map || [],
    language: data.language || 'Gujarati',
    is_downloadable: data.is_downloadable !== false,
    is_active: data.is_active !== false,
    is_premium: !!data.is_premium,
    ocr_processed: !!data.ocr_processed,
    ai_indexed: !!data.ai_indexed,
    createdAt: parseDate(data.createdAt),
    updatedAt: parseDate(data.updatedAt),
    created_by: data.created_by || ''
  })
);

// ─── 13. Activities Converter ────────────────────────────────

export const activitiesConverter = createConverter<CMSActivity>(
  (data) => {
    const payload: any = { ...data };
    if (data.topicId) payload.topic_id = data.topicId;
    if (data.chapterId) payload.chapter_id = data.chapterId;
    if (data.subjectId) payload.subject_id = data.subjectId;
    if (data.standardId) payload.standard_id = data.standardId;
    if (data.materialsNeeded) payload.materials_needed = data.materialsNeeded;
    if (data.durationMinutes) payload.duration_minutes = data.durationMinutes;
    if (data.type) payload.activity_type = data.type;
    if (data.imageUrl) payload.image_url = data.imageUrl;
    if (data.isActive !== undefined) payload.is_active = data.isActive;
    return payload;
  },
  (id, data) => ({
    id,
    ...data,
    activity_id: data.activity_id || id,
    topicId: data.topic_id || '',
    chapterId: data.chapter_id || '',
    subjectId: data.subject_id || '',
    standardId: data.standard_id || '',
    title_en: data.title_en || '',
    title_gu: data.title_gu || '',
    instructions_en: data.instructions_en || '',
    instructions_gu: data.instructions_gu || '',
    materialsNeeded: data.materials_needed || [],
    durationMinutes: data.duration_minutes || 0,
    type: data.activity_type || 'experiment',
    imageUrl: data.image_url || '',
    isActive: data.is_active !== false,
    createdAt: parseDate(data.createdAt),
    updatedAt: parseDate(data.updatedAt),
    created_by: data.created_by || ''
  })
);

// ─── 14. Keywords Converter ──────────────────────────────────

export const keywordsConverter = createConverter<CMSKeyword>(
  (data) => {
    const payload: any = { ...data };
    if (data.topicId) payload.topic_id = data.topicId;
    if (data.chapterId) payload.chapter_id = data.chapterId;
    if (data.subjectId) payload.subject_id = data.subjectId;
    if (data.standardId) payload.standard_id = data.standardId;
    if (data.isActive !== undefined) payload.is_active = data.isActive;
    return payload;
  },
  (id, data) => ({
    id,
    ...data,
    keyword_id: data.keyword_id || id,
    topicId: data.topic_id || '',
    chapterId: data.chapter_id || '',
    subjectId: data.subject_id || '',
    standardId: data.standard_id || '',
    keyword_en: data.keyword_en || '',
    keyword_gu: data.keyword_gu || '',
    meaning_gu: data.meaning_gu || '',
    meaning_en: data.meaning_en || '',
    isActive: data.is_active !== false,
    createdAt: parseDate(data.createdAt),
    updatedAt: parseDate(data.updatedAt),
    created_by: data.created_by || ''
  })
);
