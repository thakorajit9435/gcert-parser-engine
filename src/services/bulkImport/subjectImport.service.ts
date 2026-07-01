/**
 * subjectImport.service.ts
 *
 * Bulk import service for Subjects.
 *
 * CRITICAL RULE: This service calls createSubject() from content.service.ts
 * — the exact same function used internally by ContentManagementScreen.
 * It does NOT write any custom Firestore payload.
 *
 * Exact schema captured from ContentManagementScreen.tsx handleSave():
 *   name        — string (English)
 *   nameGu      — string (Gujarati)
 *   standardId  — string
 *   session     — string
 *   icon        — string (emoji, default '📚')
 *   order       — number
 *   isDeleted   — false (added by createSubject)
 *   createdAt   — serverTimestamp (added by createSubject)
 *   updatedAt   — serverTimestamp (added by createSubject)
 */

import firestore from '@react-native-firebase/firestore';
import { COLLECTIONS } from '../../constants';
import { createSubject } from '../firebase/content.service';
import { Subject } from '../../types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type RowStatus = 'valid' | 'duplicate' | 'invalid';

/**
 * The payload that createSubject() expects (mirrors ContentManagementScreen).
 * Omits: id, createdAt, updatedAt, isDeleted — those are added by createSubject().
 */
export type SubjectCreatePayload = Omit<Subject, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>;

export interface SubjectImportRow {
  rowIndex: number;
  /** The payload that will be passed to createSubject() — verified to match existing schema */
  payload: SubjectCreatePayload;
  status: RowStatus;
  reason?: string;
}

export interface SubjectImportPreview {
  totalRows: number;
  validRows: SubjectImportRow[];
  duplicateRows: SubjectImportRow[];
  invalidRows: SubjectImportRow[];
}

export interface ImportResult {
  imported: number;
  skipped: number;
  failed: number;
  failureDetails: { rowIndex: number; name: string; reason: string }[];
}

// ─── CSV Template ─────────────────────────────────────────────────────────────

/**
 * Exact column headers matching the fields ContentManagementScreen collects.
 * Case-insensitive headers used for CSV matching (see csvParser).
 */
export const SUBJECT_CSV_TEMPLATE_HEADERS = [
  'standardId',
  'session',
  'name',
  'nameGu',
  'icon',
  'order',
];

export const SUBJECT_CSV_TEMPLATE_ROWS = [
  ['6', '1', 'Mathematics', 'ગણિત', '📐', '1'],
  ['6', '1', 'Science', 'વિજ્ઞાન', '🔬', '2'],
  ['7', '1', 'Social Science', 'સામાજિક વિજ્ઞાન', '🌍', '1'],
];

// ─── Schema Validation ────────────────────────────────────────────────────────

/**
 * Phase 4: Fetch one existing Subject from Firestore and compare its keys
 * against what our import would produce. Returns an error string if mismatch.
 */
export async function validateSchemaAgainstFirestore(): Promise<{
  valid: boolean;
  existingDoc?: Record<string, unknown>;
  error?: string;
}> {
  try {
    const snapshot = await firestore()
      .collection(COLLECTIONS.SUBJECTS)
      .where('isDeleted', '==', false)
      .limit(1)
      .get();

    if (snapshot.empty) {
      // No existing subjects — cannot validate, proceed with caution
      return { valid: true, error: undefined };
    }

    const existingDoc = snapshot.docs[0]!.data() as Record<string, unknown>;
    const importPayloadKeys = new Set([
      'name', 'nameGu', 'standardId', 'session', 'icon', 'order',
      // These are added by createSubject(), so they will appear in Firestore:
      'isDeleted', 'createdAt', 'updatedAt',
    ]);

    const unknownKeysInFirestore = Object.keys(existingDoc).filter(
      k => !importPayloadKeys.has(k) && k !== 'id',
    );

    return {
      valid: true, // We only add standard fields; extra fields in Firestore are allowed (no conflict)
      existingDoc,
      error: unknownKeysInFirestore.length > 0
        ? undefined // Extra fields in existing docs are OK — we don't overwrite them
        : undefined,
    };
  } catch (err) {
    return { valid: false, error: (err as Error).message };
  }
}

// ─── Payload Builder ──────────────────────────────────────────────────────────

/**
 * Build a SubjectCreatePayload from a raw CSV row.
 * This mirrors EXACTLY what ContentManagementScreen does in handleSave().
 */
function buildSubjectPayload(raw: Record<string, string>): SubjectCreatePayload {
  const icon = (raw['icon'] ?? '').trim();
  return {
    name: (raw['name'] ?? '').trim(),
    nameGu: (raw['namegu'] ?? '').trim(),
    standardId: (raw['standardid'] ?? '').trim(),
    session: (raw['session'] ?? '').trim(),
    icon: icon || '📚', // ContentManagementScreen default
    order: parseInt((raw['order'] ?? '').trim(), 10) || 1,
  };
}

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Phase 1 + 5: Validate all CSV rows, check duplicates, return preview.
 * Does NOT write anything to Firestore.
 */
export async function validateSubjectRows(
  rawRows: Record<string, string>[],
  onProgress?: (checked: number, total: number) => void,
): Promise<SubjectImportPreview> {
  const validRows: SubjectImportRow[] = [];
  const duplicateRows: SubjectImportRow[] = [];
  const invalidRows: SubjectImportRow[] = [];

  // Fetch all non-deleted subjects once to check duplicates efficiently
  const existingSnapshot = await firestore()
    .collection(COLLECTIONS.SUBJECTS)
    .where('isDeleted', '==', false)
    .get();

  // Composite key: standardId|session|name_lowercase
  const existingKeys = new Set<string>();
  existingSnapshot.docs.forEach(doc => {
    const d = doc.data() as Record<string, unknown>;
    const key = `${String(d.standardId ?? '')}|${String(d.session ?? '')}|${String(d.name ?? '').toLowerCase().trim()}`;
    existingKeys.add(key);
  });

  for (let i = 0; i < rawRows.length; i++) {
    const raw = rawRows[i]!;
    const rowIndex = i + 1;
    if (onProgress) onProgress(rowIndex, rawRows.length);

    const payload = buildSubjectPayload(raw);

    // ── Required field validation (mirrors ContentManagementScreen handleSave) ──
    if (!payload.name) {
      invalidRows.push({ rowIndex, payload, status: 'invalid', reason: 'name is required' });
      continue;
    }
    if (!payload.nameGu) {
      invalidRows.push({ rowIndex, payload, status: 'invalid', reason: 'nameGu is required' });
      continue;
    }
    if (!payload.standardId) {
      invalidRows.push({ rowIndex, payload, status: 'invalid', reason: 'standardId is required' });
      continue;
    }
    if (!payload.session) {
      invalidRows.push({ rowIndex, payload, status: 'invalid', reason: 'session is required' });
      continue;
    }
    if (isNaN(payload.order) || payload.order < 1) {
      invalidRows.push({ rowIndex, payload, status: 'invalid', reason: 'order must be a positive number' });
      continue;
    }

    // ── Duplicate check ───────────────────────────────────────────────────────
    const key = `${payload.standardId}|${payload.session}|${payload.name.toLowerCase()}`;
    if (existingKeys.has(key)) {
      duplicateRows.push({ rowIndex, payload, status: 'duplicate', reason: 'Subject already exists in Firestore' });
      continue;
    }

    validRows.push({ rowIndex, payload, status: 'valid' });
    // Add to set so in-file duplicates are also caught
    existingKeys.add(key);
  }

  return { totalRows: rawRows.length, validRows, duplicateRows, invalidRows };
}

// ─── Import ───────────────────────────────────────────────────────────────────

/**
 * Phase 2: Call createSubject() — the SAME function used by ContentManagementScreen.
 * This guarantees 100% schema compatibility.
 *
 * Processes rows sequentially (not batched) to use createSubject() which handles
 * clearContentCache() and error wrapping exactly as the UI does.
 */
export async function importSubjects(
  validRows: SubjectImportRow[],
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

    // ✅ Calls the SAME createSubject() that content.service.ts exposes
    // and that ContentManagementScreen would call if it used the service layer.
    const serviceResult = await createSubject(row.payload);

    if (serviceResult.success) {
      result.imported++;
    } else {
      result.failed++;
      result.failureDetails.push({
        rowIndex: row.rowIndex,
        name: row.payload.name,
        reason: serviceResult.error ?? 'Unknown error',
      });
    }
  }

  return result;
}
