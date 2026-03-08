import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "tokenaltcoin_watchlist";

function getStored(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function save(ids: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<string[]>(getStored);

  useEffect(() => {
    const handler = () => setWatchlist(getStored());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const addToWatchlist = useCallback((coinId: string) => {
    setWatchlist((prev) => {
      if (prev.includes(coinId)) return prev;
      const next = [...prev, coinId];
      save(next);
      return next;
    });
  }, []);

  const removeFromWatchlist = useCallback((coinId: string) => {
    setWatchlist((prev) => {
      const next = prev.filter((id) => id !== coinId);
      save(next);
      return next;
    });
  }, []);

  const toggleWatchlist = useCallback((coinId: string) => {
    setWatchlist((prev) => {
      const next = prev.includes(coinId)
        ? prev.filter((id) => id !== coinId)
        : [...prev, coinId];
      save(next);
      return next;
    });
  }, []);

  const isWatched = useCallback(
    (coinId: string) => watchlist.includes(coinId),
    [watchlist]
  );

  return { watchlist, addToWatchlist, removeFromWatchlist, toggleWatchlist, isWatched };
}
