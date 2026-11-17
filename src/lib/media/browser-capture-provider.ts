import {
  IMediaCaptureProvider,
  MediaDeviceOption,
  CaptureStatus,
  MediaCaptureOptions,
  ResolutionPreset,
  RESOLUTION_PRESETS,
} from "./types";

export class StandardBrowserMediaCapture implements IMediaCaptureProvider {
  private stream: MediaStream | null = null;
  private status: CaptureStatus = "idle";
  private currentOptions: MediaCaptureOptions = {
    resolution: "720p",
    noiseSuppression: true,
    echoCancellation: true,
  };

  public isSupported(): boolean {
    return (
      typeof window !== "undefined" &&
      !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    );
  }

  public getStatus(): CaptureStatus {
    return this.status;
  }

  public getStream(): MediaStream | null {
    return this.stream;
  }

  /**
   * Enumerates connected video and audio devices with automatic Logitech detection.
   */
  public async getAvailableDevices(): Promise<{
    videoDevices: MediaDeviceOption[];
    audioDevices: MediaDeviceOption[];
  }> {
    if (!this.isSupported()) {
      return { videoDevices: [], audioDevices: [] };
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices: MediaDeviceOption[] = [];
      const audioDevices: MediaDeviceOption[] = [];

      let videoIndex = 1;
      let audioIndex = 1;

      for (const device of devices) {
        const rawLabel = device.label || "";
        const isLogitech = /logi|logitech|c920|c270|c922|brio|quickcam/i.test(rawLabel);

        if (device.kind === "videoinput") {
          const fallbackLabel = isLogitech
            ? `Webcam Logitech USB HD (${videoIndex})`
            : `Câmera de Vídeo ${videoIndex}`;

          videoDevices.push({
            deviceId: device.deviceId,
            label: rawLabel || fallbackLabel,
            kind: "videoinput",
            isLogitech,
          });
          videoIndex++;
        } else if (device.kind === "audioinput") {
          const fallbackLabel = isLogitech
            ? `Microfone Logitech USB (${audioIndex})`
            : `Microfone ${audioIndex}`;

          audioDevices.push({
            deviceId: device.deviceId,
            label: rawLabel || fallbackLabel,
            kind: "audioinput",
            isLogitech,
          });
          audioIndex++;
        }
      }

      // Sort so that Logitech devices appear first in selection
      videoDevices.sort((a, b) => (b.isLogitech ? 1 : 0) - (a.isLogitech ? 1 : 0));
      audioDevices.sort((a, b) => (b.isLogitech ? 1 : 0) - (a.isLogitech ? 1 : 0));

      return { videoDevices, audioDevices };
    } catch (err) {
      console.error("Erro ao enumerar dispositivos de mídia:", err);
      return { videoDevices: [], audioDevices: [] };
    }
  }

  /**
   * Initializes user media stream according to resolution and device constraints.
   */
  public async start(options: MediaCaptureOptions = {}): Promise<MediaStream> {
    if (!this.isSupported()) {
      this.status = "unsupported";
      throw new Error(
        "Seu navegador não oferece suporte à captura de câmera via MediaDevices API."
      );
    }

    this.status = "requesting_permission";
    this.currentOptions = { ...this.currentOptions, ...options };

    const preset = RESOLUTION_PRESETS[this.currentOptions.resolution || "720p"];

    const videoConstraints: MediaTrackConstraints = {
      width: { ideal: preset.width },
      height: { ideal: preset.height },
      frameRate: { ideal: preset.idealFps, max: 30 },
    };

    if (this.currentOptions.videoDeviceId) {
      videoConstraints.deviceId = { exact: this.currentOptions.videoDeviceId };
    }

    const audioConstraints: MediaTrackConstraints = {
      echoCancellation: this.currentOptions.echoCancellation ?? true,
      noiseSuppression: this.currentOptions.noiseSuppression ?? true,
      autoGainControl: true,
    };

    if (this.currentOptions.audioDeviceId) {
      audioConstraints.deviceId = { exact: this.currentOptions.audioDeviceId };
    }

    try {
      this.stop(); // Stop any previous stream before requesting new one

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: audioConstraints,
      });

      this.stream = newStream;
      this.status = "active";
      return newStream;
    } catch (error: unknown) {
      this.status = "error";
      throw this.formatMediaError(error);
    }
  }

  public stop(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      this.stream = null;
    }
    this.status = "idle";
  }

  public async switchVideoDevice(deviceId: string): Promise<MediaStream> {
    this.currentOptions.videoDeviceId = deviceId;
    return this.start(this.currentOptions);
  }

  public async switchAudioDevice(deviceId: string): Promise<MediaStream> {
    this.currentOptions.audioDeviceId = deviceId;
    return this.start(this.currentOptions);
  }

  public async changeResolution(preset: ResolutionPreset): Promise<MediaStream> {
    this.currentOptions.resolution = preset;
    const config = RESOLUTION_PRESETS[preset];

    const videoTrack = this.stream?.getVideoTracks()[0];
    if (videoTrack && videoTrack.applyConstraints) {
      try {
        await videoTrack.applyConstraints({
          width: { ideal: config.width },
          height: { ideal: config.height },
          frameRate: { ideal: config.idealFps },
        });
        return this.stream!;
      } catch {
        // If track re-constraint fails, restart stream
        return this.start(this.currentOptions);
      }
    }

    return this.start(this.currentOptions);
  }

  private formatMediaError(error: unknown): Error {
    if (error instanceof DOMException) {
      switch (error.name) {
        case "NotAllowedError":
        case "PermissionDeniedError":
          return new Error(
            "Permissão de acesso à câmera e microfone negada. Autorize o acesso no seu navegador."
          );
        case "NotFoundError":
        case "DevicesNotFoundError":
          return new Error(
            "Nenhuma câmera ou microfone compatível foi encontrado. Conecte sua webcam Logitech USB."
          );
        case "NotReadableError":
        case "TrackStartError":
          return new Error(
            "A câmera USB já está sendo utilizada por outro programa (Skype, Zoom, Teams ou outro navegador)."
          );
        case "OverconstrainedError":
          return new Error(
            "A resolução solicitada (720p) não é suportada por esta câmera. Reduza a qualidade nas opções."
          );
        default:
          return new Error(`Erro ao acessar mídia: ${error.message}`);
      }
    }
    return error instanceof Error ? error : new Error("Erro desconhecido na captura de mídia.");
  }
}

/**
 * Android USB OTG Media Capture Bridge (Future Extension Abstraction)
 * Prepares the architecture for WebUSB / UVC driver connection when Android standard browsers
 * do not expose external USB webcams via getUserMedia.
 */
export class AndroidUsbOtgMediaCaptureProvider extends StandardBrowserMediaCapture {
  public static isAndroidDevice(): boolean {
    if (typeof window === "undefined") return false;
    return /Android/i.test(navigator.userAgent);
  }

  public static isWebUsbSupported(): boolean {
    if (typeof window === "undefined") return false;
    return !!(navigator as unknown as { usb?: unknown }).usb;
  }
}

/**
 * Media Capture Factory: returns standard capture provider with environment capability checks.
 */
export function createMediaCaptureProvider(): IMediaCaptureProvider {
  return new StandardBrowserMediaCapture();
}
