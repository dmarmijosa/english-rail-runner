/**
 * @fileoverview Infra: English pronunciation via the Web Speech API.
 * Free and offline-capable on iOS/Android WebViews — no external service.
 * Backlog item "Pronunciación TTS" (tasks/backlog.md).
 */

/**
 * Thin wrapper around `speechSynthesis` that speaks English words/phrases.
 * Prefers an `en-*` voice when available; silently no-ops when the API is
 * missing (old WebViews) so callers never need to guard.
 */
export class Speech {
  private synth: SpeechSynthesis | null =
    typeof speechSynthesis !== 'undefined' ? speechSynthesis : null;
  private voice: SpeechSynthesisVoice | null = null;

  constructor() {
    // Voices load asynchronously on most platforms.
    this.pickVoice();
    this.synth?.addEventListener?.('voiceschanged', () => this.pickVoice());
  }

  /** True when the platform can speak. */
  get available(): boolean { return this.synth !== null; }

  /**
   * Speaks `text` in English, cancelling any previous utterance so quick
   * consecutive answers never queue up.
   * @param text English word or phrase to pronounce.
   * @param rate Speaking rate (1 = normal); slightly slow by default for learners.
   */
  speak(text: string, rate = 0.95): void {
    if (!this.synth) return;
    try {
      this.synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      u.rate = rate;
      if (this.voice) u.voice = this.voice;
      this.synth.speak(u);
    } catch { /* speech is best-effort */ }
  }

  private pickVoice(): void {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    this.voice = voices.find((v) => v.lang.startsWith('en') && v.localService)
      ?? voices.find((v) => v.lang.startsWith('en'))
      ?? null;
  }
}
