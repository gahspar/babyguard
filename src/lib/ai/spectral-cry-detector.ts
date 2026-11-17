import {
  ICryDetector,
  CryDetectionResult,
  CryDetectorConfig,
} from "./cry-detector-interface";
import { CryDetectionState } from "@/types/webrtc";

export class SpectralInfantCryDetector implements ICryDetector {
  private config: CryDetectorConfig = {
    sensitivity: 70,
    minDurationMs: 1500,
    silenceThresholdMs: 3000,
  };

  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private animFrameId: number | null = null;
  private listeners: ((result: CryDetectionResult) => void)[] = [];

  // Temporal state tracking
  private currentState: CryDetectionState = "silence";
  private cryStartTime: number | null = null;
  private lastCrySeenTime = 0;

  public updateConfig(config: Partial<CryDetectorConfig>): void {
    this.config = { ...this.config, ...config };
  }

  public onDetection(callback: (result: CryDetectionResult) => void): void {
    this.listeners.push(callback);
  }

  public async initialize(audioTrack: MediaStreamTrack): Promise<void> {
    this.dispose();

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (!AudioCtx) {
      console.warn("Web Audio API não suportada neste navegador.");
      return;
    }

    this.audioContext = new AudioCtx();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 1024;
    this.analyser.smoothingTimeConstant = 0.6;

    const stream = new MediaStream([audioTrack]);
    this.source = this.audioContext.createMediaStreamSource(stream);
    this.source.connect(this.analyser);

    const bufferLength = this.analyser.frequencyBinCount;
    const frequencyData = new Float32Array(bufferLength);
    const sampleRate = this.audioContext.sampleRate;
    const binSize = sampleRate / this.analyser.fftSize;

    const analyzeLoop = () => {
      if (!this.analyser) return;

      this.analyser.getFloatFrequencyData(frequencyData);

      const result = this.processSpectralFrame(frequencyData, binSize);
      this.notifyListeners(result);

      this.animFrameId = requestAnimationFrame(analyzeLoop);
    };

    analyzeLoop();
  }

  /**
   * Evaluates acoustic energy distribution in infant cry specific formant bands:
   * Infant cry typical F0: 400Hz - 650Hz
   * First harmonic clusters: 1200Hz - 3500Hz
   */
  public processSpectralFrame(
    frequencyData: Float32Array,
    binSize: number
  ): CryDetectionResult {
    const now = Date.now();

    // 1. Calculate energy across critical frequency bands
    let lowEnergy = 0; // < 300Hz (thumps, fans, traffic)
    let f0Energy = 0; // 400Hz - 650Hz (Infant vocal fundamental)
    let formantEnergy = 0; // 1200Hz - 3500Hz (Vocal tract resonance)
    let highEnergy = 0; // > 5000Hz (hiss, white noise)
    let totalEnergy = 0;

    let peakMagnitude = -Infinity;
    let peakBin = 0;

    for (let i = 0; i < frequencyData.length; i++) {
      const freq = i * binSize;
      const db = frequencyData[i]; // typically -100 to 0 dB
      if (db < -80) continue; // Noise floor cutoff

      // Convert dB to linear power scale
      const power = Math.pow(10, db / 10);
      totalEnergy += power;

      if (db > peakMagnitude) {
        peakMagnitude = db;
        peakBin = i;
      }

      if (freq < 300) {
        lowEnergy += power;
      } else if (freq >= 400 && freq <= 650) {
        f0Energy += power;
      } else if (freq >= 1200 && freq <= 3500) {
        formantEnergy += power;
      } else if (freq > 5000) {
        highEnergy += power;
      }
    }

    const fundamentalFreq = peakBin * binSize;

    // 2. Compute Infant Cry Harmonic Energy Ratio
    // Cry signal concentrates energy in (F0 + Formants) relative to rumble and hiss
    const infantCryBandEnergy = f0Energy + formantEnergy;
    const noiseBandEnergy = lowEnergy * 1.5 + highEnergy + 1e-6;
    const harmonicRatio = infantCryBandEnergy / (infantCryBandEnergy + noiseBandEnergy);

    // Dynamic threshold modified by sensitivity (10 - 100)
    // Higher sensitivity lowers threshold from 0.70 down to 0.40
    const threshold = 0.75 - (this.config.sensitivity / 100) * 0.35;
    const minPower = 0.001; // Minimum loudness to consider

    const isInstantCry =
      totalEnergy > minPower &&
      harmonicRatio > threshold &&
      fundamentalFreq >= 350 &&
      fundamentalFreq <= 900;

    // 3. Temporal State Machine
    let continuousDurationMs = 0;

    if (isInstantCry) {
      this.lastCrySeenTime = now;
      if (!this.cryStartTime) {
        this.cryStartTime = now;
      }
      continuousDurationMs = now - this.cryStartTime;

      if (continuousDurationMs >= this.config.minDurationMs) {
        this.currentState = "active_alert";
      } else if (continuousDurationMs >= 600) {
        this.currentState = "cry_detected";
      } else {
        this.currentState = "possible_cry";
      }
    } else {
      // Check silence window
      const timeSinceLastCry = now - this.lastCrySeenTime;
      if (timeSinceLastCry > this.config.silenceThresholdMs) {
        this.cryStartTime = null;
        this.currentState = "silence";
        continuousDurationMs = 0;
      } else {
        // Keep previous alert state until silence window expires
        continuousDurationMs = this.cryStartTime ? now - this.cryStartTime : 0;
      }
    }

    const probability = Math.min(1.0, Math.max(0.0, harmonicRatio));

    return {
      state: this.currentState,
      probability: Math.round(probability * 100) / 100,
      fundamentalFrequencyHz: Math.round(fundamentalFreq),
      harmonicEnergyRatio: Math.round(harmonicRatio * 100) / 100,
      continuousDurationMs,
      timestamp: now,
    };
  }

  private notifyListeners(result: CryDetectionResult): void {
    for (const listener of this.listeners) {
      listener(result);
    }
  }

  public dispose(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }
    if (this.audioContext && this.audioContext.state !== "closed") {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    this.currentState = "silence";
    this.cryStartTime = null;
  }
}

export function createCryDetector(): ICryDetector {
  return new SpectralInfantCryDetector();
}
