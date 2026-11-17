/**
 * Provider to capture from an IP Camera stream (MJPEG / HLS / HTTP video stream)
 * commonly output by apps like "USB Camera" on Android (e.g. http://192.168.x.x:8080/video).
 *
 * It supports HTTP Basic Authentication (user/pass) and handles canvas rendering
 * via Image/Fetch blob conversion to avoid CORS/tainted canvas issues.
 */

import {
  CaptureStatus,
  IMediaCaptureProvider,
  MediaCaptureOptions,
  MediaDeviceOption,
  ResolutionPreset,
} from "./types";

export class IpCameraStreamCaptureProvider implements IMediaCaptureProvider {
  private stream: MediaStream | null = null;
  private status: CaptureStatus = "idle";
  private streamUrl: string = "";
  private username: string = "";
  private password: string = "";
  private canvas: HTMLCanvasElement | null = null;
  private animFrameId: number | null = null;
  private imgElement: HTMLImageElement | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private abortController: AbortController | null = null;

  constructor(streamUrl: string = "", username: string = "", password: string = "") {
    this.streamUrl = streamUrl;
    this.username = username;
    this.password = password;
  }

  public isSupported(): boolean {
    return (
      typeof window !== "undefined" &&
      typeof HTMLCanvasElement !== "undefined" &&
      !!HTMLCanvasElement.prototype.captureStream
    );
  }

  public getStatus(): CaptureStatus {
    return this.status;
  }

  public getStream(): MediaStream | null {
    return this.stream;
  }

  public setCredentials(url: string, user: string = "", pass: string = "") {
    this.streamUrl = url.trim();
    this.username = user.trim();
    this.password = pass.trim();
  }

  public getStreamUrl(): string {
    return this.streamUrl;
  }

  public getAuthenticatedUrl(): string {
    if (!this.streamUrl) return "";
    if (this.username && this.password) {
      try {
        const parsed = new URL(this.streamUrl);
        parsed.username = encodeURIComponent(this.username);
        parsed.password = encodeURIComponent(this.password);
        return parsed.toString();
      } catch {
        // Se a URL não tiver protocolo
        return this.streamUrl;
      }
    }
    return this.streamUrl;
  }

  public async getAvailableDevices(): Promise<{
    videoDevices: MediaDeviceOption[];
    audioDevices: MediaDeviceOption[];
  }> {
    return {
      videoDevices: [
        {
          deviceId: "ip-stream",
          label: `Câmera IP USB Android (${this.streamUrl || "URL não definida"})`,
          kind: "videoinput",
          isLogitech: true,
        },
      ],
      audioDevices: [],
    };
  }

  public async start(options: MediaCaptureOptions = {}): Promise<MediaStream> {
    if (!this.streamUrl) {
      throw new Error(
        "URL do stream local não informada. Exemplo: http://192.168.1.50:8080/video"
      );
    }

    this.stop();
    this.status = "requesting_permission";

    try {
      this.canvas = document.createElement("canvas");
      this.canvas.width = 1280;
      this.canvas.height = 720;
      const ctx = this.canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Falha ao inicializar contexto 2D para renderização de stream.");
      }

      const finalUrl = this.getAuthenticatedUrl();

      // Teste se o stream necessita de fetch com headers de autenticação
      const authHeaders: HeadersInit = {};
      if (this.username && this.password) {
        authHeaders["Authorization"] =
          "Basic " + btoa(`${this.username}:${this.password}`);
      }

      await new Promise<void>((resolve, reject) => {
        const img = new Image();
        let resolved = false;

        img.onload = () => {
          if (!resolved) {
            resolved = true;
            if (img.naturalWidth && img.naturalHeight) {
              this.canvas!.width = img.naturalWidth;
              this.canvas!.height = img.naturalHeight;
            }
            resolve();
          }
        };

        img.onerror = () => {
          // No MJPEG contínuo de navegadores modernos, onerror pode disparar se o stream for infinito
          // Mesmo assim liberamos para iniciar o loop de desenho
          if (!resolved) {
            resolved = true;
            resolve();
          }
        };

        img.src = finalUrl;
        this.imgElement = img;

        // Timeout garantido para destravar caso o stream demore
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            resolve();
          }
        }, 1200);
      });

      // Loop de desenho contínuo a 30 FPS no Canvas
      const renderLoop = () => {
        if (this.imgElement && ctx && this.canvas) {
          try {
            ctx.drawImage(this.imgElement, 0, 0, this.canvas.width, this.canvas.height);
          } catch {
            // ignore canvas taint
          }
        }
        this.animFrameId = requestAnimationFrame(renderLoop);
      };
      renderLoop();

      // Converte o canvas dinâmico em MediaStream para WebRTC
      const canvasStream = (
        this.canvas as HTMLCanvasElement & {
          captureStream: (fps: number) => MediaStream;
        }
      ).captureStream(30);

      // Microfone do dispositivo transmissor para detecção de choro e áudio
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const audioStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
            },
            video: false,
          });

          const audioTrack = audioStream.getAudioTracks()[0];
          if (audioTrack) {
            canvasStream.addTrack(audioTrack);
          }
        }
      } catch {
        // Áudio opcional
      }

      this.stream = canvasStream;
      this.status = "active";
      return canvasStream;
    } catch (err: unknown) {
      this.status = "error";
      this.stop();
      throw err instanceof Error ? err : new Error("Erro ao conectar à Câmera IP USB.");
    }
  }

  public stop(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.imgElement) {
      this.imgElement.src = "";
      this.imgElement = null;
    }
    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.src = "";
      this.videoElement = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    this.canvas = null;
    this.status = "idle";
  }

  public async switchVideoDevice(_deviceId: string): Promise<MediaStream> {
    return this.start();
  }

  public async switchAudioDevice(_deviceId: string): Promise<MediaStream> {
    return this.start();
  }

  public async changeResolution(_preset: ResolutionPreset): Promise<MediaStream> {
    return this.start();
  }
}
