import {useState, useEffect} from 'react';
import {OldPaper} from '../types';
import {subscribeToOldPapers} from '../services/firebase/oldPapers.service';

interface UseOldPapersReturn {
  papers: OldPaper[];
  loading: boolean;
  error: string | null;
}

export function useOldPapers(
  standard?: string,
  semester?: string,
): UseOldPapersReturn {
  const [papers, setPapers] = useState<OldPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!standard || !semester) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToOldPapers(
      standard,
      semester,
      data => {
        setPapers(data);
        setLoading(false);
        setError(null);
      },
      err => {
        setError(err);
        setPapers([]);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [standard, semester]);

  return {papers, loading, error};
}
