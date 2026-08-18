import {Platform} from 'react-native';
import {API_CONFIG} from '../constants';

// ─── Smart URL Resolution with Auto-Fallback ─────────────────────────────────
// Priority:
//   1. Local LAN (fast, same WiFi) — used in __DEV__
//   2. Cloudflare tunnel (BASE_URL_PROD) — automatic fallback if LAN fails
//      OR primary when not on same WiFi network

const LOCAL_URL = __DEV__
  ? (Platform.OS === 'android' ? API_CONFIG.BASE_URL_ANDROID : API_CONFIG.BASE_URL_IOS)
  : API_CONFIG.BASE_URL_PROD;

const REMOTE_URL = API_CONFIG.BASE_URL_PROD;

// Cached resolved URL so health-check runs once per app session
let resolvedBaseUrl: string | null = null;
let healthCheckPromise: Promise<string> | null = null;

/**
 * Ping a URL and return true if it responds within the timeout.
 */
const pingUrl = async (url: string, timeoutMs = 4000): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const resp = await fetch(url, {method: 'GET', signal: controller.signal});
    clearTimeout(timer);
    return resp.status < 500;
  } catch {
    return false;
  }
};

/**
 * Returns the best available backend URL.
 * Tries LOCAL first (fast), falls back to REMOTE (Cloudflare tunnel).
 * Result is cached for the lifetime of the app session.
 */
const getBaseUrl = async (): Promise<string> => {
  if (resolvedBaseUrl) return resolvedBaseUrl;

  // Deduplicate concurrent calls
  if (healthCheckPromise) return healthCheckPromise;

  healthCheckPromise = (async () => {
    // If local and remote are the same (e.g. production build), skip ping
    if (LOCAL_URL === REMOTE_URL) {
      resolvedBaseUrl = REMOTE_URL;
      return REMOTE_URL;
    }

    const localAlive = await pingUrl(`${String(LOCAL_URL).replace('/api/v1', '')}/`);
    if (localAlive) {
      console.log('[AI] Using local backend:', LOCAL_URL);
      resolvedBaseUrl = LOCAL_URL;
      return LOCAL_URL;
    }

    console.log('[AI] Local backend unreachable, switching to remote tunnel:', REMOTE_URL);
    resolvedBaseUrl = REMOTE_URL;
    return REMOTE_URL;
  })();

  return healthCheckPromise;
};

// Pre-warm in background so first request is instant
getBaseUrl().catch(() => {});

// ─────────────────────────────────────────────────────────────────────────────

export interface SearchFilters {
  standard?: string;
  session?: string;
  subject?: string;
  chapter?: string;
  topic?: string;
  difficulty?: string;
  language?: string;
  isPremium?: boolean;
  pageNumber?: number;
}

export interface CitationItem {
  citationId: string;
  chapter: string;
  pageNumber: number;
  textQuote: string;
}

export interface RagResponse {
  answer: string;
  citations: CitationItem[];
  metadata: {
    status: string;
    model: string;
  };
}

export const aiTutorService = {
  /**
   * Initializes a new chat session in Firestore.
   */
  async createChatSession(
    userId: string,
    title: string,
    metadata?: any,
  ): Promise<string> {
    const BASE_URL = await getBaseUrl();
    try {
      const response = await fetch(`${BASE_URL}/chat/sessions`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({userId, title, metadata}),
      });

      if (!response.ok) {
        throw new Error(`Failed to create chat session: ${response.status}`);
      }

      const data = await response.json();
      return data.sessionId;
    } catch (error) {
      // If local failed mid-request, reset cache so next attempt re-probes
      if (resolvedBaseUrl === LOCAL_URL) {
        resolvedBaseUrl = null;
        healthCheckPromise = null;
      }
      console.error('Error creating chat session:', error);
      throw error;
    }
  },

  /**
   * Sends a user question to the RAG backend.
   */
  async sendChatMessage(
    sessionId: string,
    question: string,
    filters?: SearchFilters,
  ): Promise<RagResponse> {
    const BASE_URL = await getBaseUrl();
    let lastError: any = null;

    // Retry up to 2 times to absorb Render free tier cold-starts
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await fetch(
          `${BASE_URL}/chat/sessions/${sessionId}/messages`,
          {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({question, filters: filters || {}}),
          },
        );

        if (response.ok) {
          return await response.json();
        }

        if (response.status >= 500 && attempt < 2) {
          console.warn(`[AI] Server waking up (${response.status}). Retrying attempt ${attempt + 1}...`);
          await new Promise(r => setTimeout(r, 2500));
          continue;
        }

        throw new Error(`Failed to send chat message: ${response.status}`);
      } catch (error) {
        lastError = error;
        if (attempt < 2) {
          await new Promise(r => setTimeout(r, 2000));
        }
      }
    }

    console.error('Error sending chat message:', lastError);
    throw lastError;
  },

  /**
   * Toggle bookmark state of a chat session.
   */
  async bookmarkChatSession(
    sessionId: string,
    isBookmarked: boolean,
  ): Promise<boolean> {
    try {
      const BASE_URL = await getBaseUrl();
      const response = await fetch(
        `${BASE_URL}/chat/sessions/${sessionId}/bookmark`,
        {
          method: 'PATCH',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({isBookmarked}),
        },
      );
      return response.ok;
    } catch (error) {
      console.error('Error bookmarking chat session:', error);
      return false;
    }
  },

  /**
   * Performs a soft delete of a chat session.
   */
  async deleteChatSession(sessionId: string): Promise<boolean> {
    try {
      const BASE_URL = await getBaseUrl();
      const response = await fetch(`${BASE_URL}/chat/sessions/${sessionId}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      console.error('Error deleting chat session:', error);
      return false;
    }
  },

  /**
   * Generates explanation for a quiz question
   */
  async explainQuizQuestion(
    question: string,
    options: string[],
    correctAnswerIndex: number,
    selectedAnswerIndex: number,
  ): Promise<string> {
    const BASE_URL = await getBaseUrl();
    try {
      const response = await fetch(`${BASE_URL}/quiz/explain`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          question,
          options,
          correctAnswerIndex,
          selectedAnswerIndex,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get quiz explanation');
      }

      const data = await response.json();
      return data.explanation;
    } catch (error) {
      console.error('explainQuizQuestion error:', error);
      throw error;
    }
  },

  /**
   * Sends base64 image and question for multimodal doubt solving
   */
  async sendMultimodalDoubt(
    imageBase64: string,
    question?: string,
    mimeType?: string,
  ): Promise<string> {
    const BASE_URL = await getBaseUrl();
    try {
      const response = await fetch(`${BASE_URL}/chat/multimodal`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          image_base64: imageBase64,
          question: question || 'આ પ્રશ્ન સમજાવો.',
          mime_type: mimeType || 'image/jpeg',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to solve doubt from image');
      }

      const data = await response.json();
      return data.answer;
    } catch (error) {
      console.error('sendMultimodalDoubt error:', error);
      throw error;
    }
  },

  /**
   * Force re-probe backend URL (call after network change)
   */
  resetUrlCache(): void {
    resolvedBaseUrl = null;
    healthCheckPromise = null;
    getBaseUrl().catch(() => {});
  },
};
