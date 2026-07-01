/**
 * batchImport.service.ts
 *
 * High-performance batch write service using Firestore writeBatch().
 * Splits large imports into chunks of MAX_BATCH_SIZE (490) to stay within
 * Firestore's 500-operation-per-batch limit.
 *
 * Only writes to `subjects` and `chapters` collections.
 * Does NOT touch any other collection or existing data.
 */

import firestore from '@react-native-firebase/firestore';
import { COLLECTIONS } from '../../constants';
import { clearContentCache } from '../firebase/content.service';
import { SubjectDefinition, ChapterDefinition } from './gujaratContent.data';

/** Firestore hard limit is 500 ops per batch — use 490 for safety */
const MAX_BATCH_SIZE = 490;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BatchResult {
  total: number;
  written: number;
  skipped: number;
  failed: number;
  failureDetails: Array<{ index: number; error: string }>;
}

export interface SubjectImportResult extends BatchResult {
  /** Map from lookup key → Firestore document ID (for chapter resolution) */
  subjectIdMap: Map<string, string>;
}

/** Build lookup key for a subject — must match how chapterImport.service.ts resolves */
export function subjectKey(standardId: string, session: string, name: string): string {
  return `${standardId}|${session}|${name.trim().toLowerCase()}`;
}

// ─── Subject Batch Import ──────────────────────────────────────────────────────

/**
 * Import all subjects via writeBatch().
 * Auto-skips subjects that already exist (same standardId + session + name).
 * Returns the full subjectIdMap (existing + newly created) for chapter resolution.
 */
export async function batchImportSubjects(
  subjects: SubjectDefinition[],
  onProgress?: (done: number, total: number) => void,
): Promise<SubjectImportResult> {
  // Fetch existing subjects once for duplicate detection + ID mapping
  const existingSnap = await firestore()
    .collection(COLLECTIONS.SUBJECTS)
    .where('isDeleted', '==', false)
    .get();

  const existingKeys = new Set<string>();
  const existingIdMap = new Map<string, string>(); // key → docId
  existingSnap.docs.forEach(doc => {
    const d = doc.data() as Record<string, unknown>;
    const key = subjectKey(
      String(d.standardId ?? ''),
      String(d.session ?? ''),
      String(d.name ?? ''),
    );
    existingKeys.add(key);
    existingIdMap.set(key, doc.id);
  });

  const result: SubjectImportResult = {
    total: subjects.length,
    written: 0,
    skipped: 0,
    failed: 0,
    failureDetails: [],
    subjectIdMap: new Map(existingIdMap), // pre-populate with existing IDs
  };

  const now = firestore.FieldValue.serverTimestamp();
  const subjectsRef = firestore().collection(COLLECTIONS.SUBJECTS);

  // Pre-allocate document references for subjects to be written
  const toWrite: Array<{ def: SubjectDefinition; key: string; ref: ReturnType<typeof subjectsRef.doc> }> = [];

  for (const def of subjects) {
    const key = subjectKey(def.standardId, def.session, def.name);
    if (existingKeys.has(key)) {
      result.skipped++;
    } else {
      const ref = subjectsRef.doc(); // pre-allocate Firestore ID
      toWrite.push({ def, key, ref });
    }
  }

  if (onProgress) onProgress(0, Math.max(toWrite.length, 1));

  // Split into MAX_BATCH_SIZE chunks and commit each
  for (let start = 0; start < toWrite.length; start += MAX_BATCH_SIZE) {
    const chunk = toWrite.slice(start, start + MAX_BATCH_SIZE);
    const batch = firestore().batch();

    for (const { def, ref } of chunk) {
      batch.set(ref, {
        standardId: def.standardId,
        session: def.session,
        name: def.name,
        nameGu: def.nameGu,
        icon: def.icon,
        order: def.order,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
      });
    }

    try {
      await batch.commit();
      // Register new IDs after successful commit
      for (const { key, ref } of chunk) {
        result.subjectIdMap.set(key, ref.id);
        result.written++;
      }
    } catch (err) {
      for (let i = 0; i < chunk.length; i++) {
        result.failed++;
        result.failureDetails.push({
          index: start + i,
          error: (err as Error).message,
        });
      }
    }

    if (onProgress) {
      onProgress(Math.min(start + MAX_BATCH_SIZE, toWrite.length), toWrite.length);
    }
  }

  clearContentCache();
  return result;
}

// ─── Chapter Batch Import ─────────────────────────────────────────────────────

/**
 * Import all chapters via writeBatch().
 * Resolves subjectId from the provided subjectIdMap (built after subject import).
 * Auto-skips chapters that already exist (same standardId + subjectId + title).
 */
export async function batchImportChapters(
  chapters: ChapterDefinition[],
  subjectIdMap: Map<string, string>,
  onProgress?: (done: number, total: number) => void,
): Promise<BatchResult> {
  // Fetch existing chapters for duplicate detection
  const existingSnap = await firestore()
    .collection(COLLECTIONS.CHAPTERS)
    .where('isDeleted', '==', false)
    .get();

  const existingKeys = new Set<string>();
  existingSnap.docs.forEach(doc => {
    const d = doc.data() as Record<string, unknown>;
    const key = `${String(d.standardId ?? '')}|${String(d.subjectId ?? '')}|${String(d.title ?? '').toLowerCase().trim()}`;
    existingKeys.add(key);
  });

  const result: BatchResult = {
    total: chapters.length,
    written: 0,
    skipped: 0,
    failed: 0,
    failureDetails: [],
  };

  const now = firestore.FieldValue.serverTimestamp();
  const chaptersRef = firestore().collection(COLLECTIONS.CHAPTERS);

  // Resolve all chapters — skip unresolved subjects or duplicates
  const toWrite: Array<{ chapter: ChapterDefinition; subjectId: string }> = [];

  for (const chapter of chapters) {
    const key = subjectKey(chapter.standardId, chapter.session, chapter.subjectName);
    const subjectId = subjectIdMap.get(key);

    if (!subjectId) {
      result.skipped++;
      result.failureDetails.push({
        index: result.skipped,
        error: `Subject not found: "${chapter.subjectName}" (Std ${chapter.standardId} Sem ${chapter.session})`,
      });
      continue;
    }

    const dupKey = `${chapter.standardId}|${subjectId}|${chapter.title.toLowerCase().trim()}`;
    if (existingKeys.has(dupKey)) {
      result.skipped++;
      continue;
    }

    toWrite.push({ chapter, subjectId });
  }

  if (onProgress) onProgress(0, Math.max(toWrite.length, 1));

  for (let start = 0; start < toWrite.length; start += MAX_BATCH_SIZE) {
    const chunk = toWrite.slice(start, start + MAX_BATCH_SIZE);
    const batch = firestore().batch();

    for (const { chapter, subjectId } of chunk) {
      const ref = chaptersRef.doc();
      batch.set(ref, {
        standardId: chapter.standardId,
        session: chapter.session,
        subjectId,
        title: chapter.title,
        titleGu: chapter.titleGu,
        description: chapter.description,
        order: chapter.order,
        isPremium: chapter.isPremium,
        hasSwadhyay: chapter.hasSwadhyay,
        hasMcq: chapter.hasMcq,
        hasMixedQuiz: chapter.hasMixedQuiz,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
      });
    }

    try {
      await batch.commit();
      result.written += chunk.length;
    } catch (err) {
      result.failed += chunk.length;
      for (let i = 0; i < chunk.length; i++) {
        result.failureDetails.push({
          index: start + i,
          error: (err as Error).message,
        });
      }
    }

    if (onProgress) {
      onProgress(Math.min(start + MAX_BATCH_SIZE, toWrite.length), toWrite.length);
    }
  }

  clearContentCache();
  return result;
}

// ─── Count Helpers ────────────────────────────────────────────────────────────

export async function getSubjectCount(): Promise<number> {
  const snap = await firestore()
    .collection(COLLECTIONS.SUBJECTS)
    .where('isDeleted', '==', false)
    .get();
  return snap.size;
}

export async function getChapterCount(): Promise<number> {
  const snap = await firestore()
    .collection(COLLECTIONS.CHAPTERS)
    .where('isDeleted', '==', false)
    .get();
  return snap.size;
}
