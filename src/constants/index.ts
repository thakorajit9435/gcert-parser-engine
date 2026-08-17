// ─── Firestore Collection Names ───────────────────────────────

export const COLLECTIONS = {
  USERS: 'users',
  STANDARDS: 'standards',
  SESSIONS: 'sessions',
  SUBJECTS: 'subjects',
  CHAPTERS: 'chapters',
  QUIZZES: 'quizzes',
  QUESTIONS: 'questions',
  QUIZ_ATTEMPTS: 'quizAttempts',
  SUBSCRIPTIONS: 'subscriptions',
  USER_PROGRESS: 'userProgress',
  DAILY_CHALLENGES: 'dailyChallenges',
  NOTIFICATIONS: 'notifications',
  APP_CONFIG: 'appConfig',
  AUDIT_LOGS: 'auditLogs',
  LEADERBOARD_CONFIG: 'leaderboardConfig',
  MCQS: 'mcqs',
  PRACTICE_SETTINGS: 'practiceSettings',
  LANGUAGE_SECTION: 'languageSection',
  BLUEPRINTS: 'blueprints',
  OLD_PAPERS: 'oldPapers',
  USER_BOOKMARKS: 'bookmarks',
  PDF_READING_PROGRESS: 'pdfReadingProgress',
  // ── Bulk Import (additive only) ──────────────────────────────
  IMPORT_LOGS: 'importLogs',
  // ── CMS Modules ──────────────────────────────────────────────
  TOPICS: 'topics',
  LEARNING_OUTCOMES: 'learning_outcomes',
  QUESTION_BANK: 'question_bank',
  MCQ_BANK: 'mcq_bank',
  WORKSHEETS: 'worksheets',
  LESSON_PLANS: 'lesson_plans',
  FLASHCARDS: 'flashcards',
  GLOSSARY: 'glossary',
  VIDEOS: 'videos',
  TEXTBOOKS: 'textbooks',
  SUB_TOPICS: 'sub_topics',
  CHAPTER_SUMMARIES: 'chapter_summaries',
  ACTIVITIES: 'activities',
  KEYWORDS: 'keywords',
} as const;

// ─── Route Names ──────────────────────────────────────────────

export const ROUTES = {
  // Auth
  LOGIN: 'Login',
  OTP_VERIFICATION: 'OTPVerification',

  // Student
  STUDENT_HOME: 'Home',
  STUDENT_SUBJECTS: 'Subjects',
  STUDENT_LEADERBOARD: 'Leaderboard',
  STUDENT_PROFILE: 'Profile',

  // Admin Drawer
  DASHBOARD_STACK: 'DashboardStack',
  CONTENT_STACK: 'ContentStack',
  USERS_STACK: 'UsersStack',
  PREMIUM_STACK: 'PremiumStack',
  LEADERBOARD_STACK: 'LeaderboardStack',
  NOTIFICATIONS_STACK: 'NotificationsStack',
  CONFIG_STACK: 'ConfigStack',
  AUDIT_STACK: 'AuditStack',

  // Admin Screens
  DASHBOARD: 'Dashboard',
  CONTENT_MANAGEMENT: 'ContentManagement',
  STANDARD_FORM: 'StandardForm',
  SUBJECT_FORM: 'SubjectForm',
  CHAPTER_FORM: 'ChapterForm',
  QUIZ_FORM: 'QuizForm',
  QUESTION_FORM: 'QuestionForm',
  USER_MANAGEMENT: 'UserManagement',
  USER_DETAIL: 'UserDetail',
  PREMIUM_MANAGEMENT: 'PremiumManagement',
  SUBSCRIPTION_DETAIL: 'SubscriptionDetail',
  LEADERBOARD_MANAGEMENT: 'LeaderboardManagement',
  NOTIFICATIONS: 'Notifications',
  CREATE_NOTIFICATION: 'CreateNotification',
  APP_CONFIG: 'AppConfig',
  AUDIT_LOGS: 'AuditLogs',
} as const;

// ─── Storage Paths ────────────────────────────────────────────

export const STORAGE_PATHS = {
  SUBJECT_IMAGES: 'subjects/images',
  CHAPTER_IMAGES: 'chapters/images',
  CHAPTER_PDFS: 'chapters/pdfs',
  QUESTION_IMAGES: 'questions/images',
  OPTION_IMAGES: 'questions/options',
  OLD_PAPERS_PDFS: 'oldPapers/pdfs',
  BLUEPRINT_PDFS: 'blueprints/pdfs',
} as const;

// ─── Pagination ───────────────────────────────────────────────

export const DEFAULT_PAGE_SIZE = 20;
export const DASHBOARD_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ─── App ──────────────────────────────────────────────────────

export const APP_CONFIG_DOC_ID = 'main';
/** Document that stores mobile-specific release config (version check, Play Store URL) */
export const MOBILE_APP_CONFIG_DOC_ID = 'mobileApp';
export const LEADERBOARD_CONFIG_DOC_ID = 'config';

// ─── Standards Range ──────────────────────────────────────────

export const MIN_STANDARD = 1;
export const MAX_STANDARD = 8;

// ─── Subscription Plans ──────────────────────────────────────

export const SUBSCRIPTION_PLANS = [
  {
    type: 'monthly' as const,
    label: 'Monthly',
    labelGu: 'માસિક',
    durationDays: 30,
  },
  {
    type: 'quarterly' as const,
    label: 'Quarterly',
    labelGu: 'ત્રિમાસિક',
    durationDays: 90,
  },
  {
    type: 'yearly' as const,
    label: 'Yearly',
    labelGu: 'વાર્ષિક',
    durationDays: 365,
  },
  {
    type: 'lifetime' as const,
    label: 'Lifetime',
    labelGu: 'આજીવન',
    durationDays: -1,
  },
] as const;

// ─── API Configuration (Phase 2 Additions) ───────────────────────────────────
export const API_CONFIG = {
  // ── Local (same WiFi / development) ──────────────────────────────────────
  BASE_URL_ANDROID: 'http://10.41.87.148:8000/api/v1',
  BASE_URL_IOS:     'http://localhost:8000/api/v1',

  // ── Production (Cloudflare Tunnel → FastAPI → Ollama qwen2.5:1.5b) ───────
  // Update this URL each time you restart the tunnel:
  //   cloudflared tunnel --url http://localhost:8000
  BASE_URL_PROD:   'https://preliminary-noted-reform-chair.trycloudflare.com/api/v1',

  // ── Ollama direct (same WiFi LAN only, bypasses FastAPI) ─────────────────
  // Useful for direct raw inference tests — not needed for normal app usage
  OLLAMA_LOCAL:    'http://10.41.87.148:11434',
  OLLAMA_MODEL:    'qwen2.5:1.5b',
} as const;
