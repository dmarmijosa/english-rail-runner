/**
 * @fileoverview Domain: progression rules. Pure functions over a plain,
 * serializable progress object (persisted as-is by infra/storage).
 */

/** Player progress across the whole curriculum. */
export interface Progress {
  /** Best stars per level id (1-based) → 0..3. */
  stars: Record<number, number>;
  /** Lifetime coin total. */
  coins: number;
  /** English words answered correctly at least once. */
  learned: Record<string, boolean>;
}

/**
 * Stars earned for a level result: ≥60 % = 1★, ≥80 % = 2★, 100 % = 3★.
 * @param correct Questions answered correctly.
 * @param total   Total questions in the level.
 */
export function starsFor(correct: number, total: number): number {
  const r = correct / total;
  if (r >= 1) return 3;
  if (r >= 0.8) return 2;
  if (r >= 0.6) return 1;
  return 0;
}

/** Fresh progress for a first-time player. */
export function emptyProgress(): Progress {
  return { stars: {}, coins: 0, learned: {} };
}

/** Level `levelId` is unlocked when the previous level has ≥1 star. */
export function unlocked(progress: Progress, levelId: number): boolean {
  return levelId === 1 || (progress.stars[levelId - 1] || 0) >= 1;
}

/**
 * Merges a finished level into the progress (immutably): keeps the best star
 * count, accumulates coins and marks the words as learned.
 */
export function recordResult(
  progress: Progress, levelId: number, correctWords: string[], stars: number, coins: number,
): Progress {
  const p: Progress = { ...progress, stars: { ...progress.stars }, learned: { ...progress.learned } };
  p.stars[levelId] = Math.max(p.stars[levelId] || 0, stars);
  p.coins += coins;
  for (const w of correctWords) p.learned[w] = true;
  return p;
}
