import { CryDetectionState } from "@/types/webrtc";

export interface CryDetectionResult {
  state: CryDetectionState;
  probability: number; // 0.0 to 1.0
  fundamentalFrequencyHz?: number;
  harmonicEnergyRatio: number;
  continuousDurationMs: number;
  timestamp: number;
}

export interface CryDetectorConfig {
  sensitivity: number; // 10 to 100
  minDurationMs: number; // Time in ms cry must persist to trigger alert (e.g., 1500ms)
  silenceThresholdMs: number; // Time in ms of quiet before clearing alert (e.g., 3000ms)
}

export interface ICryDetector {
  initialize(audioTrack: MediaStreamTrack): Promise<void>;
  updateConfig(config: Partial<CryDetectorConfig>): void;
  onDetection(callback: (result: CryDetectionResult) => void): void;
  dispose(): void;
}
