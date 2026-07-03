import {
  AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, NgZone,
  OnDestroy, computed, signal, viewChild,
} from '@angular/core';

import { STR } from './strings';
import { CURRICULUM, LevelDef } from './domain/curriculum';
import { Progress, recordResult, starsFor, unlocked } from './domain/progress';
import { Command, LevelRun, PowerKind, ROOF, RunResult, ViewModel } from './engine/level-run';
import { GameScene } from './infra/scene';
import { GameInput } from './infra/input';
import { Sound } from './infra/audio';
import { loadProgress, saveProgress } from './infra/storage';

type Mode = 'menu' | 'levels' | 'run' | 'paused' | 'summary' | 'failed';

interface LevelCard {
  index: number;
  id: number;
  unit: string;
  open: boolean;
  stars: number;
}

interface SummaryVM {
  result: RunResult;
  stars: number;
  isLast: boolean;
}

const STEP = 1000 / 60;

const IDLE_VIEW: ViewModel = {
  s: 0, speed: 8, heroX: 0, heroY: ROOF, heroState: 'run', heroRoll: 0,
  entities: [], signs: [null, null, null], gantry: null, metaD: null,
  droneDist: 99, effects: { slow: false, shake: 0 },
};

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
  readonly devInfo = signal('');

  private readonly progress = signal<Progress>(loadProgress());
  readonly learnedCount = computed(() => Object.keys(this.progress().learned).length);
  readonly levelCards = computed<LevelCard[]>(() => {
    const p = this.progress();
    return CURRICULUM.map((lvl, index) => ({
      index, id: lvl.id, unit: lvl.unit,
      open: unlocked(p, lvl.id),
      stars: p.stars[lvl.id] || 0,
    }));
  });
  readonly dev = new URLSearchParams(location.search).has('dev');

  // ——— engine ———
  private scene: GameScene | null = null;
  private input: GameInput | null = null;
  private readonly sound = new Sound();
  private run: LevelRun | null = null;
  private levelIndex = 0;
  private rafId = 0;
  private acc = 0;
  private last = 0;
  private prevFrame = 0;
  private idleS = 0;
  private frames = 0;
  private fpsAt = 0;
  private feedbackTimer: ReturnType<typeof setTimeout> | null = null;
  private powerTimer: ReturnType<typeof setTimeout> | null = null;
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

  constructor(private zone: NgZone) {}

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      this.scene = new GameScene(this.canvasRef().nativeElement);
      this.input = new GameInput(document.body);
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

  ngOnDestroy(): void {
    cancelAnimationFrame(this.rafId);
    removeEventListener('blur', this.onBlur);
    removeEventListener('pointerdown', this.onFirstGesture);
    removeEventListener('keydown', this.onFirstGesture);
    this.input?.dispose();
    this.scene?.dispose();
    this.sound.stopMusic();
    if (this.feedbackTimer) clearTimeout(this.feedbackTimer);
    if (this.powerTimer) clearTimeout(this.powerTimer);
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
  retry(): void { this.startLevel(this.levelIndex); }
  next(): void {
    if (this.levelIndex + 1 < CURRICULUM.length) this.startLevel(this.levelIndex + 1);
    else this.toMenu();
  }

  startLevel(index: number): void {
    const level: LevelDef = CURRICULUM[index];
    this.levelIndex = index;
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

    const z = (fn: () => void) => this.zone.run(fn);
    this.run = new LevelRun(level, index, {
      onJump: () => this.sound.play('jump'),
      onCoin: (n) => { z(() => this.coins.set(n)); this.sound.play('coin'); },
      onQuestion: (q) => z(() => this.phrase.set(q.es)),
      onCorrect: (_q, mult) => {
        this.sound.play('correct');
        z(() => {
          this.flash(`${STR.correct} +${100 * mult}`, 'good');
          this.score.set(this.run!.score);
          this.streak.set(this.run!.streak);
          this.coins.set(this.run!.coins);
        });
      },
      onWrong: (q) => {
        this.sound.play('wrong');
        z(() => {
          this.flash(`${STR.wrong} "${q.en}"`, 'bad');
          this.streak.set(0);
        });
      },
      onHeart: (n) => z(() => this.hearts.set(n)),
      onShieldSave: () => z(() => this.flash(STR.powerShield, 'good')),
      onRamp: () => this.sound.play('jump'),
      onPower: (kind) => z(() => this.showPower(kind)),
      onFinish: (result) => {
        this.sound.play('levelup');
        this.sound.stopMusic();
        z(() => {
          const stars = starsFor(result.correct, result.total);
          const updated = recordResult(
            this.progress(), level.id, result.correctWords.map((w) => w.en), stars, result.coins);
          this.progress.set(updated);
          saveProgress(updated);
          this.summary.set({ result, stars, isLast: this.levelIndex + 1 >= CURRICULUM.length });
          this.mode.set('summary');
        });
      },
      onFail: () => {
        this.sound.stopMusic();
        z(() => this.mode.set('failed'));
      },
    });
    this.mode.set('run');
    this.last = performance.now();
    this.acc = 0;
    if (this.audioUnlocked) this.sound.startMusic();
  }

  private flash(text: string, kind: 'good' | 'bad'): void {
    this.feedback.set({ text, kind });
    if (this.feedbackTimer) clearTimeout(this.feedbackTimer);
    this.feedbackTimer = setTimeout(() => this.zone.run(() => this.feedback.set(null)), 1400);
  }

  private showPower(kind: PowerKind): void {
    const map: Record<PowerKind, string> = {
      shield: STR.powerShield, magnet: STR.powerMagnet, slow: STR.powerSlow, x2: STR.powerX2,
    };
    this.powerLabel.set(map[kind]);
    if (this.powerTimer) clearTimeout(this.powerTimer);
    this.powerTimer = setTimeout(() => this.zone.run(() => this.powerLabel.set('')), 2200);
  }

  heartsDisplay(): string {
    const n = Math.max(0, this.hearts());
    return '❤️'.repeat(n) + '🖤'.repeat(Math.max(0, 3 - n));
  }

  starsDisplay(stars: number): string {
    return '★'.repeat(stars) + '☆'.repeat(3 - stars);
  }
}
