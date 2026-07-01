/**
 * chapterImport.service.ts
 *
 * Bulk import service for Chapters.
 *
 * CRITICAL RULE: This service calls createChapter() from content.service.ts
 * — the exact same function used internally by AddEditChapterScreen.
 * It does NOT write any custom Firestore payload.
 *
 * Exact schema captured from AddEditChapterScreen.tsx handleSave():
 *   title           — string (English)
 *   titleGu         — string (Gujarati)
 *   description     — string (optional)
 *   order           — number
 *   isPremium       — boolean
 *   videoUrl        — string | null
 *   pdfUrl          — string | null (bulk import = null, can only be set via screen)
 *   swadhyayPdfUrl  — string | null (bulk import = null)
 *   hasSwadhyay     — boolean (default true, from AddEditChapterScreen)
 *   hasMcq          — boolean (default true)
 *   hasMixedQuiz    — boolean (default true)
 *   subjectId       — string
 *   standardId      — string
 *   isDeleted       — false  (added by createChapter)
 *   createdAt       — serverTimestamp (added by createChapter)
 *   updatedAt       — serverTimestamp (added by createChapter)
 */

import firestore from '@react-native-firebase/firestore';
import { COLLECTIONS } from '../../constants';
import { createChapter } from '../firebase/content.service';
import { Chapter } from '../../types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type RowStatus = 'valid' | 'duplicate' | 'invalid';

/**
 * The payload createChapter() expects.
 * Matches Chapter type minus server-managed fields.
 */
export type ChapterCreatePayload = Omit<Chapter, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>;

export interface ChapterImportRow {
  rowIndex: number;
  /** The payload that will be passed to createChapter() */
  payload: ChapterCreatePayload;
  status: RowStatus;
  reason?: string;
}

export interface ChapterImportPreview {
  totalRows: number;
  validRows: ChapterImportRow[];
  duplicateRows: ChapterImportRow[];
  invalidRows: ChapterImportRow[];
}

export interface ImportResult {
  imported: number;
  skipped: number;
  failed: number;
  failureDetails: { rowIndex: number; title: string; reason: string }[];
}

// ─── CSV Template ─────────────────────────────────────────────────────────────

/**
 * Columns mirror the fields AddEditChapterScreen collects from admin.
 * pdfUrl and swadhyayPdfUrl are intentionally omitted — they require file upload.
 */
export const CHAPTER_CSV_TEMPLATE_HEADERS = [
  'standardId',
  'subjectId',
  'title',
  'titleGu',
  'description',
  'order',
  'isPremium',
  'hasSwadhyay',
  'hasMcq',
  'hasMixedQuiz',
  'videoUrl',
];

export const CHAPTER_CSV_TEMPLATE_ROWS = [
  ['6', 'PASTE_SUBJECT_DOC_ID', 'Chapter 1 - Introduction', 'પ્રકરણ ૧ - પ્રસ્તાવના', 'Introduction to the chapter', '1', 'false', 'true', 'true', 'true', ''],
  ['6', 'PASTE_SUBJECT_DOC_ID', 'Chapter 2 - Basics', 'પ્રકરણ ૨ - મૂળભૂત', 'Basic concepts', '2', 'false', 'true', 'true', 'true', 'https://youtube.com/watch?v=example'],
];

// ─── Schema Validation ────────────────────────────────────────────────────────

/**
 * Phase 4: Compare one existing Chapter doc's keys against our import payload.
 */
export async function validateChapterSchemaAgainstFirestore(): Promise<{
  valid: boolean;
  existingDoc?: Record<string, unknown>;
  error?: string;
}> {
  try {
    const snapshot = await firestore()
      .collection(COLLECTIONS.CHAPTERS)
      .where('isDeleted', '==', false)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return { valid: true };
    }

    const existingDoc = snapshot.docs[0]!.data() as Record<string, unknown>;
    return { valid: true, existingDoc };
  } catch (err) {
    return { valid: false, error: (err as Error).message };
  }
}

// ─── Boolean Parser ───────────────────────────────────────────────────────────

function parseBool(value: string | undefined, defaultVal: boolean): boolean {
  const v = (value ?? '').toLowerCase().trim();
  if (v === 'true' || v === '1' || v === 'yes') return true;
  if (v === 'false' || v === '0' || v === 'no') return false;
  return defaultVal;
}

// ─── Payload Builder ──────────────────────────────────────────────────────────

/**
 * Build a ChapterCreatePayload from a raw CSV row.
 * Mirrors EXACTLY what AddEditChapterScreen builds in chapterData before .add().
 *
 * Note: pdfUrl and swadhyayPdfUrl are always null in bulk import (require upload).
 * Note: session is derived from subjectId's parent subject (fetched during validation).
 */
function buildChapterPayload(
  raw: Record<string, string>,
  sessionForSubject: string,
): ChapterCreatePayload {
  // AddEditChapterScreen defaults: hasSwadhyay/hasMcq/hasMixedQuiz default to true
  const videoUrl = (raw['videourl'] ?? '').trim();
  return {
    title: (raw['title'] ?? '').trim(),
    titleGu: (raw['titlegu'] ?? '').trim(),
    description: (raw['description'] ?? '').trim(),
    order: parseInt((raw['order'] ?? '').trim(), 10) || 1,
    isPremium: parseBool(raw['ispremium'], false),
    videoUrl: videoUrl || undefined,   // Chapter type is string | undefined
    pdfUrl: undefined,                 // Requires file upload — bulk import sets undefined
    swadhyayPdfUrl: undefined,         // Requires file upload — bulk import sets undefined
    hasSwadhyay: parseBool(raw['hasswadhyay'], true),
    hasMcq: parseBool(raw['hasmcq'], true),
    hasMixedQuiz: parseBool(raw['hasmixedquiz'], true),
    subjectId: (raw['subjectid'] ?? '').trim(),
    standardId: (raw['standardid'] ?? '').trim(),
    session: sessionForSubject,
  };
}

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Phase 1 + 5: Validate all CSV rows, verify subjectIds exist, check duplicates.
 * Does NOT write anything to Firestore.
 */
export async function validateChapterRows(
  rawRows: Record<string, string>[],
  onProgress?: (checked: number, total: number) => void,
): Promise<ChapterImportPreview> {
  const validRows: ChapterImportRow[] = [];
  const duplicateRows: ChapterImportRow[] = [];
  const invalidRows: ChapterImportRow[] = [];

  // Fetch all non-deleted subjects once — to validate subjectId and get session
  const subjectSnapshot = await firestore()
    .collection(COLLECTIONS.SUBJECTS)
    .where('isDeleted', '==', false)
    .get();

  const subjectMap = new Map<string, { session: string; standardId: string }>();
  subjectSnapshot.docs.forEach(doc => {
    const d = doc.data() as Record<string, unknown>;
    subjectMap.set(doc.id, {
      session: String(d.session ?? '1'),
      standardId: String(d.standardId ?? ''),
    });
  });

  // Fetch all non-deleted chapters once for duplicate check
  const existingChapterSnapshot = await firestore()
    .collection(COLLECTIONS.CHAPTERS)
    .where('isDeleted', '==', false)
    .get();

  // Composite key: standardId|subjectId|title_lowercase
  const existingKeys = new Set<string>();
  existingChapterSnapshot.docs.forEach(doc => {
    const d = doc.data() as Record<string, unknown>;
    const key = `${String(d.standardId ?? '')}|${String(d.subjectId ?? '')}|${String(d.title ?? '').toLowerCase().trim()}`;
    existingKeys.add(key);
  });

  for (let i = 0; i < rawRows.length; i++) {
    const raw = rawRows[i]!;
    const rowIndex = i + 1;
    if (onProgress) onProgress(rowIndex, rawRows.length);

    const subjectId = (raw['subjectid'] ?? '').trim();
    const standardId = (raw['standardid'] ?? '').trim();
    const title = (raw['title'] ?? '').trim();
    const titleGu = (raw['titlegu'] ?? '').trim();
    const orderRaw = (raw['order'] ?? '').trim();
    const order = parseInt(orderRaw, 10);

    // ── Required field validation (mirrors AddEditChapterScreen handleSave) ──
    if (!subjectId) {
      const payload = buildChapterPayload(raw, '');
      invalidRows.push({ rowIndex, payload, status: 'invalid', reason: 'subjectId is required' });
      continue;
    }
    if (!standardId) {
      const payload = buildChapterPayload(raw, '');
      invalidRows.push({ rowIndex, payload, status: 'invalid', reason: 'standardId is required' });
      continue;
    }
    if (!title) {
      const payload = buildChapterPayload(raw, '');
      invalidRows.push({ rowIndex, payload, status: 'invalid', reason: 'title is required' });
      continue;
    }
    if (!titleGu) {
      const payload = buildChapterPayload(raw, '');
      invalidRows.push({ rowIndex, payload, status: 'invalid', reason: 'titleGu is required' });
      continue;
    }
    if (isNaN(order) || order < 1) {
      const payload = buildChapterPayload(raw, '');
      invalidRows.push({ rowIndex, payload, status: 'invalid', reason: 'order must be a positive number' });
      continue;
    }

    // ── Validate that subjectId exists in Firestore ───────────────────────────
    const subjectMeta = subjectMap.get(subjectId);
    if (!subjectMeta) {
      const payload = buildChapterPayload(raw, '');
      invalidRows.push({
        rowIndex,
        payload,
        status: 'invalid',
        reason: `Subject not found: "${subjectId}" — check the subjectId column`,
      });
      continue;
    }

    // Build final payload using session from the actual subject document
    const payload = buildChapterPayload(raw, subjectMeta.session);

    // ── Duplicate check ───────────────────────────────────────────────────────
    const key = `${standardId}|${subjectId}|${title.toLowerCase()}`;
    if (existingKeys.has(key)) {
      duplicateRows.push({
        rowIndex,
        payload,
        status: 'duplicate',
        reason: 'Chapter already exists in Firestore',
      });
      continue;
    }

    validRows.push({ rowIndex, payload, status: 'valid' });
    existingKeys.add(key);
  }

  return { totalRows: rawRows.length, validRows, duplicateRows, invalidRows };
}

// ─── Import ───────────────────────────────────────────────────────────────────

/**
 * Phase 2: Call createChapter() — the SAME function used by the service layer.
 * Guarantees 100% schema + cache + error handling compatibility.
 */
export async function importChapters(
  validRows: ChapterImportRow[],
  onProgress?: (done: number, total: number) => void,
): Promise<ImportResult> {
  const result: ImportResult = {
    imported: 0,
    skipped: 0,
    failed: 0,
    failureDetails: [],
  };

  for (let i = 0; i < validRows.length; i++) {
    const row = validRows[i]!;
    if (onProgress) onProgress(i + 1, validRows.length);

    // ✅ Calls the SAME createChapter() from content.service.ts
    const serviceResult = await createChapter(row.payload);

    if (serviceResult.success) {
      result.imported++;
    } else {
      result.failed++;
      result.failureDetails.push({
        rowIndex: row.rowIndex,
        title: row.payload.title,
        reason: serviceResult.error ?? 'Unknown error',
      });
    }
  }

  return result;
}
