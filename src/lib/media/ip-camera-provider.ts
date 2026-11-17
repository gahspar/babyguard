/**
 * Provider to capture from an IP Camera stream (MJPEG / HLS / HTTP video stream)
 * commonly output by apps like "USB Camera" on Android (e.g. http://192.168.x.x:8080/video).
 *
 * It uses an offscreen HTMLImageElement or HTMLVideoElement drawn onto a canvas,
 * generating a MediaStream via canvas.captureStream() to plug seamlessly into
 * WebRTC peer connection and cry detection.
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
  private canvas: HTMLCanvasElement | null = null;
  private animFrameId: number | null = null;
  private imgElement: HTMLImageElement | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private audioContext: AudioContext | null = null;
  private dummyAudioSource: OscillatorNode | null = null;

  constructor(streamUrl: string = "") {
    this.streamUrl = streamUrl;
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

  public setStreamUrl(url: string) {
    this.streamUrl = url.trim();
  }

  public getStreamUrl(): string {
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

      // MJPEG Stream Mode via Image tag
      const isMjpeg =
        this.streamUrl.includes(":8080") ||
        this.streamUrl.endsWith(".mjpg") ||
        this.streamUrl.endsWith("/video") ||
        !this.streamUrl.endsWith(".mp4");

      if (isMjpeg) {
        await new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          let loadedOnce = false;

          img.onload = () => {
            if (!loadedOnce) {
              loadedOnce = true;
              if (img.naturalWidth && img.naturalHeight) {
                this.canvas!.width = img.naturalWidth;
                this.canvas!.height = img.naturalHeight;
              }
              resolve();
            }
          };

          img.onerror = () => {
            // Em muitas câmeras IP o CORS bloqueia o evento onload do MJPEG,
            // mas a imagem continua alimentando o feed no canvas se renderizada continuamente.
            if (!loadedOnce) {
              loadedOnce = true;
              resolve();
            }
          };

          img.src = this.streamUrl;
          this.imgElement = img;

          // Timeout de segurança para iniciar renderização
          setTimeout(() => {
            if (!loadedOnce) {
              loadedOnce = true;
              resolve();
            }
          }, 1500);
        });

        // Loop de renderização contínua a 30 FPS no Canvas
        const renderLoop = () => {
          if (this.imgElement && ctx && this.canvas) {
            try {
              ctx.drawImage(this.imgElement, 0, 0, this.canvas.width, this.canvas.height);
            } catch {
              // cross-origin tainted canvas fallback handling
            }
          }
          this.animFrameId = requestAnimationFrame(renderLoop);
        };
        renderLoop();
      } else {
        // Video element mode
        const video = document.createElement("video");
        video.crossOrigin = "anonymous";
        video.src = this.streamUrl;
        video.autoplay = true;
        video.muted = true;
        video.playsInline = true;
        await video.play();
        this.videoElement = video;

        const renderLoop = () => {
          if (this.videoElement && ctx && this.canvas) {
            ctx.drawImage(this.videoElement, 0, 0, this.canvas.width, this.canvas.height);
          }
          this.animFrameId = requestAnimationFrame(renderLoop);
        };
        renderLoop();
      }

      // Converte o canvas dinâmico em MediaStream para o WebRTC
      const canvasStream = (this.canvas as HTMLCanvasElement & { captureStream: (fps: number) => MediaStream }).captureStream(30);

      // Tenta acoplar o microfone do celular para detecção de choro e transmissão de áudio simultânea
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
        // Se permissão de áudio for negada, continua apenas com vídeo
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
