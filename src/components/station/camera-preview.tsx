"use client";

import React, { useRef, useEffect } from "react";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Maximize2,
  Minimize2,
  ShieldCheck,
  CheckCircle,
  Wifi,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ActualTrackInfo } from "@/hooks/use-camera-station";

interface CameraPreviewProps {
  stream: MediaStream | null;
  trackInfo: ActualTrackInfo | null;
  isActive: boolean;
  isVideoPaused: boolean;
  isAudioMuted: boolean;
  onToggleVideoPause: () => void;
  onToggleAudioMute: () => void;
  isIpCamera?: boolean;
  ipCameraUrl?: string;
}

export function CameraPreview({
  stream,
  trackInfo,
  isActive,
  isVideoPaused,
  isAudioMuted,
  onToggleVideoPause,
  onToggleAudioMute,
  isIpCamera = false,
  ipCameraUrl = "",
}: CameraPreviewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  useEffect(() => {
    if (videoRef.current && !isIpCamera) {
      if (stream) {
        videoRef.current.srcObject = stream;
      } else {
        videoRef.current.srcObject = null;
      }
    }
  }, [stream, isIpCamera]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative aspect-video w-full rounded-2xl bg-black border border-slate-800 overflow-hidden shadow-2xl flex items-center justify-center group"
    >
      {/* 1. Modo Normal: WebRTC / getUserMedia Video Tag */}
      {!isIpCamera && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted // Muted localmente para evitar eco/feedback
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isActive && !isVideoPaused ? "opacity-100" : "opacity-0"
          }`}
        />
      )}

      {/* 2. Modo Câmera IP LAN: Renderização Direta de Stream MJPEG (Sem Bloqueio de Canvas) */}
      {isIpCamera && isActive && !isVideoPaused && (
        <img
          ref={imgRef}
          src={ipCameraUrl}
          alt="Stream IP Câmera USB Android"
          className="w-full h-full object-contain"
        />
      )}

      {/* Paused / Inactive State Overlay */}
      {(!isActive || isVideoPaused) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-night-950/95 text-center p-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-night-900 border border-slate-700 text-slate-400 mb-3">
            {isVideoPaused ? (
              <VideoOff className="h-8 w-8 text-amber-400" />
            ) : isIpCamera ? (
              <Wifi className="h-8 w-8 text-amber-400" />
            ) : (
              <Video className="h-8 w-8 text-guard-400" />
            )}
          </div>
          <h3 className="text-base font-bold text-white">
            {isVideoPaused
              ? "Transmissão de Vídeo Pausada"
              : isIpCamera
              ? "Pronto para Conectar via LAN"
              : "Câmera Desconectada"}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mt-1">
            {isVideoPaused
              ? "A imagem foi temporariamente ocultada por privacidade. O microfone continua ativo."
              : isIpCamera
              ? "Clique em 'Conectar e Transmitir via LAN' para puxar o feed da Logitech USB."
              : "Clique em Iniciar Transmissão para capturar o berço com a Logitech USB."}
          </p>
        </div>
      )}

      {/* Top Overlays */}
      {isActive && (
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto">
            <Badge variant="success" size="sm" className="shadow-lg backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Ao Vivo LAN
            </Badge>

            {isIpCamera ? (
              <Badge variant="warning" size="sm" className="shadow-lg backdrop-blur-md">
                <Wifi className="h-3 w-3 mr-1" />
                USB Camera (Android)
              </Badge>
            ) : trackInfo?.isLogitech ? (
              <Badge variant="info" size="sm" className="shadow-lg backdrop-blur-md">
                <CheckCircle className="h-3 w-3 mr-1" />
                Logitech HD 720p
              </Badge>
            ) : null}
          </div>

          {trackInfo && (
            <div className="bg-night-900/80 backdrop-blur-md rounded-xl px-2.5 py-1 text-[11px] font-mono text-slate-300 border border-slate-800 shadow-lg pointer-events-auto">
              <span>{trackInfo.width}x{trackInfo.height}</span>
              {trackInfo.frameRate && <span> @ {trackInfo.frameRate}fps</span>}
            </div>
          )}
        </div>
      )}

      {/* Bottom Controls Bar */}
      {isActive && (
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between bg-night-900/85 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-800 shadow-xl transition-opacity duration-200">
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleVideoPause}
              className={`rounded-lg p-2 text-xs font-semibold flex items-center gap-1.5 transition ${
                isVideoPaused
                  ? "bg-amber-950/70 border border-amber-800 text-amber-300"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-200"
              }`}
              title={isVideoPaused ? "Reativar Vídeo" : "Ocultar Vídeo"}
            >
              {isVideoPaused ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
              <span className="hidden sm:inline">
                {isVideoPaused ? "Retomar Vídeo" : "Pausar Vídeo"}
              </span>
            </button>

            <button
              onClick={onToggleAudioMute}
              className={`rounded-lg p-2 text-xs font-semibold flex items-center gap-1.5 transition ${
                isAudioMuted
                  ? "bg-red-950/70 border border-red-800 text-red-300"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-200"
              }`}
              title={isAudioMuted ? "Reativar Microfone" : "Silenciar Microfone"}
            >
              {isAudioMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              <span className="hidden sm:inline">
                {isAudioMuted ? "Desmutar Áudio" : "Mutar Áudio"}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden md:flex items-center gap-1.5 text-xs text-guard-400 font-medium">
              <ShieldCheck className="h-4 w-4" />
              Stream Local Ativo
            </span>

            <button
              onClick={toggleFullscreen}
              className="rounded-lg p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Alternar Tela Cheia"
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
