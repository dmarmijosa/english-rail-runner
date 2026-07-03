// Engine (application layer): one level run. Pure simulation over fixed
// timesteps — no DOM, no Three.js, no Angular. Emits events through `hooks`.
import { LevelDef, LevelConfig, levelConfig } from '../domain/curriculum';
import { Question, Rng, buildQuestions, mulberry32 } from '../domain/quiz';

export const ROOF = 2.6;
const GRAVITY = 40;
const JUMP_V = 12.2;
const RAMP_V = 15.5;
const LANE_SPEED = 14;       // lanes per second while switching (snappy)
const INVULN_MS = 1500;

export type PowerKind = 'shield' | 'magnet' | 'slow' | 'x2';
export type HeroState = 'run' | 'jump' | 'slide';
export type Command = 'left' | 'right' | 'jump' | 'slide' | 'pause';

export interface TrackEntity {
  type: 'coin' | 'crate' | 'frame' | 'ramp' | 'power';
  lane: number;
  d: number;
  h?: number;
  kind?: PowerKind;
  taken?: boolean;
}

export interface Gate { reveal: number; gate: number; resolved: boolean; }

export interface SignView { lane: number; d: number; text: string; state: 'normal' | 'correct' | 'wrong'; }

export interface WordPair { es: string; en: string; }

export interface RunResult {
  won: boolean;
  correct: number;
  total: number;
  coins: number;
  score: number;
  correctWords: WordPair[];
}

export interface ViewModel {
  s: number;
  speed: number;
  heroX: number;
  heroY: number;
  heroState: HeroState;
  heroRoll: number;
  entities: TrackEntity[];
  signs: (SignView | null)[];
  gantry: { d: number; text: string } | null;
  metaD: number | null;
  droneDist: number;
  effects: { slow: boolean; shake: number };
}

export interface RunHooks {
  onJump?(): void;
  onCoin?(total: number): void;
  onQuestion?(q: Question): void;
  onCorrect?(q: Question, mult: number): void;
  onWrong?(q: Question): void;
  onHeart?(hearts: number): void;
  onShieldSave?(): void;
  onObstacle?(kind: string): void;
  onRamp?(): void;
  onPower?(kind: PowerKind): void;
  onFinish?(result: RunResult): void;
  onFail?(result: RunResult): void;
}

export class LevelRun {
  readonly cfg: LevelConfig;
  readonly questions: Question[];
  private readonly rng: Rng;

  // hero state
  s = 0;
  lane = 0;
  heroX = 0;
  heroY = ROOF;
  private vy = 0;
  state: HeroState = 'run';
  private slideMs = 0;
  private invulnMs = 0;
  private jumpBufferMs = 0;

  // run state
  hearts = 3;
  coins = 0;
  score = 0;
  streak = 0;
  correct = 0;
  answered = 0;
  correctWords: WordPair[] = [];
  droneDist: number;
  power = { shield: false, magnetMs: 0, slowMs: 0, x2Ms: 0 };
  over = false;
  result: RunResult | null = null;
  private shakeMs = 0;

  entities: TrackEntity[] = [];
  gates: Gate[] = [];
  metaD = 0;
  qIndex = -1;
  gantry: { d: number; text: string } | null = null;
  signState: (SignView | null)[] = [null, null, null];

  constructor(private level: LevelDef, levelIndex: number, private hooks: RunHooks) {
    this.cfg = levelConfig(levelIndex);
    this.rng = mulberry32(level.id * 7919 + 13);
    this.questions = buildQuestions(level, level.id * 1337);
    this.droneDist = this.cfg.droneStart;
    this.layoutTrack();
  }

  private layoutTrack(): void {
    const { speed, questions, obstacleRate, rampRate, powerupCount } = this.cfg;
    const readDist = Math.max(55, speed * 3.8);   // ≥3.5 s reading window
    let d = 60;
    for (let q = 0; q < questions; q++) {
      const reveal = d;
      const gate = d + readDist;
      this.gates.push({ reveal, gate, resolved: false });
      const segStart = gate + 14;
      const segEnd = gate + 14 + 52;
      for (let cd = segStart; cd < segEnd; cd += 20) {
        const roll = this.rng();
        const lane = [-1, 0, 1][Math.floor(this.rng() * 3)];
        if (roll < rampRate) {
          this.entities.push({ type: 'ramp', lane, d: cd });
          for (let i = 0; i < 6; i++) {
            this.entities.push({ type: 'coin', lane, d: cd + 3 + i * 2.2, h: Math.sin((i / 5) * Math.PI) * 2.2 });
          }
        } else if (roll < rampRate + obstacleRate) {
          this.entities.push({ type: this.rng() < 0.5 ? 'crate' : 'frame', lane, d: cd });
        } else {
          for (let i = 0; i < 5; i++) {
            this.entities.push({ type: 'coin', lane, d: cd + i * 2.2, h: 0 });
          }
        }
      }
      d = segEnd + 10;
    }
    this.metaD = d + 40;
    const kinds: PowerKind[] = ['shield', 'magnet', 'slow', 'x2'];
    for (let i = 0; i < powerupCount; i++) {
      const g = this.gates[Math.floor(this.rng() * this.gates.length)];
      this.entities.push({
        type: 'power', kind: kinds[Math.floor(this.rng() * kinds.length)],
        lane: [-1, 0, 1][Math.floor(this.rng() * 3)],
        d: g.gate + 20 + this.rng() * 30,
      });
    }
  }

  speedNow(): number {
    let v = this.cfg.speed;
    if (this.power.slowMs > 0) v *= 0.55;
    return v;
  }

  update(dtMs: number, commands: Command[]): void {
    if (this.over) return;
    const dt = dtMs / 1000;

    for (const c of commands) {
      if (c === 'left' && this.lane > -1) this.lane--;
      else if (c === 'right' && this.lane < 1) this.lane++;
      else if (c === 'jump') this.jumpBufferMs = 150;
      else if (c === 'slide') {
        if (this.state === 'jump') { this.vy = -22; } // fast-fall slam
        else { this.state = 'slide'; this.slideMs = 600; }
      }
    }

    // buffered jump (cancels a slide — the player's last intent wins)
    if (this.jumpBufferMs > 0) {
      this.jumpBufferMs -= dtMs;
      if (this.state !== 'jump') {
        this.state = 'jump'; this.vy = JUMP_V; this.jumpBufferMs = 0;
        this.slideMs = 0;
        this.hooks.onJump?.();
      }
    }

    // vertical physics
    if (this.state === 'jump') {
      this.vy -= GRAVITY * dt;
      this.heroY += this.vy * dt;
      if (this.heroY <= ROOF) { this.heroY = ROOF; this.vy = 0; this.state = 'run'; }
    } else if (this.state === 'slide') {
      this.slideMs -= dtMs;
      if (this.slideMs <= 0) this.state = 'run';
    }

    // lane easing
    const dx = this.lane - this.heroX;
    const maxMove = LANE_SPEED * dt;
    this.heroX += Math.abs(dx) <= maxMove ? dx : Math.sign(dx) * maxMove;

    // advance
    this.s += this.speedNow() * dt;

    // timers
    this.invulnMs = Math.max(0, this.invulnMs - dtMs);
    this.shakeMs = Math.max(0, this.shakeMs - dtMs);
    this.power.magnetMs = Math.max(0, this.power.magnetMs - dtMs);
    this.power.slowMs = Math.max(0, this.power.slowMs - dtMs);
    this.power.x2Ms = Math.max(0, this.power.x2Ms - dtMs);
    // drone slowly falls back
    this.droneDist = Math.min(this.cfg.droneStart, this.droneDist + 0.4 * dt);

    this.updateQuestions();
    this.updateCollisions();

    // finish line
    if (this.s >= this.metaD) {
      this.over = true;
      this.result = {
        won: true, correct: this.correct, total: this.questions.length,
        coins: this.coins, score: this.score, correctWords: this.correctWords,
      };
      this.hooks.onFinish?.(this.result);
    }
    // drone catch
    if (this.droneDist <= 1.2) this.fail();
  }

  private updateQuestions(): void {
    const next = this.qIndex + 1;
    if (next < this.gates.length && this.s >= this.gates[next].reveal - 2) {
      this.qIndex = next;
      const q = this.questions[next];
      const gate = this.gates[next];
      this.gantry = { d: gate.gate - 6, text: q.es };
      this.signState = q.options.map((text, i) => ({
        lane: i - 1, d: gate.gate, text, state: 'normal' as const,
      }));
      this.hooks.onQuestion?.(q);
    }
    if (this.qIndex >= 0) {
      const gate = this.gates[this.qIndex];
      if (!gate.resolved && this.s >= gate.gate) {
        gate.resolved = true;
        const q = this.questions[this.qIndex];
        this.answered++;
        // the player's chosen lane (intent), not the eased position — a switch
        // pressed just before the gate must count
        const heroLane = this.lane;
        const ok = heroLane === q.correctLane;
        for (const sgn of this.signState) {
          if (!sgn) continue;
          if (sgn.lane === q.correctLane) sgn.state = 'correct';
          else if (sgn.lane === heroLane) sgn.state = 'wrong';
        }
        if (ok) {
          this.correct++;
          this.streak++;
          const mult = Math.min(this.streak, 5) * (this.power.x2Ms > 0 ? 2 : 1);
          this.score += 100 * mult;
          this.coins += 5;
          this.droneDist = Math.min(this.cfg.droneStart, this.droneDist + 4);
          this.correctWords.push({ es: q.es, en: q.en });
          this.hooks.onCorrect?.(q, mult);
        } else {
          this.streak = 0;
          this.droneDist -= 8;
          this.hurt();
          this.hooks.onWrong?.(q);
        }
        // clear the phrase shortly after the gate
        const runRef = this;
        setTimeout(() => {
          if (!runRef.over && runRef.qIndex >= 0 && runRef.gates[runRef.qIndex].resolved) {
            runRef.gantry = null;
            runRef.signState = [null, null, null];
          }
        }, 1200);
      }
    }
  }

  private hurt(): void {
    if (this.invulnMs > 0) return;
    if (this.power.shield) {
      this.power.shield = false;
      this.hooks.onShieldSave?.();
      this.invulnMs = INVULN_MS;
      return;
    }
    this.hearts--;
    this.invulnMs = INVULN_MS;
    this.shakeMs = 350;
    this.hooks.onHeart?.(this.hearts);
    if (this.hearts <= 0) this.fail();
  }

  private fail(): void {
    if (this.over) return;
    this.over = true;
    this.result = {
      won: false, correct: this.correct, total: this.questions.length,
      coins: 0, score: this.score, correctWords: this.correctWords,
    };
    this.hooks.onFail?.(this.result);
  }

  private updateCollisions(): void {
    const heroLane = this.heroX;
    const jumpH = this.heroY - ROOF;
    for (const e of this.entities) {
      if (e.taken) continue;
      const dz = e.d - this.s;
      // magnet attracts coins early
      if (e.type === 'coin' && this.power.magnetMs > 0 && dz > 0 && dz < 7 && Math.abs(e.lane - heroLane) <= 1.2) {
        e.taken = true; this.coins++; this.hooks.onCoin?.(this.coins); continue;
      }
      if (Math.abs(dz) > 0.9) continue;
      if (Math.abs(e.lane - heroLane) > 0.5) continue;
      switch (e.type) {
        case 'coin': {
          const coinY = e.h || 0;
          if (Math.abs(jumpH - coinY) < 1.3) {
            e.taken = true; this.coins++; this.hooks.onCoin?.(this.coins);
          }
          break;
        }
        case 'crate':
          if (jumpH < 1.45) { e.taken = true; this.hurt(); this.droneDist -= 4; this.hooks.onObstacle?.('crate'); }
          break;
        case 'frame':
          if (this.state !== 'slide' && jumpH < 1.7) { e.taken = true; this.hurt(); this.droneDist -= 4; this.hooks.onObstacle?.('frame'); }
          break;
        case 'ramp':
          if (jumpH < 0.3) { this.state = 'jump'; this.vy = RAMP_V; this.hooks.onRamp?.(); }
          break;
        case 'power':
          e.taken = true;
          if (e.kind === 'shield') this.power.shield = true;
          else if (e.kind === 'magnet') this.power.magnetMs = 6000;
          else if (e.kind === 'slow') this.power.slowMs = 6000;
          else if (e.kind === 'x2') this.power.x2Ms = 10000;
          if (e.kind) this.hooks.onPower?.(e.kind);
          break;
      }
    }
  }

  view(): ViewModel {
    return {
      s: this.s,
      speed: this.speedNow(),
      heroX: this.heroX,
      heroY: this.heroY,
      heroState: this.state,
      heroRoll: (this.lane - this.heroX) * -0.35,
      entities: this.entities,
      signs: this.signState,
      gantry: this.gantry,
      metaD: this.metaD,
      droneDist: this.droneDist,
      effects: {
        slow: this.power.slowMs > 0,
        shake: this.shakeMs > 0 ? 0.18 : 0,
      },
    };
  }
}
