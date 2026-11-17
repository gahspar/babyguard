"use client";

import React from "react";
import { Sliders, Sparkles, Zap, BatteryLow } from "lucide-react";
import { ResolutionPreset, RESOLUTION_PRESETS } from "@/lib/media/types";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface ResolutionControlsProps {
  currentResolution: ResolutionPreset;
  onChangeResolution: (preset: ResolutionPreset) => void;
  isCapturing: boolean;
}

export function ResolutionControls({
  currentResolution,
  onChangeResolution,
  isCapturing,
}: ResolutionControlsProps) {
  const options: { preset: ResolutionPreset; icon: React.ElementType }[] = [
    { preset: "720p", icon: Sparkles },
    { preset: "480p", icon: Zap },
    { preset: "360p", icon: BatteryLow },
  ];

  return (
    <Card className="border-slate-800 bg-night-900/80">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Sliders className="h-4 w-4 text-guard-400" />
          Resolução e Qualidade da Transmissão
        </CardTitle>
        <CardDescription>
          Ajuste o bitrate e tamanho da imagem conforme a velocidade da rede Wi-Fi.
        </CardDescription>
      </CardHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-2">
        {options.map(({ preset, icon: Icon }) => {
          const config = RESOLUTION_PRESETS[preset];
          const isSelected = currentResolution === preset;

          return (
            <button
              key={preset}
              onClick={() => onChangeResolution(preset)}
              className={`flex items-start gap-3 p-3 rounded-xl border text-left transition ${
                isSelected
                  ? "border-guard-500 bg-guard-950/60 shadow-lg shadow-guard-950/40 text-white"
                  : "border-slate-800 bg-night-850 hover:bg-slate-800/60 text-slate-400 hover:text-slate-200"
              }`}
            >
              <div
                className={`p-2 rounded-lg border ${
                  isSelected
                    ? "bg-guard-600/30 border-guard-500/50 text-guard-300"
                    : "bg-slate-800 border-slate-700 text-slate-400"
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>

              <div>
                <span className="text-xs font-bold block text-white">
                  {config.label}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {config.width}x{config.height} • {config.idealFps} FPS
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
