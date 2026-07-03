/**
 * @fileoverview Infra: input capture. Touch swipes are the primary input
 * (mobile-first); keyboard (physical codes) and gamepad remain as secondary
 * methods. Every method produces the same {@link Command} stream.
 */
import { Command } from '../engine/level-run';

/** Pixels a finger must travel before a swipe fires. Lower = snappier. */
const SWIPE_PX = 14;
/** Max duration (ms) of a touch for it to count as a tap (= jump). */
const TAP_MS = 220;

const KEY_BIND: Record<string, Command> = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'jump', KeyW: 'jump', Space: 'jump',
  ArrowDown: 'slide', KeyS: 'slide',
  Escape: 'pause', KeyP: 'pause',
};
const PAD_BIND: Record<number, Command> = {
  14: 'left', 15: 'right', 0: 'jump', 12: 'jump', 1: 'slide', 13: 'slide', 9: 'pause',
};

/**
 * Turns touch / keyboard / gamepad events into a queued list of commands,
 * drained once per frame by the game loop.
 *
 * Touch model: **chained swipes** — after a swipe fires, the origin resets to
 * the current finger position, so the player can move left and then jump in
 * one continuous drag without lifting the finger. A short touch with no
 * swipe is a tap = jump.
 */
export class GameInput {
  /** Optional observer for every recognized gesture (used for haptics). */
  onGesture: ((cmd: Command) => void) | null = null;

  private queue: Command[] = [];
  private padPrev = new Set<number>();
  private stickPrev = 0;

  private readonly onKeyDown = (e: KeyboardEvent) => {
    const c = KEY_BIND[e.code];
    if (c) { this.queue.push(c); e.preventDefault(); }
  };
  private onTouchStart!: (e: TouchEvent) => void;
  private onTouchMove!: (e: TouchEvent) => void;
  private onTouchEnd!: (e: TouchEvent) => void;

  /** @param target Element that receives the touch listeners (whole screen). */
  constructor(private target: HTMLElement) {
    addEventListener('keydown', this.onKeyDown);

    let ox = 0, oy = 0;          // current gesture origin (resets after each swipe)
    let startAt = 0;             // touchstart timestamp
    let fired = false;           // did any swipe fire during this touch?

    this.onTouchStart = (e) => {
      const t = e.changedTouches[0];
      ox = t.clientX; oy = t.clientY;
      startAt = performance.now();
      fired = false;
    };
    this.onTouchMove = (e) => {
      const t = e.changedTouches[0];
      const dx = t.clientX - ox, dy = t.clientY - oy;
      if (Math.hypot(dx, dy) < SWIPE_PX) return;
      const cmd: Command = Math.abs(dx) > Math.abs(dy)
        ? (dx > 0 ? 'right' : 'left')
        : (dy > 0 ? 'slide' : 'jump');
      this.push(cmd);
      fired = true;
      // chain: next swipe measures from here, no need to lift the finger
      ox = t.clientX; oy = t.clientY;
    };
    this.onTouchEnd = () => {
      if (!fired && performance.now() - startAt < TAP_MS) this.push('jump');
    };
    target.addEventListener('touchstart', this.onTouchStart, { passive: true });
    target.addEventListener('touchmove', this.onTouchMove, { passive: true });
    target.addEventListener('touchend', this.onTouchEnd, { passive: true });
  }

  /** Removes every listener. Call from `ngOnDestroy`. */
  dispose(): void {
    removeEventListener('keydown', this.onKeyDown);
    this.target.removeEventListener('touchstart', this.onTouchStart);
    this.target.removeEventListener('touchmove', this.onTouchMove);
    this.target.removeEventListener('touchend', this.onTouchEnd);
  }

  /** Polls gamepad state with edge detection. Call once per frame. */
  pollGamepad(): void {
    for (const gp of navigator.getGamepads?.() ?? []) {
      if (!gp) continue;
      const now = new Set<number>();
      gp.buttons.forEach((b, i) => { if (b.pressed && PAD_BIND[i] !== undefined) now.add(i); });
      for (const i of now) if (!this.padPrev.has(i)) this.push(PAD_BIND[i]);
      this.padPrev = now;
      const x = gp.axes[0] || 0;
      const zone = x < -0.5 ? -1 : x > 0.5 ? 1 : 0;
      if (zone !== 0 && zone !== this.stickPrev) this.push(zone < 0 ? 'left' : 'right');
      this.stickPrev = zone;
    }
  }

  /** Returns the queued commands and clears the queue. */
  drain(): Command[] {
    const q = this.queue;
    this.queue = [];
    return q;
  }

  private push(cmd: Command): void {
    this.queue.push(cmd);
    this.onGesture?.(cmd);
  }
}
