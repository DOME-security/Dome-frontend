import { useCallback, useState } from 'react';
import { isValidOwner, isValidRepo } from './github';

export interface WatchedRepo {
  owner: string;
  repo: string;
}

const KEY = 'dome-watchlist';
const MAX = 50;

/** Reads the saved list, dropping anything that is not a valid owner/repo pair. */
export function readWatchlist(): WatchedRepo[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (r): r is WatchedRepo =>
          typeof r?.owner === 'string' && typeof r?.repo === 'string' && isValidOwner(r.owner) && isValidRepo(r.repo),
      )
      .slice(0, MAX);
  } catch {
    return [];
  }
}

function save(list: WatchedRepo[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // Storage blocked: the list lasts for this visit only.
  }
}

/** Repositories a maintainer follows, kept only in this browser. */
export function useWatchlist() {
  const [list, setList] = useState<WatchedRepo[]>(readWatchlist);
  const add = useCallback((repo: WatchedRepo) => {
    setList((current) => {
      const key = `${repo.owner}/${repo.repo}`.toLowerCase();
      if (current.some((r) => `${r.owner}/${r.repo}`.toLowerCase() === key)) return current;
      const next = [...current, repo].slice(0, MAX);
      save(next);
      return next;
    });
  }, []);
  const remove = useCallback((repo: WatchedRepo) => {
    setList((current) => {
      const next = current.filter((r) => r.owner !== repo.owner || r.repo !== repo.repo);
      save(next);
      return next;
    });
  }, []);
  return { list, add, remove };
}
