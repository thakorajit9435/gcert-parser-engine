import { API_CONFIG } from '../constants';

// ─── Smart URL Resolution ───────────────────────────────────────────────────

const REMOTE_URL = API_CONFIG.BASE_URL_PROD;

let resolvedBaseUrl: string = REMOTE_URL;

const getBaseUrl = async (): Promise<string> => {
  return resolvedBaseUrl;
};

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
   * Initializes a new chat session in Firestore/Backend.
   * Uses resilient fallback if server is cold.
   */
  async createChatSession(
    userId: string,
    title: string,
    metadata?: any,
  ): Promise<string> {
    const BASE_URL = await getBaseUrl();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 40000);
      const response = await fetch(`${BASE_URL}/chat/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, title, metadata }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json();
        if (data?.sessionId) return data.sessionId;
      }
    } catch (error) {
      console.warn('[aiTutor] Backend session creation notice (using resilient local session):', error);
    }
    // Instant resilient session fallback so student never blocks on cold-start
    return `sess_${userId}_${metadata?.chapterId || Date.now()}`;
  },

  /**
   * Sends a user question to the RAG backend with cold-start retry handling.
   */
  async sendChatMessage(
    sessionId: string,
    question: string,
    filters?: SearchFilters,
  ): Promise<RagResponse> {
    const BASE_URL = await getBaseUrl();
    let lastError: any = null;

    // Retry up to 3 times to absorb Render free tier cold-starts
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 65000);

        const response = await fetch(
          `${BASE_URL}/chat/sessions/${sessionId}/messages`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question, filters: filters || {} }),
            signal: controller.signal,
          },
        );
        clearTimeout(timeout);

        if (response.ok) {
          return await response.json();
        }

        if (response.status >= 500 && attempt < 3) {
          console.warn(`[AI] Server waking up (${response.status}). Retrying attempt ${attempt + 1}...`);
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }

        throw new Error(`Failed to send chat message: ${response.status}`);
      } catch (error) {
        lastError = error;
        if (attempt < 3) {
          console.log(`[AI] Attempt ${attempt} waiting for backend...`);
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
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isBookmarked }),
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
   * Force re-probe backend URL
   */
  resetUrlCache(): void {
    resolvedBaseUrl = REMOTE_URL;
  },

  /**
   * Pre-warms the AI tutor backend.
   */
  async prewarm(): Promise<void> {
    try {
      const BASE_URL = await getBaseUrl();
      fetch(`${BASE_URL}/search/health`).catch(() => {});
    } catch {
      // Ignore
    }
  },
};
