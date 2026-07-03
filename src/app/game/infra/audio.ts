// Infra: WebAudio playback. Music ≈ −18 dBFS, SFX ≈ −11 dBFS (mix law).
const FILES: Record<string, string> = {
  music: 'assets/game/audio/music.mp3',
  jump: 'assets/game/audio/jump.mp3',
  correct: 'assets/game/audio/correct.mp3',
  wrong: 'assets/game/audio/wrong.mp3',
  coin: 'assets/game/audio/coin.mp3',
  levelup: 'assets/game/audio/levelup.mp3',
};
const GAIN: Record<string, number> = {
  music: 0.14, jump: 0.3, correct: 0.35, wrong: 0.3, coin: 0.25, levelup: 0.4,
};

export class Sound {
  private ctx: AudioContext | null = null;
  private buffers: Record<string, AudioBuffer> = {};
  private musicNode: AudioBufferSourceNode | null = null;
  enabled = true;

  // Must be called from a user gesture (browser autoplay policy).
  async unlock(): Promise<void> {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) { this.enabled = false; return; }
    this.ctx = new AC();
    await Promise.all(Object.entries(FILES).map(async ([k, url]) => {
      try {
        const res = await fetch(url);
        this.buffers[k] = await this.ctx!.decodeAudioData(await res.arrayBuffer());
      } catch { /* missing clip → silent */ }
    }));
  }

  play(name: string): void {
    if (!this.ctx || !this.buffers[name] || !this.enabled) return;
    const src = this.ctx.createBufferSource();
    const g = this.ctx.createGain();
    g.gain.value = GAIN[name] ?? 0.3;
    src.buffer = this.buffers[name];
    src.connect(g).connect(this.ctx.destination);
    src.start();
  }

  startMusic(): void {
    if (!this.ctx || !this.buffers['music'] || this.musicNode) return;
    const src = this.ctx.createBufferSource();
    const g = this.ctx.createGain();
    g.gain.value = GAIN['music'];
    src.buffer = this.buffers['music'];
    src.loop = true;
    src.connect(g).connect(this.ctx.destination);
    src.start();
    this.musicNode = src;
  }

  stopMusic(): void {
    if (this.musicNode) {
      try { this.musicNode.stop(); } catch { /* already stopped */ }
      this.musicNode = null;
    }
  }
}
