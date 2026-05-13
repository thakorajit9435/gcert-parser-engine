import {useState, useEffect} from 'react';
import {Blueprint} from '../types';
import {subscribeToBlueprints} from '../services/firebase/blueprint.service';

interface UseBlueprintsReturn {
  blueprints: Blueprint[];
  loading: boolean;
  error: string | null;
}

export function useBlueprints(
  standard?: string,
  semester?: string,
): UseBlueprintsReturn {
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!standard || !semester) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToBlueprints(
      standard,
      semester,
      data => {
        setBlueprints(data);
        setLoading(false);
        setError(null);
      },
      err => {
        setError(err);
        setBlueprints([]);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [standard, semester]);

  return {blueprints, loading, error};
}
