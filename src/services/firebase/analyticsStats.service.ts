import firestore from '@react-native-firebase/firestore';
import {COLLECTIONS} from '../../constants';
import {logCrashError} from '../crashlytics';

export interface EngagementStats {
  activeUsers: number;
  pdfReads: number;
  chapterOpens: number;
  quizAttempts: number;
  popularSubjects: Array<{
    subjectId: string;
    subjectName: string;
    count: number;
  }>;
  popularQuizzes: Array<{quizId: string; title: string; count: number}>;
  dailyActiveTrend: Array<{date: string; count: number}>;
}

/**
 * Fetch engagement and analytics statistics for the admin dashboard.
 */
export async function getAnalyticsStats(
  startDate: Date,
  endDate: Date,
): Promise<EngagementStats> {
  try {
    const startTimestamp = firestore.Timestamp.fromDate(startDate);
    const endTimestamp = firestore.Timestamp.fromDate(endDate);

    // 1. Fetch active users count in the period
    const usersSnapshot = await firestore()
      .collection(COLLECTIONS.USERS)
      .where('lastActiveAt', '>=', startTimestamp)
      .where('lastActiveAt', '<=', endTimestamp)
      .get();

    const activeUsersCount = usersSnapshot.size;

    // 2. Fetch PDF reads in the period
    const pdfSnapshot = await firestore()
      .collection(COLLECTIONS.PDF_READING_PROGRESS)
      .where('lastReadAt', '>=', startTimestamp)
      .where('lastReadAt', '<=', endTimestamp)
      .get();

    const pdfReadsCount = pdfSnapshot.size;

    // 3. Fetch Chapter opens in the period
    const progressSnapshot = await firestore()
      .collection(COLLECTIONS.USER_PROGRESS)
      .where('lastOpenedAt', '>=', startTimestamp)
      .where('lastOpenedAt', '<=', endTimestamp)
      .get();

    const chapterOpensCount = progressSnapshot.size;

    // 4. Fetch Quiz Attempts in the period
    const quizSnapshot = await firestore()
      .collection(COLLECTIONS.QUIZ_ATTEMPTS)
      .where('createdAt', '>=', startTimestamp)
      .where('createdAt', '<=', endTimestamp)
      .get();

    const quizAttemptsCount = quizSnapshot.size;

    // 5. Calculate popular quizzes (in-memory aggregation of quiz attempts)
    const quizCounts: Record<string, {count: number; title: string}> = {};
    quizSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const quizId = data.quizId;
      const title = data.quizTitle || 'Quiz ' + quizId;
      if (quizId) {
        if (!quizCounts[quizId]) {
          quizCounts[quizId] = {count: 0, title};
        }
        quizCounts[quizId].count++;
      }
    });

    const popularQuizzes = Object.entries(quizCounts)
      .map(([quizId, info]) => ({
        quizId,
        title: info.title,
        count: info.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 6. Calculate popular subjects based on chapter opens and pdf reads
    const subjectCounts: Record<string, {count: number; name: string}> = {};

    progressSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const subjectId = data.subjectId;
      const subjectName = data.subjectName || 'Subject ' + subjectId;
      if (subjectId) {
        if (!subjectCounts[subjectId]) {
          subjectCounts[subjectId] = {count: 0, name: subjectName};
        }
        subjectCounts[subjectId].count++;
      }
    });

    const popularSubjects = Object.entries(subjectCounts)
      .map(([subjectId, info]) => ({
        subjectId,
        subjectName: info.name,
        count: info.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 7. Calculate Daily Active Users trend
    const dailyTrend: Record<string, number> = {};
    // Initialize all days in the range with 0
    const temp = new Date(startDate);
    while (temp <= endDate) {
      const dateStr = temp.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
      dailyTrend[dateStr] = 0;
      temp.setDate(temp.getDate() + 1);
    }

    usersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const lastActive = data.lastActiveAt?.toDate();
      if (lastActive) {
        const dateStr = lastActive.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        });
        if (dailyTrend[dateStr] !== undefined) {
          dailyTrend[dateStr]++;
        }
      }
    });

    const dailyActiveTrend = Object.entries(dailyTrend).map(
      ([date, count]) => ({
        date,
        count,
      }),
    );

    return {
      activeUsers: activeUsersCount,
      pdfReads: pdfReadsCount,
      chapterOpens: chapterOpensCount,
      quizAttempts: quizAttemptsCount,
      popularSubjects,
      popularQuizzes,
      dailyActiveTrend,
    };
  } catch (err) {
    logCrashError(err, 'firestore_error', {
      action: 'getAnalyticsStats',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
    return {
      activeUsers: 0,
      pdfReads: 0,
      chapterOpens: 0,
      quizAttempts: 0,
      popularSubjects: [],
      popularQuizzes: [],
      dailyActiveTrend: [],
    };
  }
}
