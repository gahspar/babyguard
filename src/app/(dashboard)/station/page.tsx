"use client";

import React from "react";
import Link from "next/link";
import {
  Video,
  Play,
  Square,
  RefreshCw,
  Settings,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Globe,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useCameraStation } from "@/hooks/use-camera-station";
import { useWebRTCStream } from "@/hooks/use-webrtc-stream";
import { CameraPreview } from "@/components/station/camera-preview";
import { DeviceSelector } from "@/components/station/device-selector";
import { AudioTester } from "@/components/station/audio-tester";
import { ResolutionControls } from "@/components/station/resolution-controls";
import { CompatibilityBanner } from "@/components/station/compatibility-banner";

export default function StationPage() {
  const {
    sourceType,
    setSourceType,
    ipCameraUrl,
    setIpCameraUrl,
    ipUsername,
    setIpUsername,
    ipPassword,
    setIpPassword,
    status,
    errorMessage,
    stream,
    audioTrack,
    trackInfo,
    videoDevices,
    audioDevices,
    selectedVideoDeviceId,
    selectedAudioDeviceId,
    resolution,
    isAudioMuted,
    isVideoPaused,
    startCapture,
    stopCapture,
    changeVideoDevice,
    changeAudioDevice,
    changeResolution,
    toggleAudioMute,
    toggleVideoPause,
    refreshDevices,
  } = useCameraStation();

  const isCapturing = status === "active";

  const { connectionState: webrtcState } = useWebRTCStream({
    sessionId: "default-room",
    role: "station",
    localStream: stream,
    autoConnect: isCapturing,
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in-50">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge
              variant={isCapturing ? "success" : "neutral"}
              size="sm"
            >
              <span
                className={`h-1.5 w-1.5 rounded-full mr-1 ${
                  isCapturing ? "bg-emerald-400 animate-pulse" : "bg-slate-400"
                }`}
              />
              {isCapturing ? "Estação Transmitindo Localmente" : "Estação em Espera"}
            </Badge>

            {trackInfo?.isLogitech && (
              <Badge variant="info" size="sm">
                Logitech HD 720p Conectada
              </Badge>
            )}

            {sourceType === "ip_camera" && (
              <Badge variant="warning" size="sm">
                Modo Câmera IP (App USB Camera)
              </Badge>
            )}
          </div>

          <h1 className="text-2xl font-black tracking-tight text-white mt-1 sm:text-3xl">
            Estação da Câmera
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Configure e inicie a captura de vídeo HD e áudio do quarto do bebê.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isCapturing ? (
            <Button
              variant="danger"
              size="lg"
              onClick={stopCapture}
              className="gap-2 shadow-red-950/50"
            >
              <Square className="h-4 w-4 fill-current" />
              <span>Interromper Câmera</span>
            </Button>
          ) : (
            <Button
              variant="primary"
              size="lg"
              onClick={startCapture}
              isLoading={status === "requesting_permission"}
              className="gap-2 shadow-guard-950/60"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>Iniciar Transmissão</span>
            </Button>
          )}

          <Link href="/settings">
            <Button variant="outline" size="lg" title="Ajustes Avançados">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Selector: Webcam Direta vs USB Camera App (IP Local) */}
      <div className="flex gap-2 p-1.5 bg-night-900 border border-slate-800 rounded-2xl w-full sm:w-fit">
        <button
          type="button"
          onClick={() => {
            if (!isCapturing) setSourceType("webcam");
          }}
          disabled={isCapturing}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            sourceType === "webcam"
              ? "bg-guard-600 text-white shadow-lg shadow-guard-950"
              : "text-slate-400 hover:text-white"
          } ${isCapturing ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <Video className="h-4 w-4" />
          <span>Webcam USB / Navegador</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (!isCapturing) setSourceType("ip_camera");
          }}
          disabled={isCapturing}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            sourceType === "ip_camera"
              ? "bg-guard-600 text-white shadow-lg shadow-guard-950"
              : "text-slate-400 hover:text-white"
          } ${isCapturing ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <Smartphone className="h-4 w-4" />
          <span>Android (App USB Camera / Stream IP)</span>
        </button>
      </div>

      {/* IP Stream Configuration Input (When in ip_camera mode) */}
      {sourceType === "ip_camera" && (
        <Card className="border-amber-800/40 bg-amber-950/10 p-4 space-y-4">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <Globe className="h-4 w-4" />
            <span>Configuração do App USB Camera no Android</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            No aplicativo <strong>USB Camera</strong> do seu celular Android, ative o recurso <strong>"IP Camera Server"</strong> e preencha os dados abaixo:
          </p>
          
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                URL do Stream (ex: http://192.168.0.25:8080/video ou http://192.168.0.25:8080)
              </label>
              <input
                type="text"
                value={ipCameraUrl}
                onChange={(e) => setIpCameraUrl(e.target.value)}
                disabled={isCapturing}
                placeholder="http://192.168.1.100:8080/video"
                className="w-full rounded-xl bg-night-950 px-3 py-2 text-xs text-white border border-slate-700 font-mono focus:border-guard-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <Lock className="h-3 w-3 text-amber-400" />
                  <span>Usuário do App (se configurado)</span>
                </label>
                <input
                  type="text"
                  value={ipUsername}
                  onChange={(e) => setIpUsername(e.target.value)}
                  disabled={isCapturing}
                  placeholder="admin"
                  className="w-full rounded-xl bg-night-950 px-3 py-2 text-xs text-white border border-slate-700 font-mono focus:border-guard-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <Lock className="h-3 w-3 text-amber-400" />
                  <span>Senha do App (se configurada)</span>
                </label>
                <input
                  type="password"
                  value={ipPassword}
                  onChange={(e) => setIpPassword(e.target.value)}
                  disabled={isCapturing}
                  placeholder="••••••••"
                  className="w-full rounded-xl bg-night-950 px-3 py-2 text-xs text-white border border-slate-700 font-mono focus:border-guard-500 focus:outline-none"
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              * O app USB Camera vem por padrão com autenticação HTTP Basic (ex: usuário <code className="text-amber-300">admin</code> e senha padrão do app). Preenchendo aqui, a autenticação é enviada automaticamente sem bloquear o stream.
            </p>
          </div>
        </Card>
      )}

      {/* Compatibility / Error Alerts */}
      <CompatibilityBanner errorMessage={errorMessage} />

      {/* Camera Viewport Component */}
      <CameraPreview
        stream={stream}
        trackInfo={trackInfo}
        isActive={isCapturing}
        isVideoPaused={isVideoPaused}
        isAudioMuted={isAudioMuted}
        onToggleVideoPause={toggleVideoPause}
        onToggleAudioMute={toggleAudioMute}
      />

      {/* Media Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Device Selection (Logitech HD Prioritized) */}
        {sourceType === "webcam" ? (
          <DeviceSelector
            videoDevices={videoDevices}
            audioDevices={audioDevices}
            selectedVideoDeviceId={selectedVideoDeviceId}
            selectedAudioDeviceId={selectedAudioDeviceId}
            onSelectVideoDevice={changeVideoDevice}
            onSelectAudioDevice={changeAudioDevice}
            onRefreshDevices={refreshDevices}
            isCapturing={isCapturing}
          />
        ) : (
          <Card className="border-slate-800 bg-night-900/80 p-4 flex flex-col justify-center">
            <div className="flex items-center gap-2 text-xs font-bold text-white mb-1">
              <Smartphone className="h-4 w-4 text-guard-400" />
              <span>Fonte de Vídeo: Celular Android</span>
            </div>
            <p className="text-xs text-slate-400">
              O feed é capturado da webcam Logitech conectada ao OTG através do servidor local do app USB Camera.
            </p>
          </Card>
        )}

        {/* Audio VU-Meter Tester */}
        <AudioTester
          audioTrack={audioTrack}
          isCapturing={isCapturing}
          isMuted={isAudioMuted}
        />
      </div>

      {/* Resolution & Quality Controls */}
      {sourceType === "webcam" && (
        <ResolutionControls
          currentResolution={resolution}
          onChangeResolution={changeResolution}
          isCapturing={isCapturing}
        />
      )}
    </div>
  );
}
