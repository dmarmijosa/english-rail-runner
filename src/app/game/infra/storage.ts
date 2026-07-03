/**
 * @fileoverview Infra: persistence via localStorage (no auth by design).
 * Swapping to Capacitor Preferences or a backend only touches this file.
 */
import { Progress, emptyProgress } from '../domain/progress';

const KEY = 'english-rail-runner-v1';

/** Loads saved progress; any read/parse failure returns a fresh object. */
export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...emptyProgress(), ...JSON.parse(raw) as Partial<Progress> };
  } catch { /* private mode or corrupt data → fresh start */ }
  return emptyProgress();
}

/** Persists progress (best effort — private mode may reject writes). */
export function saveProgress(p: Progress): void {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* best effort */ }
}
