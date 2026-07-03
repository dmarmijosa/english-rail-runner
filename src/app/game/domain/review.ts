/**
 * @fileoverview Domain: review sessions. Builds a synthetic level out of the
 * words the player has missed so far (Progress.failed), so they can practise
 * exactly those. Pure — no engine/UI dependencies.
 */
import { CURRICULUM, LevelDef, WordPair } from './curriculum';
import { Progress } from './progress';

/** Synthetic level id for review runs (never a real curriculum level). */
export const REVIEW_LEVEL_ID = 0;
/** Difficulty index used to pace review runs (gentle-moderate). */
export const REVIEW_DIFFICULTY = 2;
/** Max words quizzed per review session, to keep it short and focused. */
export const MAX_REVIEW_WORDS = 10;

/** Every vocabulary pair in the curriculum — the review distractor pool. */
export const ALL_PAIRS: ReadonlyArray<readonly [string, string]> =
  CURRICULUM.reduce<Array<readonly [string, string]>>(
    (acc, l) => acc.concat(l.items), []);

/** Words currently queued for review, as {es, en} pairs (oldest first). */
export function reviewWords(progress: Progress): WordPair[] {
  return Object.entries(progress.failed).map(([en, es]) => ({ es, en }));
}

/** How many words are pending review. */
export function reviewCount(progress: Progress): number {
  return Object.keys(progress.failed).length;
}

/**
 * Builds a synthetic review level from the player's missed words (up to
 * {@link MAX_REVIEW_WORDS}). Returns null when there is nothing to review.
 */
export function buildReviewLevel(progress: Progress): LevelDef | null {
  const words = reviewWords(progress);
  if (words.length === 0) return null;
  const items = words.slice(0, MAX_REVIEW_WORDS).map((w) => [w.es, w.en] as const);
  return { id: REVIEW_LEVEL_ID, unit: 'Repaso', items };
}
