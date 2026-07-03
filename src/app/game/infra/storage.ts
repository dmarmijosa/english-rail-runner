// Infra: persistence via localStorage (no auth by design).
import { Progress, emptyProgress } from '../domain/progress';

const KEY = 'english-rail-runner-v1';

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...emptyProgress(), ...JSON.parse(raw) as Partial<Progress> };
  } catch { /* private mode or corrupt data → fresh start */ }
  return emptyProgress();
}

export function saveProgress(p: Progress): void {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* best effort */ }
}
