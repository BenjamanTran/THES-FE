import { useEffect, useState } from 'react';
import { fetchGames, type Game } from '@/lib/api';

export function useGames(params?: Record<string, string>) {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    fetchGames(params)
      .then((res) => {
        if (!cancelled) setGames(res.games);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [JSON.stringify(params)]);

  return { games, loading, error };
}
