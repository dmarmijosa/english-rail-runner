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
 * Builds the question list for a level. Distractors come from the same level
 * (same topic → plausible confusions); order and correct lane depend on `seed`.
 * @param level Level definition with its word pairs.
 * @param seed  RNG seed — vary it per run so replays differ.
 */
export function buildQuestions(level: LevelDef, seed: number): Question[] {
  const rng = mulberry32(seed);
  const order = shuffled(level.items, rng);
  return order.map(([es, en]) => {
    const others = shuffled(level.items.filter(([, e]) => e !== en), rng)
      .slice(0, 2).map(([, e]) => e);
    const options = shuffled([en, ...others], rng);
    return { es, en, options, correctLane: options.indexOf(en) - 1 };
  });
}
