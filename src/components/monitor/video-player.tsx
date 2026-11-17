"use client";

import React, { useRef, useEffect, useState } from "react";
import {
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Wifi,
  PowerOff,
  Activity,
  Battery,
  ShieldCheck,
  AlertCircle,
  Radio,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { WebRTCConnectionStats } from "@/types/webrtc";

interface VideoPlayerProps {
  stream: MediaStream | null;
  connectionState: RTCPeerConnectionState;
  stats: WebRTCConnectionStats;
  onDisconnect?: () => void;
}

export function VideoPlayer({
  stream,
  connectionState,
  stats,
  onDisconnect,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;

      // Safari requires user interaction or play() promise handling
      videoRef.current.play().catch((err) => {
        console.warn("Autoplay bloqueado pelo navegador (Safari). Clique para ativar som:", err);
      });
    }
  }, [stream, volume, isMuted]);

  // Battery API check (for iPhone / transmitter device status)
  useEffect(() => {
    if (typeof navigator !== "undefined" && "getBattery" in navigator) {
      (navigator as unknown as { getBattery: () => Promise<{ level: number }> })
        .getBattery()
        .then((battery) => {
          setBatteryLevel(Math.round(battery.level * 100));
        })
        .catch(() => {});
    }
  }, []);

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

  const isConnected = connectionState === "connected";

  const getQualityBadge = () => {
    switch (stats.quality) {
      case "excellent":
        return <Badge variant="success" size="sm">Excelente ({stats.latencyMs}ms)</Badge>;
      case "good":
        return <Badge variant="info" size="sm">Boa ({stats.latencyMs}ms)</Badge>;
      case "poor":
        return <Badge variant="warning" size="sm">Lenta ({stats.latencyMs}ms)</Badge>;
      default:
        return <Badge variant="danger" size="sm">Desconectado</Badge>;
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative aspect-video w-full rounded-2xl bg-black border border-slate-800 overflow-hidden shadow-2xl flex items-center justify-center group"
    >
      {/* HTML5 Video element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isConnected && stream ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Disconnected / Connecting Overlay */}
      {(!isConnected || !stream) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-night-950/95 text-center p-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-night-900 border border-slate-700 text-sky-400 mb-3">
            <Radio className="h-8 w-8 animate-pulse" />
          </div>
          <h3 className="text-base font-bold text-white">
            {connectionState === "connecting"
              ? "Negociando Conexão P2P WebRTC..."
              : "Aguardando Estação da Câmera"}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mt-1">
            {connectionState === "connecting"
              ? "Trocando candidatos ICE e chaves DTLS-SRTP diretamente entre os dispositivos."
              : "Certifique-se de que a Estação da Câmera no computador/Android está com a transmissão iniciada."}
          </p>
        </div>
      )}

      {/* Top Overlays: Quality & Latency Badge */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          {isConnected && (
            <Badge variant="success" size="sm" className="shadow-lg backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse mr-1" />
              Ao Vivo
            </Badge>
          )}
          {getQualityBadge()}
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          {batteryLevel !== null && (
            <Badge variant="neutral" size="sm" className="font-mono backdrop-blur-md">
              <Battery className="h-3 w-3 mr-1 text-slate-400" />
              {batteryLevel}%
            </Badge>
          )}

          {isConnected && stats.frameRate > 0 && (
            <div className="bg-night-900/80 backdrop-blur-md rounded-xl px-2.5 py-1 text-[11px] font-mono text-slate-300 border border-slate-800 shadow-lg">
              <span>{stats.frameRate} FPS</span>
              {stats.bitrateKbps > 0 && <span> • {stats.bitrateKbps} kbps</span>}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Controls Bar */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between bg-night-900/85 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`rounded-lg p-2 text-xs font-semibold flex items-center gap-1.5 transition ${
              isMuted
                ? "bg-red-950/70 border border-red-800 text-red-300"
                : "bg-slate-800 hover:bg-slate-700 text-slate-200"
            }`}
            title={isMuted ? "Ativar Áudio do Berço" : "Silenciar Áudio"}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>

          {/* Volume slider */}
          <div className="hidden sm:flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(parseFloat(e.target.value));
                if (isMuted) setIsMuted(false);
              }}
              className="w-20 accent-guard-500 bg-slate-800 rounded-lg h-1.5"
            />
            <span className="text-[11px] text-slate-400 font-mono">
              {Math.round((isMuted ? 0 : volume) * 100)}%
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden md:flex items-center gap-1.5 text-xs text-guard-400 font-medium">
            <ShieldCheck className="h-4 w-4" />
            DTLS-SRTP P2P Criptografado
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

          {onDisconnect && (
            <button
              onClick={onDisconnect}
              className="rounded-lg p-2 text-red-400 hover:text-red-300 hover:bg-red-950/40 transition"
              title="Encerrar Conexão"
            >
              <PowerOff className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
