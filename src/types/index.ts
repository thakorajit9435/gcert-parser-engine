import {FirebaseFirestoreTypes} from '@react-native-firebase/firestore';

// ─── Role System ───────────────────────────────────────────────

export type UserRole = 'student' | 'content_admin' | 'super_admin';

export const ADMIN_ROLES: UserRole[] = ['content_admin', 'super_admin'];

// ─── User ──────────────────────────────────────────────────────

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  /** null for content_admin and super_admin */
  standard: number | null;
  standardId?: string;
  points: number;
  /** Used in Firestore doc */
  premium: boolean;
  /** Alias matching the spec — same value as premium */
  isPremium?: boolean;
  premiumPlan?: SubscriptionPlanType;
  premiumActivatedAt?: FirebaseFirestoreTypes.Timestamp;
  role: UserRole;
  isBlocked: boolean;
  streak: number;
  totalAttempts?: number;
  createdAt: FirebaseFirestoreTypes.Timestamp;
  lastActiveAt: FirebaseFirestoreTypes.Timestamp;
  /** Firebase Cloud Messaging device token — saved on login, cleared on logout */
  fcmToken?: string | null;
}

export interface UserCreatePayload {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  standard: number | null;
  role?: UserRole;
}

export interface UserUpdatePayload {
  name?: string;
  email?: string;
  phone?: string;
  standard?: number;
  points?: number;
  premium?: boolean;
  role?: UserRole;
  isBlocked?: boolean;
  streak?: number;
  totalAttempts?: number;
  lastActiveAt?: FirebaseFirestoreTypes.Timestamp;
}

// ─── User Progress ─────────────────────────────────────────────

export interface UserProgress {
  id: string;
  userId: string;
  chapterId: string;
  subjectId: string;
  standardId: string;
  isCompleted: boolean;
  isBookmarked?: boolean;
  lastOpenedAt: FirebaseFirestoreTypes.Timestamp | null;
  createdAt: FirebaseFirestoreTypes.Timestamp;
  updatedAt: FirebaseFirestoreTypes.Timestamp;
}

// ─── Content: Standards ────────────────────────────────────────

export interface Standard {
  id: string;
  number: number;
  label: string;
  labelGu: string;
  order: number;
  isDeleted: boolean;
  createdAt: FirebaseFirestoreTypes.Timestamp;
  updatedAt: FirebaseFirestoreTypes.Timestamp;
}

// ─── Content: Sessions ─────────────────────────────────────────

export type SessionType = 'textbook' | 'mcq' | 'swadhyay' | 'vadhu';

export interface Session {
  id: string;
  standardId: string;
  session: '1' | '2' | string;
  type: SessionType | string;
  title: string;
  titleGu?: string;
  order: number;
  isDeleted?: boolean;
  createdAt?: FirebaseFirestoreTypes.Timestamp;
  updatedAt?: FirebaseFirestoreTypes.Timestamp;
}

// ─── Content: Subjects ─────────────────────────────────────────

export interface Subject {
  id: string;
  standardId: string;
  session: string;
  name: string;
  nameGu: string;
  icon?: string;
  imageUrl?: string;
  order: number;
  isDeleted: boolean;
  createdAt: FirebaseFirestoreTypes.Timestamp;
  updatedAt: FirebaseFirestoreTypes.Timestamp;
}

// ─── Content: Chapters ─────────────────────────────────────────

export interface Chapter {
  id: string;
  subjectId: string;
  standardId: string;
  session: string;
  title: string;
  titleGu: string;
  description?: string;
  descriptionGu?: string;
  imageUrl?: string;
  pdfUrl?: string;
  swadhyayPdfUrl?: string;
  videoUrl?: string;
  hasSwadhyay?: boolean;
  hasMcq?: boolean;
  hasMixedQuiz?: boolean;
  order: number;
  isDeleted: boolean;
  isPremium: boolean;
  createdAt: FirebaseFirestoreTypes.Timestamp;
  updatedAt: FirebaseFirestoreTypes.Timestamp;
}

// ─── Content: Quizzes ──────────────────────────────────────────

export type QuizDifficulty = 'easy' | 'medium' | 'hard';

export interface Quiz {
  id: string;
  chapterId: string;
  subjectId: string;
  standardId: string;
  session?: string;
  title: string;
  titleGu: string;
  description?: string;
  difficulty: QuizDifficulty;
  timeLimitSeconds: number;
  passingScore: number;
  totalMarks: number;
  totalQuestions: number;
  isDailyQuiz: boolean;
  isActive: boolean;
  isMixed: boolean;
  order: number;
  isDeleted: boolean;
  isPremium: boolean;
  createdAt: FirebaseFirestoreTypes.Timestamp;
  updatedAt: FirebaseFirestoreTypes.Timestamp;
}

// ─── Content: Questions ────────────────────────────────────────

export interface QuestionOption {
  id: string;
  text: string;
  textGu: string;
  imageUrl?: string;
}

export interface Question {
  id: string;
  quizId: string;
  chapterId: string;
  subjectId: string;
  standardId: string;
  questionText: string;
  questionTextGu: string;
  questionImageUrl?: string;
  options: QuestionOption[];
  correctOptionId: string;
  explanation?: string;
  explanationGu?: string;
  points: number;
  order: number;
  isDeleted: boolean;
  createdAt: FirebaseFirestoreTypes.Timestamp;
  updatedAt: FirebaseFirestoreTypes.Timestamp;
}

// ─── Quiz Attempts ─────────────────────────────────────────────

export interface QuizAttempt {
  id: string;
  userId: string;
  quizId: string; // Will be empty or 'practice' for practice mode
  chapterId?: string; // Optional for mix practice
  subjectId: string;
  standardId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeTakenSeconds: number;
  answers: Record<string, string>;
  passed: boolean; // Calculated normally, or true for practice
  type?: 'quiz' | 'mix_practice' | 'chapter_practice'; // added type
  createdAt: FirebaseFirestoreTypes.Timestamp;
}

// ─── Daily Challenge ───────────────────────────────────────────

export interface DailyChallenge {
  id: string;
  standardId: string;
  quizId: string;
  date: string; // YYYY-MM-DD format
  isActive: boolean;
  createdAt: FirebaseFirestoreTypes.Timestamp;
  updatedAt: FirebaseFirestoreTypes.Timestamp;
}

// ─── Practice System ───────────────────────────────────────────

export interface MCQ {
  id: string;
  standard: string;
  standardId?: string;
  session: string;
  subjectId: string;
  chapterId?: string; // Optional for some mix-only questions, usually present
  question: string;
  options: string[]; // Always exactly 4
  correctAnswer: number; // Index 0-3
  explanation?: string;
  difficulty: QuizDifficulty;
  isActive: boolean;
  isPremium?: boolean;
  isDeleted?: boolean;
  createdAt?: FirebaseFirestoreTypes.Timestamp;
  updatedAt?: FirebaseFirestoreTypes.Timestamp;
}

export interface PracticeSettings {
  id: string;
  standard: string;
  session: string;
  allowMixTest: boolean;
  allowChapterTest: boolean;
  questionCounts: number[]; // e.g., [10, 25, 40, 50, 100]
  updatedAt?: FirebaseFirestoreTypes.Timestamp;
}

// ─── Language Section ──────────────────────────────────────────

export interface LanguageItem {
  id: string;
  standard: string;
  standardId?: string;
  standardName?: string;
  language: 'gujarati' | 'hindi' | 'english';
  title: string;
  description: string;
  content?: string; // HTML or text content for detail
  order: number;
  isActive: boolean;
  isDeleted: boolean;
  createdAt?: FirebaseFirestoreTypes.Timestamp;
  updatedAt?: FirebaseFirestoreTypes.Timestamp;
}

// ─── Blueprint ─────────────────────────────────────────────────

export interface Blueprint {
  id: string;
  standard: string;
  standardId?: string;
  subjectId?: string;
  semester: string;
  title: string;
  description?: string;
  content?: string;
  pdfUrl?: string;
  order: number;
  isActive: boolean;
  isDeleted: boolean;
  createdAt?: FirebaseFirestoreTypes.Timestamp;
  updatedAt?: FirebaseFirestoreTypes.Timestamp;
}

// ─── Old Papers ────────────────────────────────────────────────

export interface OldPaper {
  id: string;
  standard: string;
  standardId?: string;
  semester: string;
  subject: string;
  subjectId?: string;
  year: string;
  pdfUrl: string;
  title?: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt?: FirebaseFirestoreTypes.Timestamp;
  updatedAt?: FirebaseFirestoreTypes.Timestamp;
}

// ─── User Bookmarks ────────────────────────────────────────────

export interface UserBookmark {
  id: string;
  userId: string;
  chapterId: string;
  standardId?: string;
  subjectId?: string;
  subjectName?: string;
  chapterTitle?: string;
  createdAt?: FirebaseFirestoreTypes.Timestamp;
}

// ─── Subscriptions ─────────────────────────────────────────────

export type SubscriptionPlanType =
  | 'monthly'
  | 'quarterly'
  | 'yearly'
  | 'lifetime';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'pending';

export interface Subscription {
  id: string;
  userId: string;
  planType: SubscriptionPlanType;
  startDate: FirebaseFirestoreTypes.Timestamp;
  endDate: FirebaseFirestoreTypes.Timestamp;
  status: SubscriptionStatus;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  amount: number;
  currency: string;
  isManual: boolean;
  createdAt: FirebaseFirestoreTypes.Timestamp;
  updatedAt: FirebaseFirestoreTypes.Timestamp;
}

// ─── Notifications ─────────────────────────────────────────────

export type NotificationTargetType =
  | 'all'
  | 'standard'
  | 'individual'
  | 'premium';

export interface AppNotification {
  id: string;
  title: string;
  titleGu?: string;
  message: string;
  messageGu?: string;
  targetType: NotificationTargetType;
  targetStandard?: number | null;
  targetUserId?: string | null;
  sentAt?: FirebaseFirestoreTypes.Timestamp;
  isSent: boolean;
  createdAt: FirebaseFirestoreTypes.Timestamp;
  createdBy: string;
  // Delivery stats (filled by Cloud Function)
  successCount?: number;
  failureCount?: number;
  recipientCount?: number;
}

// ─── App Configuration ────────────────────────────────────────

export interface FeatureFlags {
  nmmsEnabled: boolean;
  liveClassesEnabled: boolean;
  parentDashboardEnabled: boolean;
  aiQuestionsEnabled: boolean;
}

export interface AppConfig {
  maintenanceMode: boolean;
  admobEnabled: boolean;
  rewardUnlockEnabled: boolean;
  /** Semver string of the latest published release, e.g. "1.2.0" */
  latestVersion: string;
  /** Semver string below which a force-update is required */
  forceUpdateVersion: string;
  /** When true, users on an older version cannot proceed without updating */
  forceUpdate?: boolean;
  /** Human-readable message shown on the update screen */
  updateMessage?: string;
  /** Play Store URL to open on "Update Now" tap */
  playStoreUrl?: string;
  featureFlags: FeatureFlags;
  updatedAt: FirebaseFirestoreTypes.Timestamp;
  updatedBy: string;
}

// ─── Audit Logs ────────────────────────────────────────────────

export type AuditAction =
  | 'user_blocked'
  | 'user_unblocked'
  | 'user_role_changed'
  | 'user_points_adjusted'
  | 'content_created'
  | 'content_updated'
  | 'content_deleted'
  | 'content_restored'
  | 'content_reordered'
  | 'subscription_activated'
  | 'subscription_cancelled'
  | 'leaderboard_reset'
  | 'leaderboard_frozen'
  | 'notification_sent'
  | 'config_updated'
  | 'feature_flag_toggled';

export interface AuditLog {
  id: string;
  action: AuditAction;
  performedBy: string;
  performedByName?: string;
  targetId?: string;
  targetType?: string;
  metadata: Record<string, unknown>;
  timestamp: FirebaseFirestoreTypes.Timestamp;
}

// ─── Dashboard Stats ──────────────────────────────────────────

export interface DashboardStats {
  totalUsers: number;
  premiumUsers: number;
  activeUsersToday: number;
  totalStandards: number;
  totalSubjects: number;
  totalChapters: number;
  totalQuizzes: number;
  totalQuizAttempts: number;
  revenue: number;
  topPerformingStandard: number | null;
  systemHealthy: boolean;
  lastUpdated: Date;
}

// ─── Pagination ────────────────────────────────────────────────

export interface PaginationState<T> {
  data: T[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  lastDoc: FirebaseFirestoreTypes.QueryDocumentSnapshot | null;
}

export interface PaginationConfig {
  collectionPath: string;
  pageSize: number;
  orderByField: string;
  orderDirection: 'asc' | 'desc';
  whereConditions?: Array<{
    field: string;
    operator: FirebaseFirestoreTypes.WhereFilterOp;
    value: unknown;
  }>;
}

// ─── Leaderboard ──────────────────────────────────────────────

export interface LeaderboardEntry {
  uid: string;
  name: string;
  standard: number | null;
  points: number;
  rank: number;
  streak: number;
  premium: boolean;
}

export interface LeaderboardConfig {
  isFrozen: boolean;
  frozenAt?: FirebaseFirestoreTypes.Timestamp;
  lastResetAt?: FirebaseFirestoreTypes.Timestamp;
  updatedBy?: string;
}

// ─── Navigation Types ─────────────────────────────────────────

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  CreateAdmin: undefined;
  SelectStandard: undefined; // Google-login users with null standard
  VerifyEmail: undefined; // Email/password users awaiting verification
};

export type StudentTabParamList = {
  Home: undefined;
  Subjects: undefined;
  Leaderboard: undefined;
  Profile: undefined;
};

export type AdminDrawerParamList = {
  DashboardStack: undefined;
  ContentStack: undefined;
  QuizStack: undefined;
  PracticeStack: undefined;
  LanguageSectionStack: undefined;
  BlueprintStack: undefined;
  OldPapersStack: undefined;
  UsersStack: undefined;
  PremiumStack: undefined;
  LeaderboardStack: undefined;
  NotificationsStack: undefined;
  ConfigStack: undefined;
  AuditStack: undefined;
  ProfileStack: undefined;
};

export type AdminDashboardStackParamList = {
  Dashboard: undefined;
};

export type AdminContentStackParamList = {
  ContentManagement: undefined;
  StandardForm: {standard?: Standard};
  SubjectForm: {standardId: string; subject?: Subject};
  ChapterForm: {subjectId: string; standardId: string; chapter?: Chapter};
  QuizForm: {
    chapterId: string;
    subjectId: string;
    standardId: string;
    quiz?: Quiz;
  };
  QuestionForm: {
    quizId: string;
    chapterId: string;
    subjectId: string;
    standardId: string;
    question?: Question;
  };
};

export type AdminQuizStackParamList = {
  ManageQuiz: undefined;
  QuizDetail: {quizId: string; quizTitle: string};
  AddQuiz: undefined;
};

export type AdminPracticeStackParamList = {
  PracticeSettings: undefined;
  ManageMCQs: undefined;
  AddEditMCQ: {
    subjectId?: string;
    chapterId?: string;
    mcqId?: string;
    standardId?: string;
    sessionId?: string;
  };
};

export type AdminLanguageStackParamList = {
  AdminLanguageSection: undefined;
};

export type AdminBlueprintStackParamList = {
  AdminBlueprint: undefined;
};

export type AdminOldPapersStackParamList = {
  AdminOldPapers: undefined;
};

export type AdminUsersStackParamList = {
  UserManagement: undefined;
  UserDetail: {userId: string};
};

export type AdminPremiumStackParamList = {
  PremiumManagement: undefined;
  SubscriptionDetail: {subscriptionId: string};
};

export type AdminLeaderboardStackParamList = {
  LeaderboardManagement: undefined;
};

export type AdminNotificationsStackParamList = {
  Notifications: undefined;
  CreateNotification: undefined;
};

export type AdminConfigStackParamList = {
  AppConfig: undefined;
};

export type AdminAuditStackParamList = {
  AuditLogs: undefined;
};

// ─── API Response Wrappers ─────────────────────────────────────

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  lastDoc: FirebaseFirestoreTypes.QueryDocumentSnapshot | null;
  hasMore: boolean;
}
