// Domain: progression rules. Pure functions over a plain progress object.

export interface Progress {
  stars: Record<number, number>;   // levelId (1-based) → 0..3
  coins: number;
  learned: Record<string, boolean>; // english word → learned
}

export function starsFor(correct: number, total: number): number {
  const r = correct / total;
  if (r >= 1) return 3;
  if (r >= 0.8) return 2;
  if (r >= 0.6) return 1;
  return 0;
}

export function emptyProgress(): Progress {
  return { stars: {}, coins: 0, learned: {} };
}

// stars are keyed by level id (1-based). Level i unlocked when level i-1 has ≥1 star.
export function unlocked(progress: Progress, levelId: number): boolean {
  return levelId === 1 || (progress.stars[levelId - 1] || 0) >= 1;
}

export function recordResult(
  progress: Progress, levelId: number, correctWords: string[], stars: number, coins: number,
): Progress {
  const p: Progress = { ...progress, stars: { ...progress.stars }, learned: { ...progress.learned } };
  p.stars[levelId] = Math.max(p.stars[levelId] || 0, stars);
  p.coins += coins;
  for (const w of correctWords) p.learned[w] = true;
  return p;
}
