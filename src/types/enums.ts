/**
 * enums.ts
 *
 * Centralized enum / union-type definitions for Phase 2 content architecture.
 * Used by cms.types.ts, CMSDetailForm, validators, and bulk-import payload builders.
 *
 * IMPORTANT: These are the single source of truth for allowed values.
 * Do not duplicate these definitions elsewhere.
 */

// ─── Question Types ───────────────────────────────────────────

export const QUESTION_TYPES = [
  'mcq',
  'true_false',
  'fill_blank',
  'match',
  'short_answer',
  'long_answer',
  'hots',
  'previous_year',
] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];

/** Human-readable labels for dropdowns */
export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  mcq: 'MCQ',
  true_false: 'True / False',
  fill_blank: 'Fill in the Blank',
  match: 'Match the Following',
  short_answer: 'Short Answer',
  long_answer: 'Long Answer',
  hots: 'HOTS',
  previous_year: 'Previous Year',
};

// ─── Bloom's Taxonomy Levels ──────────────────────────────────

export const BLOOM_LEVELS = [
  'remember',
  'understand',
  'apply',
  'analyze',
  'evaluate',
  'create',
] as const;

export type BloomLevel = (typeof BLOOM_LEVELS)[number];

export const BLOOM_LEVEL_LABELS: Record<BloomLevel, string> = {
  remember: 'Remember',
  understand: 'Understand',
  apply: 'Apply',
  analyze: 'Analyze',
  evaluate: 'Evaluate',
  create: 'Create',
};

// ─── Difficulty ───────────────────────────────────────────────

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

export type Difficulty = (typeof DIFFICULTIES)[number];

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

// ─── Activity Types ───────────────────────────────────────────

export const ACTIVITY_TYPES = [
  'experiment',
  'group',
  'individual',
  'project',
  'game',
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  experiment: 'Experiment',
  group: 'Group Activity',
  individual: 'Individual Activity',
  project: 'Project',
  game: 'Game',
};

// ─── Video Source ─────────────────────────────────────────────

export const VIDEO_SOURCES = [
  'youtube',
  'storage',
  'vimeo',
  'gcs',
  'cloudflare',
] as const;

export type VideoSource = (typeof VIDEO_SOURCES)[number];

export const VIDEO_SOURCE_LABELS: Record<VideoSource, string> = {
  youtube: 'YouTube',
  storage: 'Firebase Storage',
  vimeo: 'Vimeo',
  gcs: 'Google Cloud Storage',
  cloudflare: 'Cloudflare',
};

// ─── Content Types (Topics) ───────────────────────────────────

export const CONTENT_TYPES = [
  'text',
  'interactive',
  'video',
  'mixed',
] as const;

export type ContentType = (typeof CONTENT_TYPES)[number];

// ─── Worksheet Types ──────────────────────────────────────────

export const WORKSHEET_TYPES = [
  'practice',
  'revision',
  'assignment',
  'homework',
] as const;

export type WorksheetType = (typeof WORKSHEET_TYPES)[number];

// ─── Flashcard Card Types ─────────────────────────────────────

export const CARD_TYPES = [
  'definition',
  'formula',
  'concept',
  'date',
  'equation',
] as const;

export type CardType = (typeof CARD_TYPES)[number];

// ─── Video Content Types ──────────────────────────────────────

export const VIDEO_CONTENT_TYPES = [
  'lecture',
  'animation',
  'experiment',
  'revision',
] as const;

export type VideoContentType = (typeof VIDEO_CONTENT_TYPES)[number];

// ─── Hierarchy Levels ─────────────────────────────────────────

export type HierarchyLevel =
  | 'standard'
  | 'subject'
  | 'chapter'
  | 'topic'
  | 'subTopic';

/**
 * Map of collection name → required hierarchy levels for filtering / parent selection.
 * Used by HierarchySelector to decide which cascading dropdowns to render.
 */
export const COLLECTION_HIERARCHY_LEVELS: Record<string, HierarchyLevel[]> = {
  topics: ['standard', 'subject', 'chapter'],
  sub_topics: ['standard', 'subject', 'chapter', 'topic'],
  learning_outcomes: ['standard', 'subject', 'chapter', 'topic'],
  chapter_summaries: ['standard', 'subject', 'chapter'],
  question_bank: ['standard', 'subject', 'chapter', 'topic'],
  mcq_bank: ['standard', 'subject', 'chapter', 'topic'],
  worksheets: ['standard', 'subject', 'chapter', 'topic'],
  lesson_plans: ['standard', 'subject', 'chapter'],
  flashcards: ['standard', 'subject', 'chapter', 'topic'],
  glossary: ['standard', 'subject', 'chapter'],
  videos: ['standard', 'subject', 'chapter', 'topic'],
  textbooks: ['standard', 'subject'],
  activities: ['standard', 'subject', 'chapter', 'topic'],
  keywords: ['standard', 'subject', 'chapter', 'topic'],
};
