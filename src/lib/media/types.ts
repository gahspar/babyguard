/**
 * Abstraction layer types for Media Capture in BabyGuard.
 * Designed to support standard browser getUserMedia now, and extend to Android USB OTG/WebUSB in the future.
 */

export type ResolutionPreset = "720p" | "480p" | "360p";

export interface ResolutionConfig {
  width: number;
  height: number;
  idealFps: number;
  label: string;
}

export const RESOLUTION_PRESETS: Record<ResolutionPreset, ResolutionConfig> = {
  "720p": { width: 1280, height: 720, idealFps: 30, label: "HD 720p (Nativo Logitech)" },
  "480p": { width: 854, height: 480, idealFps: 24, label: "SD 480p (Econômico)" },
  "360p": { width: 640, height: 360, idealFps: 15, label: "Eco 360p (Baixa Largura de Banda)" },
};

export interface MediaDeviceOption {
  deviceId: string;
  label: string;
  kind: "videoinput" | "audioinput";
  isLogitech: boolean;
}

export type CaptureStatus =
  | "idle"
  | "requesting_permission"
  | "active"
  | "paused"
  | "error"
  | "unsupported";

export interface MediaCaptureOptions {
  videoDeviceId?: string;
  audioDeviceId?: string;
  resolution?: ResolutionPreset;
  noiseSuppression?: boolean;
  echoCancellation?: boolean;
}

export interface IMediaCaptureProvider {
  isSupported(): boolean;
  getAvailableDevices(): Promise<{ videoDevices: MediaDeviceOption[]; audioDevices: MediaDeviceOption[] }>;
  start(options: MediaCaptureOptions): Promise<MediaStream>;
  stop(): void;
  switchVideoDevice(deviceId: string): Promise<MediaStream>;
  switchAudioDevice(deviceId: string): Promise<MediaStream>;
  changeResolution(preset: ResolutionPreset): Promise<MediaStream>;
  getStream(): MediaStream | null;
  getStatus(): CaptureStatus;
}
