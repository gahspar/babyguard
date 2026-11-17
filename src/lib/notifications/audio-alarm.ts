/**
 * Web Audio Alarm Sound Synthesizer.
 * Generates warning alarms and status chimes directly via Web Audio API
 * without relying on external MP3/WAV files that could fail to load or be blocked.
 */

class AudioAlarmSynthesizer {
  private audioCtx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.audioCtx || this.audioCtx.state === "closed") {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
    }
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  /**
   * Urgent pulsating alarm for infant cry alert.
   */
  public playCryAlarm(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      const now = ctx.currentTime;

      // Frequency modulation 880Hz to 1200Hz
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.linearRampToValueAtTime(1200, now + 0.15);
      osc.frequency.linearRampToValueAtTime(880, now + 0.3);
      osc.frequency.linearRampToValueAtTime(1200, now + 0.45);
      osc.frequency.linearRampToValueAtTime(880, now + 0.6);

      // Volume envelope
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
      gain.gain.setValueAtTime(0.3, now + 0.55);
      gain.gain.linearRampToValueAtTime(0, now + 0.65);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.65);
    } catch (e) {
      console.warn("Falha ao tocar som de alarme de choro:", e);
    }
  }

  /**
   * Warning chime when camera or connection drops.
   */
  public playDisconnectChime(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      const now = ctx.currentTime;

      // Descending two-tone chime (600Hz -> 300Hz)
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.setValueAtTime(300, now + 0.2);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.45);
    } catch (e) {
      console.warn("Falha ao tocar som de desconexão:", e);
    }
  }

  /**
   * Positive chime when WebRTC connection is established/restored.
   */
  public playReconnectChime(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      const now = ctx.currentTime;

      // Ascending chime (440Hz -> 880Hz)
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(880, now + 0.15);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {
      console.warn("Falha ao tocar som de reconexão:", e);
    }
  }
}

export const audioAlarm = new AudioAlarmSynthesizer();
