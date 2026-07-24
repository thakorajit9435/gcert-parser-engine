import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import {
  QuestionType,
  BloomLevel,
  Difficulty,
  ActivityType,
  VideoSource,
  ContentType,
  WorksheetType,
  CardType,
  VideoContentType,
} from './enums';

// ─── Base Model ───────────────────────────────────────────────

export interface BaseCMSModel {
  id: string;
  isDeleted: boolean;
  createdAt: FirebaseFirestoreTypes.Timestamp | FirebaseFirestoreTypes.FieldValue;
  updatedAt: FirebaseFirestoreTypes.Timestamp | FirebaseFirestoreTypes.FieldValue;
  created_by: string;
}

// ─── 1. Topics ────────────────────────────────────────────────

export interface CMSTopic extends BaseCMSModel {
  topic_id: string;
  topic_number: number;
  chapter_id: string;
  subject_id: string;
  standard_id: string;
  standard_number: number;
  title_gu: string;
  title_en: string;
  description_en?: string;
  description_gu?: string;
  content_type: ContentType;
  content_gu?: string;
  content_en?: string;
  ai_summary_gu?: string;
  ai_keywords?: string[];
  rag_chunk_ids?: string[];
  tags?: string[];
  difficulty_level: Difficulty;
  is_active: boolean;
  is_premium: boolean;
  display_order: number;

  // Adaptor aliases (camelCase)
  topicId?: string;
  chapterId?: string;
  subjectId?: string;
  standardId?: string;
  isActive?: boolean;
  topicName?: string;
  topicNameGujarati?: string;
  description?: string;
  keywords?: string[];
  learningOutcomeIds?: string[];
  order?: number;
  estimatedReadingTime?: number;
  difficulty?: Difficulty;
  isPremium?: boolean;
  status?: 'active' | 'inactive';
}

// ─── 2. Sub Topics ────────────────────────────────────────────

export interface CMSSubTopic extends BaseCMSModel {
  sub_topic_id: string;
  topic_id: string;
  title_en: string;
  title_gu: string;
  display_order: number;
  is_active: boolean;

  // Adaptors
  id: string;
  topicId?: string;
  order?: number;
  isActive?: boolean;
}

// ─── 3. Learning Outcomes ─────────────────────────────────────

export interface CMSLearningOutcome extends BaseCMSModel {
  outcome_id: string;
  topic_id: string;
  chapter_id: string;
  subject_id: string;
  standard_id: string;
  outcome_text_gu: string;
  outcome_text_en: string;
  bloom_level: BloomLevel;
  measurable_verb_gu: string;
  linked_question_ids?: string[];
  is_active: boolean;
  display_order: number;

  // Adaptors
  topicId?: string;
  chapterId?: string;
  subjectId?: string;
  standardId?: string;
}

// ─── 4. Chapter Summary ──────────────────────────────────────

export interface ChapterSummaryKeyPoint {
  text_en: string;
  text_gu: string;
}

export interface ChapterSummaryFormula {
  formula: string;
  description_en: string;
  description_gu: string;
}

export interface ChapterSummaryDiagram {
  imageUrl: string;
  caption_en: string;
  caption_gu: string;
}

export interface CMSChapterSummary extends BaseCMSModel {
  summary_id: string;
  chapter_id: string;
  standard_id: string;
  subject_id: string;
  summary_en: string;
  summary_gu: string;
  key_points: ChapterSummaryKeyPoint[];
  important_formulas: ChapterSummaryFormula[];
  diagram_references: ChapterSummaryDiagram[];
  revision_notes_en: string;
  revision_notes_gu: string;
  is_active: boolean;

  // Adaptors
  id: string;
  chapterId?: string;
  standardId?: string;
  subjectId?: string;
  keyPoints?: ChapterSummaryKeyPoint[];
  importantFormulas?: ChapterSummaryFormula[];
  diagramReferences?: ChapterSummaryDiagram[];
  revisionNotes_en?: string;
  revisionNotes_gu?: string;
}

// ─── 5. Question Bank ─────────────────────────────────────────

export interface QuestionOption {
  id: string;
  text_gu: string;
  text_en?: string;
  image_url?: string;
}

export interface PreviousYearInfo {
  isPrevious: boolean;
  year?: number;
  board?: string;
}

export interface CMSQuestion extends BaseCMSModel {
  question_id: string;
  topic_id: string;
  chapter_id: string;
  subject_id: string;
  standard_id: string;
  standard_number: number;
  session?: string;
  question_text_gu: string;
  question_text_en?: string;
  question_type: QuestionType;
  answer_gu?: string;
  answer_en?: string;
  explanation_gu?: string;
  explanation_en?: string;
  image_url?: string;
  options?: QuestionOption[];
  correct_option_id?: string;
  match_pairs?: { left: string; right: string }[];
  assertion_text?: string;
  reason_text?: string;
  answer_hints?: string[];
  bloom_level: BloomLevel;
  difficulty_level: Difficulty;
  marks: number;
  previous_year?: PreviousYearInfo;
  source?: string;
  exam_year?: number;
  is_verified: boolean;
  is_active: boolean;
  is_premium: boolean;
  usage_count: number;
  correct_rate?: number;
  learning_outcome_ids?: string[];
  tags?: string[];

  // Adaptors
  difficulty?: Difficulty;
}

// ─── 6. MCQ Bank ──────────────────────────────────────────────

export interface MCQOption {
  id: string;
  text_gu: string;
  text_en?: string;
  isCorrect?: boolean;
}

export interface CMSMCQ extends BaseCMSModel {
  mcq_id: string;
  topic_id: string;
  chapter_id: string;
  subject_id: string;
  standard_id: string;
  standard_number: number;
  question_text_gu: string;
  question_text_en?: string;
  options: MCQOption[];
  correct_option_id: string;
  answer_gu?: string;
  answer_en?: string;
  explanation_gu?: string;
  explanation_en?: string;
  bloom_level: BloomLevel;
  difficulty_level: Difficulty;
  marks: number;
  previous_year?: PreviousYearInfo;
  source?: string;
  exam_year?: number;
  correct_rate?: number;
  is_verified: boolean;
  is_active: boolean;
  is_premium: boolean;
  usage_count: number;
  tags?: string[];

  // Adaptors
  difficulty?: Difficulty;
  correctOptionId?: string;
}

// ─── 7. Worksheets ────────────────────────────────────────────

export interface CMSWorksheet extends BaseCMSModel {
  worksheet_id: string;
  topic_id?: string;
  chapter_id: string;
  subject_id: string;
  standard_id: string;
  standard_number: number;
  title_gu: string;
  title_en: string;
  worksheet_type: WorksheetType;
  difficulty_level: Difficulty;
  pdf_url: string;
  total_questions: number;
  total_marks: number;
  question_ids?: string[];
  estimated_time_minutes?: number;
  is_downloadable: boolean;
  is_active: boolean;
  is_premium: boolean;
  download_count: number;
  tags?: string[];

  // Adaptors
  difficulty?: Difficulty;
  topicId?: string;
  chapterId?: string;
  subjectId?: string;
  standardId?: string;
  fileUrl?: string;
  questionIds?: string[];
  estimatedTimeMinutes?: number;
}

// ─── 8. Lesson Plans ──────────────────────────────────────────

export interface LessonPlanStep {
  stepNumber: number;
  activity_en: string;
  activity_gu: string;
  timeMinutes: number;
}

export interface LessonPeriod {
  period_number: number;
  topic_title_gu: string;
  activities_gu: string[];
}

export interface CMSLessonPlan extends BaseCMSModel {
  lesson_plan_id: string;
  chapter_id: string;
  subject_id: string;
  standard_id: string;
  title_gu: string;
  title_en: string;
  objective_en?: string;
  objective_gu?: string;
  duration_minutes: number;
  materials_needed: string[];
  steps: LessonPlanStep[];
  /** Legacy field — kept for backward compat */
  total_periods?: number;
  period_duration_min?: number;
  periods?: LessonPeriod[];
  learning_outcomes: string[];
  assessment_notes_en?: string;
  assessment_notes_gu?: string;
  is_active: boolean;
  is_ai_generated: boolean;

  // Adaptors
  chapterId?: string;
  subjectId?: string;
  standardId?: string;
  durationMinutes?: number;
  materialsNeeded?: string[];
  assessmentNotes_en?: string;
  assessmentNotes_gu?: string;
}

// ─── 9. Flashcards ────────────────────────────────────────────

export interface CMSFlashcard extends BaseCMSModel {
  flashcard_id: string;
  topic_id: string;
  chapter_id: string;
  subject_id: string;
  standard_id: string;
  /** Question side (front) */
  front_text_gu: string;
  front_text_en?: string;
  /** Answer side (back) */
  back_text_gu: string;
  back_text_en?: string;
  /** Spec aliases */
  question_en?: string;
  question_gu?: string;
  answer_en?: string;
  answer_gu?: string;
  image_url?: string;
  audio_url?: string;
  card_type: CardType;
  difficulty_level: Difficulty;
  bloom_level?: BloomLevel;
  is_active: boolean;
  is_premium: boolean;
  is_ai_generated: boolean;
  review_count: number;
  tags?: string[];

  // Adaptors
  topicId?: string;
  chapterId?: string;
  subjectId?: string;
  standardId?: string;
  imageUrl?: string;
  audioUrl?: string;
}

// ─── 10. Glossary ─────────────────────────────────────────────

export interface CMSGlossary extends BaseCMSModel {
  glossary_id: string;
  subject_id: string;
  chapter_id?: string;
  topic_id?: string;
  standard_id: string;
  standard_number: number;
  subject_code?: string;
  word_gu: string;
  word_en: string;
  meaning_gu: string;
  meaning_en: string;
  definition_gu: string;
  definition_en?: string;
  example_gu?: string;
  example_en?: string;
  example_sentence_gu?: string;
  is_active: boolean;
  tags?: string[];

  // Adaptors
  chapterId?: string;
  subjectId?: string;
  standardId?: string;
}

// ─── 11. Videos ───────────────────────────────────────────────

export interface CMSVideo extends BaseCMSModel {
  video_id: string;
  chapter_id: string;
  topic_id?: string;
  subject_id: string;
  standard_id: string;
  standard_number: number;
  title_gu: string;
  title_en: string;
  description_en?: string;
  description_gu?: string;
  video_source: VideoSource;
  video_url: string;
  thumbnail_url: string;
  duration_seconds: number;
  language: string;
  content_type: VideoContentType;
  ai_transcript_gu?: string;
  view_count: number;
  like_count: number;
  is_active: boolean;
  is_premium: boolean;
  ai_indexed: boolean;
  tags?: string[];

  // Adaptors
  topicId?: string;
  chapterId?: string;
  subjectId?: string;
  standardId?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  source?: VideoSource;
}

// ─── 12. Textbooks ────────────────────────────────────────────

export interface ChapterPageMapItem {
  chapter_number?: number;
  chapter_title_gu?: string;
  chapterId?: string;
  topicId?: string;
  start_page: number;
  end_page: number;
}

export interface CMSTextbook extends BaseCMSModel {
  textbook_id: string;
  subject_id: string;
  standard_id: string;
  standard_number: number;
  title_gu: string;
  title_en: string;
  publisher: string;
  edition_year: number;
  total_pages: number;
  total_chapters: number;
  pdf_url: string;
  chapter_page_map: ChapterPageMapItem[];
  language: string;
  is_downloadable: boolean;
  is_active: boolean;
  is_premium: boolean;
  ocr_processed: boolean;
  ai_indexed: boolean;

  // Adaptors
  subjectId?: string;
  standardId?: string;
  pdfUrl?: string;
  totalPages?: number;
  chapterMap?: ChapterPageMapItem[];
  editionYear?: number;
}

// ─── 13. Activities ───────────────────────────────────────────

export interface CMSActivity extends BaseCMSModel {
  activity_id: string;
  topic_id: string;
  chapter_id: string;
  subject_id: string;
  standard_id: string;
  title_en: string;
  title_gu: string;
  instructions_en: string;
  instructions_gu: string;
  materials_needed: string[];
  duration_minutes: number;
  activity_type: ActivityType;
  image_url?: string;
  is_active: boolean;

  // Adaptors
  id: string;
  topicId?: string;
  chapterId?: string;
  subjectId?: string;
  standardId?: string;
  materialsNeeded?: string[];
  durationMinutes?: number;
  type?: ActivityType;
  imageUrl?: string;
  isActive?: boolean;
}

// ─── 14. Keywords ─────────────────────────────────────────────

export interface CMSKeyword extends BaseCMSModel {
  keyword_id: string;
  topic_id: string;
  chapter_id: string;
  subject_id: string;
  standard_id: string;
  keyword_en: string;
  keyword_gu: string;
  meaning_gu: string;
  meaning_en: string;
  is_active: boolean;

  // Adaptors
  id: string;
  topicId?: string;
  chapterId?: string;
  subjectId?: string;
  standardId?: string;
  isActive?: boolean;
}

// ─── AI Models (Phase 3 prep – unchanged) ─────────────────────

export interface AIKnowledgeBase extends BaseCMSModel {
  kb_id: string;
  topic_id: string;
  chapter_id: string;
  subject_id: string;
  standard_id: string;
  summary_gu: string;
  summary_en?: string;
  keywords: string[];
  revision_notes: string[];
  formulas?: { name_gu: string; latex_formula: string; explanation_gu: string }[];
  activities: { title_gu: string; objective_gu: string; procedure_gu: string }[];
  important_questions: { question_gu: string; answer_gu: string; marks: number }[];
  related_topics: { topic_id: string; relation_type: 'prerequisite' | 'extension' | 'analogy' }[];
  metadata: Record<string, any>;
}

export interface AIRagChunk {
  chunk_id: string;
  source_id: string;
  source_type: 'textbooks' | 'summaries' | 'glossary' | 'worksheets';
  topic_id: string;
  chapter_id: string;
  subject_id: string;
  standard_id: string;
  text_gu: string;
  text_en?: string;
  token_count: number;
  overlap_prev_id?: string;
  overlap_next_id?: string;
}

export interface AIEmbedding {
  embedding_id: string;
  chunk_id: string;
  vector: number[];
  model_name: string;
  dimensions: number;
}

export interface AIChatMessage {
  sender: 'student' | 'tutor';
  text: string;
  audio_url?: string;
  timestamp: any;
}

export interface AIChatHistory {
  thread_id: string;
  student_id: string;
  topic_id?: string;
  chapter_id?: string;
  messages: AIChatMessage[];
  status: 'active' | 'archived';
  suggested_next_steps?: string[];
}

export interface AIVoiceHistory {
  voice_id: string;
  student_id: string;
  thread_id: string;
  audio_url: string;
  transcription: string;
  pronunciation_score?: number;
  feedback_gu?: string;
}
