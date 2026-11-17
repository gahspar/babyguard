"use client";

import React from "react";
import { Video, Mic, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { MediaDeviceOption } from "@/lib/media/types";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface DeviceSelectorProps {
  videoDevices: MediaDeviceOption[];
  audioDevices: MediaDeviceOption[];
  selectedVideoDeviceId: string;
  selectedAudioDeviceId: string;
  onSelectVideoDevice: (deviceId: string) => void;
  onSelectAudioDevice: (deviceId: string) => void;
  onRefreshDevices: () => void;
  isCapturing: boolean;
}

export function DeviceSelector({
  videoDevices,
  audioDevices,
  selectedVideoDeviceId,
  selectedAudioDeviceId,
  onSelectVideoDevice,
  onSelectAudioDevice,
  onRefreshDevices,
  isCapturing,
}: DeviceSelectorProps) {
  const hasLogitechVideo = videoDevices.some((d) => d.isLogitech);
  const hasLogitechAudio = audioDevices.some((d) => d.isLogitech);

  return (
    <Card className="border-slate-800 bg-night-900/80">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base">Dispositivos de Entrada</CardTitle>
          <CardDescription>
            Selecione a webcam e microfone Logitech USB HD conectados ao computador ou celular.
          </CardDescription>
        </div>

        <button
          onClick={onRefreshDevices}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700/80 px-2.5 py-1.5 rounded-lg border border-slate-700/60 transition"
          title="Reescanear dispositivos USB conectados"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Reescanear</span>
        </button>
      </CardHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
        {/* Câmera Dropdown */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Video className="h-3.5 w-3.5 text-guard-400" />
              Câmera de Vídeo
            </label>
            {hasLogitechVideo && (
              <span className="text-[10px] text-guard-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Logitech Detectada
              </span>
            )}
          </div>

          <select
            value={selectedVideoDeviceId}
            onChange={(e) => onSelectVideoDevice(e.target.value)}
            className="w-full rounded-xl bg-night-850 px-3 py-2.5 text-xs sm:text-sm text-slate-100 border border-slate-700 focus:border-guard-500 focus:outline-none transition"
          >
            {videoDevices.length === 0 ? (
              <option value="">Nenhuma câmera detectada</option>
            ) : (
              videoDevices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.isLogitech ? `★ ${device.label}` : device.label}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Microfone Dropdown */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Mic className="h-3.5 w-3.5 text-sky-400" />
              Microfone de Áudio
            </label>
            {hasLogitechAudio && (
              <span className="text-[10px] text-sky-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Logitech Detectado
              </span>
            )}
          </div>

          <select
            value={selectedAudioDeviceId}
            onChange={(e) => onSelectAudioDevice(e.target.value)}
            className="w-full rounded-xl bg-night-850 px-3 py-2.5 text-xs sm:text-sm text-slate-100 border border-slate-700 focus:border-guard-500 focus:outline-none transition"
          >
            {audioDevices.length === 0 ? (
              <option value="">Nenhum microfone detectado</option>
            ) : (
              audioDevices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.isLogitech ? `★ ${device.label}` : device.label}
                </option>
              ))
            )}
          </select>
        </div>
      </div>
    </Card>
  );
}
