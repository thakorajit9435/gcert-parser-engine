import {useState, useCallback} from 'react';
import {Book} from '../types';
import {
  getBooksByStandard,
  getAllBooks,
} from '../services/firebase/book.service';

export function useBooks(standard?: string | null, activeOnly = true) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (standard) {
        const result = await getBooksByStandard(standard, activeOnly);
        if (result.success && result.data) {
          setBooks(result.data);
        } else {
          setError(result.error ?? 'Failed to fetch books');
        }
      } else {
        // Admin typically fetches all books across all standards
        const result = await getAllBooks();
        if (result.success && result.data) {
          setBooks(result.data);
        } else {
          setError(result.error ?? 'Failed to fetch books');
        }
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [standard, activeOnly]);

  return {
    books,
    loading,
    error,
    fetchBooks,
  };
}
