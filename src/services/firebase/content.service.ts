import firestore from '@react-native-firebase/firestore';
import {FirebaseFirestoreTypes} from '@react-native-firebase/firestore';
import {COLLECTIONS, DEFAULT_PAGE_SIZE} from '../../constants';
import {
  Standard,
  Session,
  Subject,
  Chapter,
  Quiz,
  Question,
  QuestionOption,
  ServiceResult,
  PaginatedResult,
} from '../../types';
import {logCrashError} from '../crashlytics';

// ─── Content Cache ────────────────────────────────────────────

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
const contentCache: Record<string, CacheEntry<any>> = {};
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCachedData<T>(key: string): T | null {
  const entry = contentCache[key];
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
    return entry.data;
  }
  return null;
}

function setCachedData<T>(key: string, data: T): void {
  contentCache[key] = {
    data,
    timestamp: Date.now(),
  };
}

export function clearContentCache(): void {
  for (const key in contentCache) {
    delete contentCache[key];
  }
}

// ─── Generic Helpers ──────────────────────────────────────────

function collectionRef(
  name: string,
): FirebaseFirestoreTypes.CollectionReference {
  return firestore().collection(name);
}

async function getPaginated<T extends {id: string}>(
  collectionName: string,
  orderField: string,
  pageSize: number,
  startAfterDoc?: FirebaseFirestoreTypes.QueryDocumentSnapshot | null,
  whereConditions?: Array<{
    field: string;
    op: FirebaseFirestoreTypes.WhereFilterOp;
    value: unknown;
  }>,
  includeDeleted: boolean = false,
): Promise<ServiceResult<PaginatedResult<T>>> {
  try {
    // Apply where() filters BEFORE orderBy() to match composite index field order
    let query: FirebaseFirestoreTypes.Query = collectionRef(collectionName);

    if (whereConditions) {
      for (const condition of whereConditions) {
        query = query.where(condition.field, condition.op, condition.value);
      }
    }
    if (!includeDeleted) {
      query = query.where('isDeleted', '==', false);
    }

    query = query.orderBy(orderField, 'asc');

    if (startAfterDoc) {
      query = query.startAfter(startAfterDoc);
    }

    query = query.limit(pageSize);
    const snapshot = await query.get();

    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as T[];

    const lastDoc = snapshot.docs[snapshot.docs.length - 1] ?? null;
    const hasMore = snapshot.docs.length === pageSize;

    return {success: true, data: {data, lastDoc, hasMore}};
  } catch (error) {
    logCrashError(error, 'firestore_error', {
      action: 'getPaginated',
      collectionName,
    });
    return {success: false, error: (error as Error).message};
  }
}

// ─── Standards ────────────────────────────────────────────────

export async function getStandards(
  pageSize: number = DEFAULT_PAGE_SIZE,
  startAfterDoc?: FirebaseFirestoreTypes.QueryDocumentSnapshot | null,
): Promise<ServiceResult<PaginatedResult<Standard>>> {
  return getPaginated<Standard>(
    COLLECTIONS.STANDARDS,
    'order',
    pageSize,
    startAfterDoc,
  );
}

export async function getAllStandards(): Promise<ServiceResult<Standard[]>> {
  const cacheKey = 'all_standards';
  const cached = getCachedData<Standard[]>(cacheKey);
  if (cached) {
    return {success: true, data: cached};
  }
  try {
    const snapshot = await collectionRef(COLLECTIONS.STANDARDS)
      .where('isDeleted', '==', false)
      .orderBy('order', 'asc')
      .get();

    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Standard[];
    setCachedData(cacheKey, data);
    return {success: true, data};
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}

export async function createStandard(
  data: Omit<Standard, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>,
): Promise<ServiceResult<string>> {
  try {
    const docRef = await collectionRef(COLLECTIONS.STANDARDS).add({
      ...data,
      isDeleted: false,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
    clearContentCache();
    return {success: true, data: docRef.id};
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}

export async function updateStandard(
  id: string,
  data: Partial<Omit<Standard, 'id' | 'createdAt'>>,
): Promise<ServiceResult<void>> {
  try {
    await collectionRef(COLLECTIONS.STANDARDS)
      .doc(id)
      .update({
        ...data,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    clearContentCache();
    return {success: true};
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}

export async function softDeleteStandard(
  id: string,
): Promise<ServiceResult<void>> {
  return updateStandard(id, {isDeleted: true});
}

export async function restoreStandard(
  id: string,
): Promise<ServiceResult<void>> {
  return updateStandard(id, {isDeleted: false});
}

// ─── Sessions ──────────────────────────────────────────────────

export async function getSessions(
  standardId: string,
  pageSize: number = DEFAULT_PAGE_SIZE,
  startAfterDoc?: FirebaseFirestoreTypes.QueryDocumentSnapshot | null,
): Promise<ServiceResult<PaginatedResult<Session>>> {
  return getPaginated<Session>(
    COLLECTIONS.SESSIONS || 'sessions',
    'order',
    pageSize,
    startAfterDoc,
    [{field: 'standardId', op: '==', value: standardId}],
  );
}

export async function createSession(
  data: Omit<Session, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>,
): Promise<ServiceResult<string>> {
  try {
    const docRef = await collectionRef(COLLECTIONS.SESSIONS || 'sessions').add({
      ...data,
      isDeleted: false,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
    clearContentCache();
    return {success: true, data: docRef.id};
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}

export async function updateSession(
  id: string,
  data: Partial<Omit<Session, 'id' | 'createdAt'>>,
): Promise<ServiceResult<void>> {
  try {
    await collectionRef(COLLECTIONS.SESSIONS || 'sessions')
      .doc(id)
      .update({
        ...data,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    clearContentCache();
    return {success: true};
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}

export async function softDeleteSession(
  id: string,
): Promise<ServiceResult<void>> {
  return updateSession(id, {isDeleted: true});
}

// ─── Subjects ─────────────────────────────────────────────────

export async function getSubjects(
  standardId: string,
  pageSize: number = DEFAULT_PAGE_SIZE,
  startAfterDoc?: FirebaseFirestoreTypes.QueryDocumentSnapshot | null,
  sessionId?: string,
): Promise<ServiceResult<PaginatedResult<Subject>>> {
  const isFirstPage = !startAfterDoc;
  const cacheKey = `subjects_${standardId}_${sessionId || 'none'}`;
  if (isFirstPage) {
    const cached = getCachedData<PaginatedResult<Subject>>(cacheKey);
    if (cached) {
      return {success: true, data: cached};
    }
  }

  const conditions: Array<{
    field: string;
    op: FirebaseFirestoreTypes.WhereFilterOp;
    value: unknown;
  }> = [{field: 'standardId', op: '==', value: standardId}];
  if (sessionId) {
    conditions.push({field: 'session', op: '==', value: sessionId});
  }

  const result = await getPaginated<Subject>(
    COLLECTIONS.SUBJECTS,
    'order',
    pageSize,
    startAfterDoc,
    conditions,
  );

  if (isFirstPage && result.success && result.data) {
    setCachedData(cacheKey, result.data);
  }
  return result;
}

export async function createSubject(
  data: Omit<Subject, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>,
): Promise<ServiceResult<string>> {
  try {
    const docRef = await collectionRef(COLLECTIONS.SUBJECTS).add({
      ...data,
      isDeleted: false,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
    clearContentCache();
    return {success: true, data: docRef.id};
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}

export async function updateSubject(
  id: string,
  data: Partial<Omit<Subject, 'id' | 'createdAt'>>,
): Promise<ServiceResult<void>> {
  try {
    await collectionRef(COLLECTIONS.SUBJECTS)
      .doc(id)
      .update({
        ...data,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    clearContentCache();
    return {success: true};
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}

export async function softDeleteSubject(
  id: string,
): Promise<ServiceResult<void>> {
  return updateSubject(id, {isDeleted: true});
}

// ─── Chapters ─────────────────────────────────────────────────

export async function getChapters(
  subjectId: string,
  pageSize: number = DEFAULT_PAGE_SIZE,
  startAfterDoc?: FirebaseFirestoreTypes.QueryDocumentSnapshot | null,
): Promise<ServiceResult<PaginatedResult<Chapter>>> {
  const isFirstPage = !startAfterDoc;
  const cacheKey = `chapters_${subjectId}`;
  if (isFirstPage) {
    const cached = getCachedData<PaginatedResult<Chapter>>(cacheKey);
    if (cached) {
      return {success: true, data: cached};
    }
  }

  const result = await getPaginated<Chapter>(
    COLLECTIONS.CHAPTERS,
    'order',
    pageSize,
    startAfterDoc,
    [{field: 'subjectId', op: '==', value: subjectId}],
  );

  if (isFirstPage && result.success && result.data) {
    setCachedData(cacheKey, result.data);
  }
  return result;
}

export async function createChapter(
  data: Omit<Chapter, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>,
): Promise<ServiceResult<string>> {
  try {
    const docRef = await collectionRef(COLLECTIONS.CHAPTERS).add({
      ...data,
      isDeleted: false,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
    clearContentCache();
    return {success: true, data: docRef.id};
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}

export async function updateChapter(
  id: string,
  data: Partial<Omit<Chapter, 'id' | 'createdAt'>>,
): Promise<ServiceResult<void>> {
  try {
    await collectionRef(COLLECTIONS.CHAPTERS)
      .doc(id)
      .update({
        ...data,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    clearContentCache();
    return {success: true};
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}

export async function softDeleteChapter(
  id: string,
): Promise<ServiceResult<void>> {
  return updateChapter(id, {isDeleted: true});
}

// ─── Quizzes ──────────────────────────────────────────────────

export async function getQuizzes(
  chapterId: string,
  pageSize: number = DEFAULT_PAGE_SIZE,
  startAfterDoc?: FirebaseFirestoreTypes.QueryDocumentSnapshot | null,
): Promise<ServiceResult<PaginatedResult<Quiz>>> {
  return getPaginated<Quiz>(
    COLLECTIONS.QUIZZES,
    'order',
    pageSize,
    startAfterDoc,
    [{field: 'chapterId', op: '==', value: chapterId}],
  );
}

export async function createQuiz(
  data: Omit<Quiz, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>,
): Promise<ServiceResult<string>> {
  try {
    const docRef = await collectionRef(COLLECTIONS.QUIZZES).add({
      ...data,
      isDeleted: false,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
    return {success: true, data: docRef.id};
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}

export async function updateQuiz(
  id: string,
  data: Partial<Omit<Quiz, 'id' | 'createdAt'>>,
): Promise<ServiceResult<void>> {
  try {
    await collectionRef(COLLECTIONS.QUIZZES)
      .doc(id)
      .update({
        ...data,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    return {success: true};
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}

export async function softDeleteQuiz(id: string): Promise<ServiceResult<void>> {
  return updateQuiz(id, {isDeleted: true});
}

// ─── Questions ────────────────────────────────────────────────

export async function getQuestions(
  quizId: string,
  pageSize: number = DEFAULT_PAGE_SIZE,
  startAfterDoc?: FirebaseFirestoreTypes.QueryDocumentSnapshot | null,
): Promise<ServiceResult<PaginatedResult<Question>>> {
  return getPaginated<Question>(
    COLLECTIONS.QUESTIONS,
    'order',
    pageSize,
    startAfterDoc,
    [{field: 'quizId', op: '==', value: quizId}],
  );
}

export async function createQuestion(
  data: Omit<Question, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>,
): Promise<ServiceResult<string>> {
  try {
    const docRef = await collectionRef(COLLECTIONS.QUESTIONS).add({
      ...data,
      isDeleted: false,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
    return {success: true, data: docRef.id};
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}

export async function updateQuestion(
  id: string,
  data: Partial<Omit<Question, 'id' | 'createdAt'>>,
): Promise<ServiceResult<void>> {
  try {
    await collectionRef(COLLECTIONS.QUESTIONS)
      .doc(id)
      .update({
        ...data,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    return {success: true};
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}

export async function softDeleteQuestion(
  id: string,
): Promise<ServiceResult<void>> {
  return updateQuestion(id, {isDeleted: true});
}

// ─── Counts ───────────────────────────────────────────────────

export async function getCollectionCount(
  collectionName: string,
): Promise<number> {
  try {
    const snapshot = await collectionRef(collectionName)
      .where('isDeleted', '==', false)
      .count()
      .get();
    return snapshot.data().count;
  } catch {
    return 0;
  }
}

export async function getTotalStandards(): Promise<number> {
  return getCollectionCount(COLLECTIONS.STANDARDS);
}

export async function getTotalSubjects(): Promise<number> {
  return getCollectionCount(COLLECTIONS.SUBJECTS);
}

export async function getTotalChapters(): Promise<number> {
  return getCollectionCount(COLLECTIONS.CHAPTERS);
}

export async function getTotalQuizzes(): Promise<number> {
  return getCollectionCount(COLLECTIONS.QUIZZES);
}

export async function getTotalQuizAttempts(): Promise<number> {
  try {
    const snapshot = await collectionRef(COLLECTIONS.QUIZ_ATTEMPTS)
      .count()
      .get();
    return snapshot.data().count;
  } catch {
    return 0;
  }
}

// ─── Reorder ──────────────────────────────────────────────────

export async function reorderItems(
  collectionName: string,
  orderedIds: string[],
): Promise<ServiceResult<void>> {
  try {
    const batch = firestore().batch();
    orderedIds.forEach((id, index) => {
      const ref = collectionRef(collectionName).doc(id);
      batch.update(ref, {
        order: index + 1,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();
    clearContentCache();
    return {success: true};
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}

// ─── Unused type suppression ──────────────────────────────────

export type {QuestionOption};
