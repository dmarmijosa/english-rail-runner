/**
 * @fileoverview UI layer: the single game page. Hosts the Three.js canvas,
 * runs the fixed-timestep loop outside NgZone, and renders every overlay
 * (menu, level select, HUD, summary, failed, paused) from Angular signals.
 * Mobile-first: touch gestures are the primary input, with haptic feedback.
 */
import {
  AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, NgZone,
  OnDestroy, computed, signal, viewChild,
} from '@angular/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

import { STR } from './strings';
import { CURRICULUM, LevelDef } from './domain/curriculum';
import { Progress, recordResult, starsFor, unlocked } from './domain/progress';
import {
  ALL_PAIRS, REVIEW_DIFFICULTY, REVIEW_LEVEL_ID, buildReviewLevel, reviewCount,
} from './domain/review';
import { Command, LevelRun, PowerKind, ROOF, RunResult, ViewModel } from './engine/level-run';
import { GameScene } from './infra/scene';
import { GameInput } from './infra/input';
import { Sound } from './infra/audio';
import { Speech } from './infra/tts';
import { loadProgress, saveProgress } from './infra/storage';

/** Top-level UI state of the page. */
type Mode = 'menu' | 'levels' | 'run' | 'paused' | 'summary' | 'failed';

/** Level-select card view model. */
interface LevelCard {
  index: number;
  id: number;
  unit: string;
  open: boolean;
  stars: number;
}

/** End-of-level summary view model. */
interface SummaryVM {
  result: RunResult;
  stars: number;
  isLast: boolean;
  isReview: boolean;
}

/** Fixed simulation step in ms (60 Hz). */
const STEP = 1000 / 60;
/** How long the gesture hint overlay stays on screen (ms). */
const HINT_MS = 4200;

/** Idle backdrop shown behind menus (gentle scroll, no entities). */
const IDLE_VIEW: ViewModel = {
  s: 0, speed: 8, heroX: 0, heroY: ROOF, heroState: 'run', heroRoll: 0,
  entities: [], signs: [null, null, null], gantry: null, metaD: null,
  droneDist: 99, effects: { slow: false, shake: 0 },
};

/**
 * The game page. Owns the engine instances ({@link LevelRun}, {@link GameScene},
 * {@link GameInput}, {@link Sound}, {@link Speech}) and exposes their state to
 * the template exclusively through signals (OnPush change detection).
 */
@Component({
  selector: 'app-game',
  standalone: true,
  templateUrl: './game.page.html',
  styleUrls: ['./game.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GamePage implements AfterViewInit, OnDestroy {
  readonly STR = STR;

  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('gameCanvas');

  // ——— UI state (signals) ———
  readonly mode = signal<Mode>('menu');
  readonly hearts = signal(3);
  readonly coins = signal(0);
  readonly score = signal(0);
  readonly streak = signal(0);
  readonly phrase = signal('');
  readonly feedback = signal<{ text: string; kind: 'good' | 'bad' } | null>(null);
  readonly powerLabel = signal('');
  readonly droneNear = signal(false);
  readonly levelId = signal(1);
  readonly unitName = signal('');
  readonly summary = signal<SummaryVM | null>(null);
  readonly showHint = signal(false);
  readonly reviewMode = signal(false);
  readonly devInfo = signal('');

  private readonly progress = signal<Progress>(loadProgress());
  /** Total distinct English words learned across all levels. */
  readonly learnedCount = computed(() => Object.keys(this.progress().learned).length);
  /** How many words are waiting in the review list. */
  readonly toReview = computed(() => reviewCount(this.progress()));
  /** Level-select cards derived from progress (locks + stars). */
  readonly levelCards = computed<LevelCard[]>(() => {
    const p = this.progress();
    return CURRICULUM.map((lvl, index) => ({
      index, id: lvl.id, unit: lvl.unit,
      open: unlocked(p, lvl.id),
      stars: p.stars[lvl.id] || 0,
    }));
  });
  /** Dev overlay enabled with `?dev=1`. */
  readonly dev = new URLSearchParams(location.search).has('dev');

  // ——— engine ———
  private scene: GameScene | null = null;
  private input: GameInput | null = null;
  private readonly sound = new Sound();
  private readonly speech = new Speech();
  private run: LevelRun | null = null;
  private levelIndex = 0;
  private isReviewRun = false;
  private rafId = 0;
  private acc = 0;
  private last = 0;
  private prevFrame = 0;
  private idleS = 0;
  private frames = 0;
  private fpsAt = 0;
  private feedbackTimer: ReturnType<typeof setTimeout> | null = null;
  private powerTimer: ReturnType<typeof setTimeout> | null = null;
  private hintTimer: ReturnType<typeof setTimeout> | null = null;
  private audioUnlocked = false;

  private readonly onBlur = () => {
    if (this.mode() === 'run') this.zone.run(() => this.mode.set('paused'));
  };
  private readonly onFirstGesture = async () => {
    removeEventListener('pointerdown', this.onFirstGesture);
    removeEventListener('keydown', this.onFirstGesture);
    if (this.audioUnlocked) return;
    this.audioUnlocked = true;
    await this.sound.unlock();
    if (this.mode() === 'run') this.sound.startMusic();
  };

  constructor(private zone: NgZone) {
    if (this.dev) {
      // dev-only hook for automated verification (?dev=1)
      const page = this;
      (window as unknown as { __rail?: unknown }).__rail = {
        startLevel: (i: number) => page.zone.run(() => page.startLevel(i)),
        get run() { return page['run']; },
      };
    }
  }

  /** Boots renderer + input and starts the rAF loop outside Angular. */
  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      this.scene = new GameScene(this.canvasRef().nativeElement);
      this.input = new GameInput(document.body);
      // gentle haptic tick on every recognized gesture (mobile feel)
      this.input.onGesture = () => {
        void Haptics.impact({ style: ImpactStyle.Light }).catch(() => undefined);
      };
      addEventListener('blur', this.onBlur);
      addEventListener('pointerdown', this.onFirstGesture);
      addEventListener('keydown', this.onFirstGesture);
      this.last = performance.now();
      this.fpsAt = this.last;
      const frame = (now: number) => {
        this.rafId = requestAnimationFrame(frame);
        this.tick(now);
      };
      this.rafId = requestAnimationFrame(frame);
    });
  }

  /** Symmetric cleanup of listeners, loop, audio and timers. */
  ngOnDestroy(): void {
    cancelAnimationFrame(this.rafId);
    removeEventListener('blur', this.onBlur);
    removeEventListener('pointerdown', this.onFirstGesture);
    removeEventListener('keydown', this.onFirstGesture);
    this.input?.dispose();
    this.scene?.dispose();
    this.sound.stopMusic();
    for (const t of [this.feedbackTimer, this.powerTimer, this.hintTimer]) {
      if (t) clearTimeout(t);
    }
  }

  // ——— fixed-timestep loop (runs outside Angular) ———
  private tick(now: number): void {
    this.acc += now - this.last;
    this.last = now;
    if (this.acc > 250) this.acc = 250; // spiral-of-death guard

    if (this.mode() === 'run' && this.run) {
      this.input!.pollGamepad();
      const cmds = this.input!.drain();
      if (cmds.includes('pause')) {
        this.zone.run(() => this.mode.set('paused'));
        this.acc = 0;
      } else {
        let pending: Command[] = cmds;
        while (this.acc >= STEP) {
          this.run.update(STEP, pending);
          pending = [];
          this.acc -= STEP;
        }
        const near = this.run.droneDist < 12;
        if (near !== this.droneNear()) this.zone.run(() => this.droneNear.set(near));
        if (this.run.gantry === null && this.phrase() !== '') {
          this.zone.run(() => this.phrase.set(''));
        }
      }
    } else {
      this.acc = 0;
      this.input?.drain();
      this.idleS += 0.14 * Math.min(now - this.prevFrame || 16, 50);
      IDLE_VIEW.s = this.idleS / 16;
    }

    const view = this.run && this.mode() !== 'menu' && this.mode() !== 'levels'
      ? this.run.view() : IDLE_VIEW;
    this.scene!.render(view, Math.min(now - (this.prevFrame || now), 50));
    this.prevFrame = now;

    if (this.dev && (this.frames++, now - this.fpsAt >= 500)) {
      const fps = Math.round(this.frames * 1000 / (now - this.fpsAt));
      this.frames = 0; this.fpsAt = now;
      const info = this.scene!.info();
      this.zone.run(() => this.devInfo.set(`${fps} fps · calls ${info.calls} · tris ${info.triangles}`));
    }
  }

  // ——— user actions ———
  showLevels(): void { this.mode.set('levels'); }

  toMenu(): void {
    this.mode.set('menu');
    this.run = null;
    this.sound.stopMusic();
  }

  resume(): void {
    this.mode.set('run');
    this.last = performance.now();
  }

  pause(): void { if (this.mode() === 'run') this.mode.set('paused'); }

  retry(): void {
    if (this.isReviewRun) this.startReview();
    else this.startLevel(this.levelIndex);
  }

  next(): void {
    if (this.levelIndex + 1 < CURRICULUM.length) this.startLevel(this.levelIndex + 1);
    else this.toMenu();
  }

  /** Pronounces an English word (used by the summary word chips). */
  say(text: string): void { this.speech.speak(text); }

  /**
   * Starts a curriculum level (new random seed each attempt).
   * @param index 0-based curriculum index.
   */
  startLevel(index: number): void {
    this.levelIndex = index;
    this.runLevel(CURRICULUM[index], index, false);
  }

  /**
   * Starts a review session built from the words the player has missed.
   * No-op when the review list is empty.
   */
  startReview(): void {
    const level = buildReviewLevel(this.progress());
    if (!level) return;
    this.runLevel(level, REVIEW_DIFFICULTY, true, ALL_PAIRS);
  }

  /**
   * Creates a fresh {@link LevelRun} and switches the page into run mode.
   * @param level          Level (curriculum or synthetic review) to play.
   * @param difficultyIndex Drives speed/hazard density (see levelConfig).
   * @param isReview       True for a review session (no curriculum stars).
   * @param distractorPool Optional wrong-answer pool (review uses the whole
   *                       vocabulary so short word sets still get 3 options).
   */
  private runLevel(
    level: LevelDef, difficultyIndex: number, isReview: boolean,
    distractorPool?: ReadonlyArray<readonly [string, string]>,
  ): void {
    this.isReviewRun = isReview;
    this.reviewMode.set(isReview);
    this.levelId.set(level.id);
    this.unitName.set(level.unit);
    this.hearts.set(3);
    this.coins.set(0);
    this.score.set(0);
    this.streak.set(0);
    this.phrase.set('');
    this.feedback.set(null);
    this.powerLabel.set('');
    this.droneNear.set(false);
    this.showHint.set(true);
    if (this.hintTimer) clearTimeout(this.hintTimer);
    this.hintTimer = setTimeout(() => this.zone.run(() => this.showHint.set(false)), HINT_MS);

    const z = (fn: () => void) => this.zone.run(fn);
    this.run = new LevelRun(level, difficultyIndex, {
      onJump: () => this.sound.play('jump'),
      onCoin: (n) => { z(() => this.coins.set(n)); this.sound.play('coin'); },
      onQuestion: (q) => z(() => this.phrase.set(q.es)),
      onCorrect: (q, mult) => {
        this.sound.play('correct');
        this.speech.speak(q.en); // pronounce what was just learned
        void Haptics.notification({ type: NotificationType.Success }).catch(() => undefined);
        z(() => {
          this.flash(`${STR.correct} +${100 * mult}`, 'good');
          this.score.set(this.run!.score);
          this.streak.set(this.run!.streak);
          this.coins.set(this.run!.coins);
        });
      },
      onWrong: (q) => {
        this.sound.play('wrong');
        void Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => undefined);
        z(() => {
          this.flash(`${STR.wrong} "${q.en}"`, 'bad');
          this.streak.set(0);
        });
      },
      onHeart: (n) => z(() => this.hearts.set(n)),
      onShieldSave: () => z(() => this.flash(STR.powerShield, 'good')),
      onObstacle: () => {
        void Haptics.impact({ style: ImpactStyle.Medium }).catch(() => undefined);
      },
      onRamp: () => this.sound.play('jump'),
      onPower: (kind) => z(() => this.showPower(kind)),
      onFinish: (result) => {
        this.sound.play('levelup');
        this.sound.stopMusic();
        z(() => {
          const stars = starsFor(result.correct, result.total);
          const updated = recordResult(
            this.progress(), isReview ? REVIEW_LEVEL_ID : level.id,
            result.correctWords, result.failedWords, stars, result.coins);
          this.progress.set(updated);
          saveProgress(updated);
          this.summary.set({
            result, stars, isReview,
            isLast: isReview || this.levelIndex + 1 >= CURRICULUM.length,
          });
          this.mode.set('summary');
        });
      },
      onFail: () => {
        this.sound.stopMusic();
        z(() => this.mode.set('failed'));
      },
    }, undefined, distractorPool);
    this.mode.set('run');
    this.last = performance.now();
    this.acc = 0;
    if (this.audioUnlocked) this.sound.startMusic();
  }

  /** Shows a transient center-screen feedback pill. */
  private flash(text: string, kind: 'good' | 'bad'): void {
    this.feedback.set({ text, kind });
    if (this.feedbackTimer) clearTimeout(this.feedbackTimer);
    this.feedbackTimer = setTimeout(() => this.zone.run(() => this.feedback.set(null)), 1400);
  }

  /** Shows the transient power-up label. */
  private showPower(kind: PowerKind): void {
    const map: Record<PowerKind, string> = {
      shield: STR.powerShield, magnet: STR.powerMagnet, slow: STR.powerSlow, x2: STR.powerX2,
    };
    this.powerLabel.set(map[kind]);
    if (this.powerTimer) clearTimeout(this.powerTimer);
    this.powerTimer = setTimeout(() => this.zone.run(() => this.powerLabel.set('')), 2200);
  }

  /** ❤️🖤 heart row for the HUD. */
  heartsDisplay(): string {
    const n = Math.max(0, this.hearts());
    return '❤️'.repeat(n) + '🖤'.repeat(Math.max(0, 3 - n));
  }

  /** ★★☆ star row for cards and the summary. */
  starsDisplay(stars: number): string {
    return '★'.repeat(stars) + '☆'.repeat(3 - stars);
  }
}
