import { BACKEND_API_URL } from '../constants';

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

export interface RagAskResponse {
  answer: string;
  citations: CitationItem[];
  metadata: {
    status?: string;
    model?: string;
    source?: string;
    avg_retrieval_confidence?: number;
  };
}

export interface ChatSessionCreate {
  userId?: string;
  title?: string;
  chapterId?: string;
  subjectId?: string;
  metadata?: Record<string, any>;
}

export interface ChatSessionResponse {
  sessionId: string;
  title: string;
  createdAt: string;
  messages: any[];
}

/**
 * Ask a direct educational question using RAG & Gemini LLM
 */
export async function askAIQuestion(
  question: string,
  filters?: SearchFilters
): Promise<{ success: boolean; data?: RagAskResponse; error?: string }> {
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/v1/rag/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        question,
        filters: filters || {},
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return { success: false, error: `API Error ${response.status}: ${errText}` };
    }

    const data: RagAskResponse = await response.json();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network connection error',
    };
  }
}

/**
 * Create a new AI chat session for a chapter or subject
 */
export async function createAIChatSession(
  params: ChatSessionCreate
): Promise<{ success: boolean; data?: ChatSessionResponse; error?: string }> {
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/v1/chat/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errText = await response.text();
      return { success: false, error: `API Error ${response.status}: ${errText}` };
    }

    const data: ChatSessionResponse = await response.json();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network connection error',
    };
  }
}

/**
 * Send a message inside an existing AI chat session
 */
export async function sendAIChatMessage(
  sessionId: string,
  question: string,
  filters?: SearchFilters
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const response = await fetch(
      `${BACKEND_API_URL}/api/v1/chat/sessions/${sessionId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          question,
          filters: filters || {},
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return { success: false, error: `API Error ${response.status}: ${errText}` };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network connection error',
    };
  }
}

/**
 * Health check to verify live connectivity with Render backend
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_API_URL}/`, {
      method: 'GET',
    });
    return response.ok;
  } catch {
    return false;
  }
}
