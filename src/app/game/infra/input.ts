// Infra: keyboard (physical codes) + touch swipes + gamepad → command events.
import { Command } from '../engine/level-run';

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

export class GameInput {
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

  constructor(private target: HTMLElement) {
    addEventListener('keydown', this.onKeyDown);

    // Swipe detection (whole screen), tap = jump.
    let sx = 0, sy = 0, st = 0, moved = false;
    this.onTouchStart = (e) => {
      const t = e.changedTouches[0];
      sx = t.clientX; sy = t.clientY; st = performance.now(); moved = false;
    };
    this.onTouchMove = (e) => {
      const t = e.changedTouches[0];
      const dx = t.clientX - sx, dy = t.clientY - sy;
      if (!moved && Math.hypot(dx, dy) > 16) {
        moved = true;
        if (Math.abs(dx) > Math.abs(dy)) this.queue.push(dx > 0 ? 'right' : 'left');
        else this.queue.push(dy > 0 ? 'slide' : 'jump');
      }
    };
    this.onTouchEnd = () => {
      if (!moved && performance.now() - st < 250) this.queue.push('jump');
    };
    target.addEventListener('touchstart', this.onTouchStart, { passive: true });
    target.addEventListener('touchmove', this.onTouchMove, { passive: true });
    target.addEventListener('touchend', this.onTouchEnd, { passive: true });
  }

  dispose(): void {
    removeEventListener('keydown', this.onKeyDown);
    this.target.removeEventListener('touchstart', this.onTouchStart);
    this.target.removeEventListener('touchmove', this.onTouchMove);
    this.target.removeEventListener('touchend', this.onTouchEnd);
  }

  // Gamepad edge detection, called once per frame.
  pollGamepad(): void {
    for (const gp of navigator.getGamepads?.() ?? []) {
      if (!gp) continue;
      const now = new Set<number>();
      gp.buttons.forEach((b, i) => { if (b.pressed && PAD_BIND[i] !== undefined) now.add(i); });
      for (const i of now) if (!this.padPrev.has(i)) this.queue.push(PAD_BIND[i]);
      this.padPrev = now;
      const x = gp.axes[0] || 0;
      const zone = x < -0.5 ? -1 : x > 0.5 ? 1 : 0;
      if (zone !== 0 && zone !== this.stickPrev) this.queue.push(zone < 0 ? 'left' : 'right');
      this.stickPrev = zone;
    }
  }

  drain(): Command[] {
    const q = this.queue;
    this.queue = [];
    return q;
  }
}
