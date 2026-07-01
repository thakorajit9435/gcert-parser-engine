import firestore, {
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import {COLLECTIONS} from '../../constants';
import {generateId} from '../../utils';

async function collectionHasData(collectionName: string): Promise<boolean> {
  const snapshot = await firestore().collection(collectionName).limit(1).get();
  return !snapshot.empty;
}

export async function seedDummyData(): Promise<void> {
  if (!__DEV__) {
    return;
  }

  try {
    const hasSubjects = await collectionHasData(COLLECTIONS.SUBJECTS);
    if (hasSubjects) {
      return;
    }

    const batch = firestore().batch();
    const now = firestore.FieldValue.serverTimestamp();

    const subjectRefs = [
      firestore().collection(COLLECTIONS.SUBJECTS).doc(),
      firestore().collection(COLLECTIONS.SUBJECTS).doc(),
      firestore().collection(COLLECTIONS.SUBJECTS).doc(),
    ];

    const subjectData = [
      {
        name: 'Mathematics',
        nameGu: 'ગણિત',
        icon: '📐',
        standardId: '1',
        order: 1,
      },
      {
        name: 'Science',
        nameGu: 'વિજ્ઞાન',
        icon: '🔬',
        standardId: '1',
        order: 2,
      },
      {
        name: 'English',
        nameGu: 'અંગ્રેજી',
        icon: '📖',
        standardId: '1',
        order: 3,
      },
    ];

    subjectData.forEach((data, index) => {
      const ref = subjectRefs[index];
      if (ref) {
        batch.set(ref, {
          ...data,
          isDeleted: false,
          createdAt: now,
          updatedAt: now,
        });
      }
    });

    const mathSubId = subjectRefs[0]?.id || '';
    const scienceSubId = subjectRefs[1]?.id || '';
    const englishSubId = subjectRefs[2]?.id || '';

    const chapterData = [
      {
        title: 'Numbers and Operations',
        titleGu: 'સંખ્યાઓ અને ક્રિયાઓ',
        subjectId: mathSubId,
        standardId: '1',
        order: 1,
      },
      {
        title: 'Geometry Basics',
        titleGu: 'ભૂમિતિ',
        subjectId: mathSubId,
        standardId: '1',
        order: 2,
      },
      {
        title: 'Living Things',
        titleGu: 'જીવંત વસ્તુઓ',
        subjectId: scienceSubId,
        standardId: '1',
        order: 1,
      },
      {
        title: 'Matter and Materials',
        titleGu: 'પદાર્થ અને સામગ્રી',
        subjectId: scienceSubId,
        standardId: '1',
        order: 2,
      },
      {
        title: 'Grammar Fundamentals',
        titleGu: 'વ્યાકરણ',
        subjectId: englishSubId,
        standardId: '1',
        order: 1,
      },
    ];

    const chapterRefs: FirebaseFirestoreTypes.DocumentReference[] = [];
    chapterData.forEach(data => {
      const ref = firestore().collection(COLLECTIONS.CHAPTERS).doc();
      chapterRefs.push(ref);
      batch.set(ref, {
        ...data,
        description: '',
        isPremium: data.order > 1,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
      });
    });

    const quizRef = firestore().collection(COLLECTIONS.QUIZZES).doc();
    const numbersChapterId = chapterRefs[0]?.id || '';
    batch.set(quizRef, {
      chapterId: numbersChapterId,
      subjectId: mathSubId,
      standardId: '1',
      title: 'Numbers Quiz',
      titleGu: 'સંખ્યા ક્વિઝ',
      description: 'Test your number skills',
      difficulty: 'easy',
      timeLimitSeconds: 300,
      passingScore: 60,
      totalQuestions: 5,
      order: 1,
      isDeleted: false,
      isPremium: false,
      createdAt: now,
      updatedAt: now,
    });

    const demoQuestions = [
      {
        text: 'What is 2 + 3?',
        textGu: '2 + 3 = ?',
        answer: '5',
        options: ['3', '4', '5', '6'],
      },
      {
        text: 'What is 10 - 4?',
        textGu: '10 - 4 = ?',
        answer: '6',
        options: ['5', '6', '7', '8'],
      },
      {
        text: 'What is 3 × 4?',
        textGu: '3 × 4 = ?',
        answer: '12',
        options: ['10', '11', '12', '14'],
      },
      {
        text: 'What is 20 ÷ 5?',
        textGu: '20 ÷ 5 = ?',
        answer: '4',
        options: ['3', '4', '5', '6'],
      },
      {
        text: 'What is 7 + 8?',
        textGu: '7 + 8 = ?',
        answer: '15',
        options: ['13', '14', '15', '16'],
      },
    ];

    demoQuestions.forEach((q, index) => {
      const qRef = firestore()
        .collection(COLLECTIONS.QUIZZES)
        .doc(quizRef.id)
        .collection(COLLECTIONS.QUESTIONS)
        .doc();
      const optionItems = q.options.map(text => ({
        id: generateId(),
        text,
        textGu: text,
      }));
      const correctOptionId =
        optionItems.find(o => o.text === q.answer)?.id ??
        optionItems[0]?.id ??
        '';

      batch.set(qRef, {
        quizId: quizRef.id,
        chapterId: numbersChapterId,
        subjectId: mathSubId,
        standardId: '1',
        questionText: q.text,
        questionTextGu: q.textGu,
        options: optionItems,
        correctOptionId,
        points: 10,
        order: index + 1,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
      });
    });

    await batch.commit();
    console.log('[SeedData] Dummy data seeded successfully.');
  } catch (error) {
    console.error('[SeedData] Failed to seed dummy data:', error);
  }
}
