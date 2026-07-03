// Domain: question sequencing + distractor selection. Pure, seeded.
import { LevelDef } from './curriculum';

export interface Question {
  es: string;
  en: string;
  options: string[];
  correctLane: number; // -1 | 0 | 1
}

export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffled<T>(arr: readonly T[], rng: Rng): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Builds the question list for a level: each question = prompt (es), 3 options
// (en) on lanes [-1,0,1], index of the correct lane.
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
