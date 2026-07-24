import {Platform} from 'react-native';
import {API_CONFIG} from '../constants';

const BASE_URL = __DEV__
  ? (Platform.OS === 'android' ? API_CONFIG.BASE_URL_ANDROID : API_CONFIG.BASE_URL_IOS)
  : API_CONFIG.BASE_URL_PROD;

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
    try {
      const response = await fetch(`${BASE_URL}/chat/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          title,
          metadata,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create chat session');
      }

      const data = await response.json();
      return data.sessionId;
    } catch (error) {
      console.error('Error creating chat session:', error);
      throw error;
    }
  },

  /**
   * Sends a user question to the RAG backend.
   * The backend processes RAG, saves both question and answer to Firestore, and returns the response.
   */
  async sendChatMessage(
    sessionId: string,
    question: string,
    filters?: SearchFilters,
  ): Promise<RagResponse> {
    try {
      const response = await fetch(
        `${BASE_URL}/chat/sessions/${sessionId}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            question,
            filters: filters || {},
          }),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to send chat message');
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending chat message:', error);
      throw error;
    }
  },

  /**
   * Toggle bookmark state of a chat session.
   */
  async bookmarkChatSession(
    sessionId: string,
    isBookmarked: boolean,
  ): Promise<boolean> {
    try {
      const response = await fetch(
        `${BASE_URL}/chat/sessions/${sessionId}/bookmark`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            isBookmarked,
          }),
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
    selectedAnswerIndex: number
  ): Promise<string> {
    try {
      const response = await fetch(`${BASE_URL}/quiz/explain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
    mimeType?: string
  ): Promise<string> {
    try {
      const response = await fetch(`${BASE_URL}/chat/multimodal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_base64: imageBase64,
          question: question || "આ પ્રશ્ન સમજાવો.",
          mime_type: mimeType || "image/jpeg",
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
};
