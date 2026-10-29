import { useCallback, useEffect, useState } from 'react';

export type ThemePreference = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'dome-theme';

export function readThemePreference(): ThemePreference {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : 'system';
  } catch {
    return 'system';
  }
}

function systemTheme(): 'light' | 'dark' {
  return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** Sets `data-theme` on <html>. Called before the first render so there is no flash. */
export function applyTheme(preference: ThemePreference): void {
  document.documentElement.dataset.theme = preference === 'system' ? systemTheme() : preference;
}

export function useTheme(): [ThemePreference, (next: ThemePreference) => void] {
  const [preference, setPreference] = useState<ThemePreference>(readThemePreference);

  useEffect(() => {
    applyTheme(preference);
    if (preference !== 'system' || typeof matchMedia !== 'function') return;
    const query = matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [preference]);

  const update = useCallback((next: ThemePreference) => {
    try {
      if (next === 'system') localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage can be blocked; the choice then lasts for this visit only.
    }
    setPreference(next);
  }, []);

  return [preference, update];
}
