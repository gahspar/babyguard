"use client";

import React from "react";
import { Volume2, VolumeX, AlertTriangle, Activity } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAudioMeter } from "@/hooks/use-audio-meter";

interface AudioTesterProps {
  audioTrack: MediaStreamTrack | null;
  isCapturing: boolean;
  isMuted: boolean;
}

export function AudioTester({
  audioTrack,
  isCapturing,
  isMuted,
}: AudioTesterProps) {
  const { volume, decibels, isClipping, isActive } = useAudioMeter(audioTrack);

  // Meter color logic
  const getMeterColor = (val: number) => {
    if (val > 85) return "bg-rose-500 shadow-rose-950/60";
    if (val > 60) return "bg-amber-400 shadow-amber-950/60";
    return "bg-guard-500 shadow-guard-950/60";
  };

  return (
    <Card className="border-slate-800 bg-night-900/80">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-slate-800/80 text-guard-400 border border-slate-700/60">
            {isMuted || !isCapturing ? (
              <VolumeX className="h-4 w-4 text-slate-500" />
            ) : (
              <Volume2 className="h-4 w-4 text-guard-400" />
            )}
          </div>
          <div>
            <CardTitle className="text-base">Teste de Áudio em Tempo Real</CardTitle>
            <CardDescription>
              Validação do microfone para garantir detecção nítida dos sons e do choro do bebê.
            </CardDescription>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isClipping && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/60 animate-pulse">
              <AlertTriangle className="h-3 w-3" />
              Saturação
            </span>
          )}
          <span className="text-xs font-mono text-slate-300 bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700">
            {isCapturing && !isMuted ? `${decibels} dB` : "-- dB"}
          </span>
        </div>
      </CardHeader>

      <div className="mt-3 space-y-2">
        {/* VU-Meter Progress Bar */}
        <div className="relative h-4 w-full rounded-full bg-slate-950 border border-slate-800 overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-75 ${
              isCapturing && !isMuted ? getMeterColor(volume) : "bg-slate-700"
            }`}
            style={{ width: `${isCapturing && !isMuted ? volume : 0}%` }}
          />

          {/* Scale indicators */}
          <div className="absolute inset-0 flex justify-between px-2 text-[9px] font-mono text-slate-400/40 pointer-events-none items-center">
            <span>-60dB</span>
            <span>-30dB</span>
            <span>-12dB</span>
            <span>0dB</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Activity className="h-3 w-3 text-guard-400" />
            Status:{" "}
            <strong className="text-slate-200">
              {!isCapturing
                ? "Microfone Inativo"
                : isMuted
                ? "Microfone Silenciado"
                : volume > 10
                ? "Captação Ativa / Som Detectado"
                : "Ambiente Silencioso"}
            </strong>
          </span>

          <span className="font-mono text-slate-300">
            Intensidade: {isCapturing && !isMuted ? `${volume}%` : "0%"}
          </span>
        </div>
      </div>
    </Card>
  );
}
