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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCameraStation } from "@/hooks/use-camera-station";
import { useWebRTCStream } from "@/hooks/use-webrtc-stream";
import { CameraPreview } from "@/components/station/camera-preview";
import { DeviceSelector } from "@/components/station/device-selector";
import { AudioTester } from "@/components/station/audio-tester";
import { ResolutionControls } from "@/components/station/resolution-controls";
import { CompatibilityBanner } from "@/components/station/compatibility-banner";

export default function StationPage() {
  const {
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
              <span>Iniciar Câmera e Microfone</span>
            </Button>
          )}

          <Link href="/settings">
            <Button variant="outline" size="lg" title="Ajustes Avançados">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

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

        {/* Audio VU-Meter Tester */}
        <AudioTester
          audioTrack={audioTrack}
          isCapturing={isCapturing}
          isMuted={isAudioMuted}
        />
      </div>

      {/* Resolution & Quality Controls */}
      <ResolutionControls
        currentResolution={resolution}
        onChangeResolution={changeResolution}
        isCapturing={isCapturing}
      />
    </div>
  );
}
