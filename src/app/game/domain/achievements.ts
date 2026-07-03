/**
 * @fileoverview Domain: achievements. Pure definitions + evaluation over the
 * progress and the just-finished run. No engine/UI dependencies — the caller
 * passes a plain {@link AchievementContext}.
 */
import { CURRICULUM } from './curriculum';
import { Progress } from './progress';

/** One unlockable achievement. */
export interface Achievement {
  /** Stable id, also the key in Progress.achievements. */
  id: string;
  /** Emoji badge. */
  icon: string;
  /** Short title (Spanish). */
  title: string;
  /** One-line description of how to earn it (Spanish). */
  desc: string;
  /** True when the achievement is satisfied by the given context. */
  test: (ctx: AchievementContext) => boolean;
}

/** Everything an achievement predicate may inspect. */
export interface AchievementContext {
  /** Progress AFTER merging the finished run. */
  progress: Progress;
  /** Did the run reach the finish line? */
  won: boolean;
  /** Correct answers this run. */
  correct: number;
  /** Total questions this run. */
  total: number;
  /** Highest streak reached this run. */
  maxStreak: number;
  /** Hearts left at the end (0 on a loss). */
  heartsLeft: number;
  /** Was this a review session? */
  isReview: boolean;
}

const learnedCount = (p: Progress) => Object.keys(p.learned).length;
const tierComplete = (p: Progress, tier: number) =>
  CURRICULUM.slice(tier * 6, tier * 6 + 6).every((l) => (p.stars[l.id] || 0) >= 1);

/** The full achievement catalogue, in display order. */
export const ACHIEVEMENTS: readonly Achievement[] = [
  { id: 'first_word', icon: '🌱', title: 'Primer paso',
    desc: 'Aprende tu primera palabra',
    test: (c) => learnedCount(c.progress) >= 1 },
  { id: 'perfect', icon: '💯', title: 'Sin fallos',
    desc: 'Completa un nivel con 100 % de aciertos',
    test: (c) => c.won && !c.isReview && c.total > 0 && c.correct === c.total },
  { id: 'flawless', icon: '🛡️', title: 'Intacto',
    desc: 'Termina un nivel sin perder ningún corazón',
    test: (c) => c.won && !c.isReview && c.heartsLeft >= 3 },
  { id: 'streak5', icon: '🔥', title: 'Racha de fuego',
    desc: 'Encadena 5 aciertos seguidos',
    test: (c) => c.maxStreak >= 5 },
  { id: 'reviewer', icon: '🔁', title: 'Repasador',
    desc: 'Completa una sesión de repaso',
    test: (c) => c.won && c.isReview },
  { id: 'words25', icon: '📚', title: 'Vocabulario', desc: 'Aprende 25 palabras',
    test: (c) => learnedCount(c.progress) >= 25 },
  { id: 'words100', icon: '🎓', title: 'Políglota', desc: 'Aprende 100 palabras',
    test: (c) => learnedCount(c.progress) >= 100 },
  { id: 'tier1', icon: '🥉', title: 'Base sólida',
    desc: 'Supera los 6 primeros niveles',
    test: (c) => tierComplete(c.progress, 0) },
  { id: 'coins500', icon: '🪙', title: 'Monedero', desc: 'Acumula 500 monedas',
    test: (c) => c.progress.coins >= 500 },
];

/**
 * Returns the ids of achievements newly satisfied by `ctx` that were not
 * already unlocked in the progress. Does not mutate anything.
 */
export function newlyUnlocked(ctx: AchievementContext): string[] {
  return ACHIEVEMENTS
    .filter((a) => !ctx.progress.achievements[a.id] && a.test(ctx))
    .map((a) => a.id);
}
