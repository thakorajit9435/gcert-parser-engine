import firestore from '@react-native-firebase/firestore';
import {Quiz, Question, QuizAttempt, ServiceResult} from '../../types';
import {COLLECTIONS} from '../../constants';
import {generateId} from '../../utils';

// ─── Admin Queries ────────────────────────────────────────────

export async function getAdminQuizzes(
  standardId?: string,
): Promise<ServiceResult<Quiz[]>> {
  try {
    let query: any = firestore()
      .collection(COLLECTIONS.QUIZZES)
      .where('isDeleted', '==', false)
      .orderBy('order', 'asc');

    if (standardId) {
      query = firestore()
        .collection(COLLECTIONS.QUIZZES)
        .where('standardId', '==', standardId)
        .where('isDeleted', '==', false)
        .orderBy('order', 'asc');
    }

    const snapshot = await query.get();
    const data = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    })) as Quiz[];
    return {success: true, data};
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}

// ─── Batch Daily Quiz Enforcement ─────────────────────────────

/**
 * Ensures only one quiz per standard is marked as Daily Quiz.
 * Unsets ALL existing daily quizzes for the standard, then marks quizId.
 */
export async function setDailyQuiz(
  quizId: string,
  standardId: string,
): Promise<ServiceResult<void>> {
  try {
    const snapshot = await firestore()
      .collection(COLLECTIONS.QUIZZES)
      .where('standardId', '==', standardId)
      .where('isDailyQuiz', '==', true)
      .where('isDeleted', '==', false)
      .get();

    const batch = firestore().batch();

    snapshot.docs.forEach(doc => {
      if (doc.id !== quizId) {
        batch.update(doc.ref, {
          isDailyQuiz: false,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
      }
    });

    batch.update(firestore().collection(COLLECTIONS.QUIZZES).doc(quizId), {
      isDailyQuiz: true,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

    await batch.commit();
    return {success: true};
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}

export async function unsetDailyQuiz(
  quizId: string,
): Promise<ServiceResult<void>> {
  try {
    await firestore()
      .collection(COLLECTIONS.QUIZZES)
      .doc(quizId)
      .update({
        isDailyQuiz: false,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    return {success: true};
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}

// ─── Quiz CRUD ────────────────────────────────────────────────

export async function getAllQuizzes(): Promise<ServiceResult<Quiz[]>> {
  try {
    const snapshot = await firestore()
      .collection(COLLECTIONS.QUIZZES)
      .where('isDeleted', '==', false)
      .orderBy('order', 'asc')
      .get();
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Quiz[];
    return {success: true, data};
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}

export async function getQuizzesByChapter(
  chapterId: string,
): Promise<ServiceResult<Quiz[]>> {
  try {
    const snapshot = await firestore()
      .collection(COLLECTIONS.QUIZZES)
      .where('chapterId', '==', chapterId)
      .where('isDeleted', '==', false)
      .orderBy('order', 'asc')
      .get();
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Quiz[];
    return {success: true, data};
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}

export async function getDailyQuiz(): Promise<ServiceResult<Quiz | null>> {
  try {
    const snapshot = await firestore()
      .collection(COLLECTIONS.QUIZZES)
      .where('isDailyQuiz', '==', true)
      .where('isActive', '==', true)
      .where('isDeleted', '==', false)
      .limit(1)
      .get();
    if (snapshot.empty || !snapshot.docs[0]) {
      return {success: true, data: null};
    }
    const doc = snapshot.docs[0];
    return {success: true, data: {id: doc.id, ...doc.data()} as Quiz};
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}

export async function getQuizById(
  quizId: string,
): Promise<ServiceResult<Quiz>> {
  try {
    const doc = await firestore()
      .collection(COLLECTIONS.QUIZZES)
      .doc(quizId)
      .get();
    if (!doc.exists) {
      return {success: false, error: 'Quiz not found.'};
    }
    return {success: true, data: {id: doc.id, ...doc.data()} as Quiz};
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}

export async function createQuiz(
  data: Omit<Quiz, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<ServiceResult<string>> {
  try {
    const ref = await firestore()
      .collection(COLLECTIONS.QUIZZES)
      .add({
        ...data,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    return {success: true, data: ref.id};
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}

export async function updateQuiz(
  quizId: string,
  data: Partial<Omit<Quiz, 'id' | 'createdAt'>>,
): Promise<ServiceResult<void>> {
  try {
    await firestore()
      .collection(COLLECTIONS.QUIZZES)
      .doc(quizId)
      .update({...data, updatedAt: firestore.FieldValue.serverTimestamp()});
    return {success: true};
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}

export async function softDeleteQuiz(
  quizId: string,
): Promise<ServiceResult<void>> {
  return updateQuiz(quizId, {isDeleted: true, isActive: false});
}

// ─── Questions ────────────────────────────────────────────────

export async function getQuizQuestions(
  quizId: string,
): Promise<ServiceResult<Question[]>> {
  try {
    const snapshot = await firestore()
      .collection(COLLECTIONS.QUIZZES)
      .doc(quizId)
      .collection(COLLECTIONS.QUESTIONS)
      .orderBy('order', 'asc')
      .get();
    const data = snapshot.docs
      .map(doc => ({id: doc.id, ...doc.data()} as Question))
      .filter(q => !q.isDeleted);
    return {success: true, data};
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}

export async function addQuestion(
  quizId: string,
  quizData: Pick<Quiz, 'chapterId' | 'subjectId' | 'standardId'>,
  questionText: string,
  options: Array<{text: string; textGu: string}>,
  correctIndex: number,
  order: number,
): Promise<ServiceResult<void>> {
  const optionIds = options.map(() => generateId());
  const formattedOptions = options.map((opt, i) => ({
    id: optionIds[i],
    text: opt.text,
    textGu: opt.textGu,
  }));

  try {
    const batch = firestore().batch();

    const questionRef = firestore()
      .collection(COLLECTIONS.QUIZZES)
      .doc(quizId)
      .collection(COLLECTIONS.QUESTIONS)
      .doc();

    batch.set(questionRef, {
      quizId,
      chapterId: quizData.chapterId,
      subjectId: quizData.subjectId,
      standardId: quizData.standardId,
      questionText,
      questionTextGu: '',
      options: formattedOptions,
      correctOptionId: optionIds[correctIndex] ?? optionIds[0],
      points: 10,
      order,
      isDeleted: false,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

    const quizRef = firestore().collection(COLLECTIONS.QUIZZES).doc(quizId);
    batch.update(quizRef, {
      totalQuestions: firestore.FieldValue.increment(1),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

    await batch.commit();
    return {success: true};
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}

// ─── Quiz Attempts ────────────────────────────────────────────

export async function saveQuizAttempt(
  attempt: Omit<QuizAttempt, 'id' | 'createdAt'>,
  pointsEarned: number,
): Promise<ServiceResult<void>> {
  try {
    const batch = firestore().batch();

    const attemptRef = firestore().collection(COLLECTIONS.QUIZ_ATTEMPTS).doc();
    batch.set(attemptRef, {
      ...attempt,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });

    if (pointsEarned > 0) {
      const userRef = firestore()
        .collection(COLLECTIONS.USERS)
        .doc(attempt.userId);
      batch.update(userRef, {
        points: firestore.FieldValue.increment(pointsEarned),
        lastActiveAt: firestore.FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();
    return {success: true};
  } catch (error) {
    return {success: false, error: (error as Error).message};
  }
}

// ─── Dev Auto-Seed (DEV only) ─────────────────────────────────

export async function seedDemoQuizIfNeeded(): Promise<void> {
  if (!__DEV__) {
    return;
  }

  try {
    const snapshot = await firestore()
      .collection(COLLECTIONS.QUIZZES)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      return;
    }

    const quizRef = await firestore().collection(COLLECTIONS.QUIZZES).add({
      chapterId: 'demo_chapter',
      subjectId: 'demo_subject',
      standardId: '5',
      title: 'Demo Quiz — General Knowledge',
      titleGu: 'ડેમો ક્વિઝ — સામાન્ય જ્ઞાન',
      description: 'A sample quiz for testing the app.',
      difficulty: 'easy',
      timeLimitSeconds: 300,
      passingScore: 60,
      totalMarks: 10,
      totalQuestions: 0,
      isDailyQuiz: true,
      isActive: true,
      order: 1,
      isDeleted: false,
      isPremium: false,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

    const optA = generateId();
    const optB = generateId();
    const optC = generateId();
    const optD = generateId();

    await firestore()
      .collection(COLLECTIONS.QUIZZES)
      .doc(quizRef.id)
      .collection(COLLECTIONS.QUESTIONS)
      .add({
        quizId: quizRef.id,
        chapterId: 'demo_chapter',
        subjectId: 'demo_subject',
        standardId: '5',
        questionText: 'What is the capital of India?',
        questionTextGu: 'ભારતની રાજધાની કઈ છે?',
        options: [
          {id: optA, text: 'Mumbai', textGu: 'મુંબઈ'},
          {id: optB, text: 'New Delhi', textGu: 'નવી દિલ્હી'},
          {id: optC, text: 'Kolkata', textGu: 'કોલકાતા'},
          {id: optD, text: 'Chennai', textGu: 'ચેન્નાઈ'},
        ],
        correctOptionId: optB,
        points: 10,
        order: 1,
        isDeleted: false,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

    await firestore()
      .collection(COLLECTIONS.QUIZZES)
      .doc(quizRef.id)
      .update({totalQuestions: 1});
  } catch {
    // Seed failure is non-fatal in development
  }
}
