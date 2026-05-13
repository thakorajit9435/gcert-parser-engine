import {useState, useEffect} from 'react';
import {LanguageItem} from '../types';
import {subscribeToLanguageItems} from '../services/firebase/language.service';

interface UseLanguageSectionReturn {
  items: LanguageItem[];
  loading: boolean;
  error: string | null;
}

export function useLanguageSection(
  standard?: string,
  language?: string,
): UseLanguageSectionReturn {
  const [items, setItems] = useState<LanguageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!standard || !language) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToLanguageItems(
      standard,
      language,
      data => {
        setItems(data);
        setLoading(false);
        setError(null);
      },
      err => {
        setError(err);
        setItems([]);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [standard, language]);

  return {items, loading, error};
}
