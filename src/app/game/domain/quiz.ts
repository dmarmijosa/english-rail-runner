/**
 * @fileoverview Domain: question sequencing + distractor selection.
 * Pure and fully seeded — the same seed always builds the same quiz.
 */
import { LevelDef } from './curriculum';

/** One quiz question: Spanish prompt + three English options on lanes -1/0/1. */
export interface Question {
  /** Spanish prompt shown to the player. */
  es: string;
  /** Correct English answer. */
  en: string;
  /** The three options in lane order (index 0 → lane -1). */
  options: string[];
  /** Lane carrying the correct answer: -1 | 0 | 1. */
  correctLane: number;
}

/** Deterministic pseudo-random generator returning values in [0, 1). */
export type Rng = () => number;

/**
 * Mulberry32 PRNG — tiny, fast and deterministic.
 * @param seed 32-bit seed.
 */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher–Yates shuffle driven by the given RNG (input untouched). */
export function shuffled<T>(arr: readonly T[], rng: Rng): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Builds the question list for a level. Each question gets two distractors
 * drawn from `distractorPool` (default: the same level, so confusions stay
 * on-topic); order and correct lane depend on `seed`.
 * @param level          Level definition with its word pairs.
 * @param seed           RNG seed — vary it per run so replays differ.
 * @param distractorPool Pool the wrong options are drawn from. Defaults to the
 *                       level's own items; review mode passes the full
 *                       vocabulary so short word sets still get 3 options.
 */
export function buildQuestions(
  level: LevelDef,
  seed: number,
  distractorPool: ReadonlyArray<readonly [string, string]> = level.items,
): Question[] {
  const rng = mulberry32(seed);
  const order = shuffled(level.items, rng);
  return order.map(([es, en]) => {
    // pick two distinct distractors, never equal to the answer
    const pool = shuffled(distractorPool, rng);
    const others: string[] = [];
    for (const [, e] of pool) {
      if (e !== en && !others.includes(e)) others.push(e);
      if (others.length === 2) break;
    }
    const options = shuffled([en, ...others], rng);
    return { es, en, options, correctLane: options.indexOf(en) - 1 };
  });
}
