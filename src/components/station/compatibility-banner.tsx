"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, Smartphone, Info, X } from "lucide-react";
import { AndroidUsbOtgMediaCaptureProvider } from "@/lib/media/browser-capture-provider";

interface CompatibilityBannerProps {
  errorMessage: string | null;
}

export function CompatibilityBanner({ errorMessage }: CompatibilityBannerProps) {
  const [isAndroid, setIsAndroid] = useState(false);
  const [dismissAndroidNotice, setDismissAndroidNotice] = useState(false);

  useEffect(() => {
    setIsAndroid(AndroidUsbOtgMediaCaptureProvider.isAndroidDevice());
  }, []);

  if (errorMessage) {
    return (
      <div className="rounded-2xl border border-red-800/80 bg-red-950/50 p-4 text-xs text-red-200 shadow-xl flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 shrink-0 text-red-400 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-sm font-bold text-white block">
            Aviso de Acesso à Câmera/Microfone
          </strong>
          <p>{errorMessage}</p>
        </div>
      </div>
    );
  }

  if (isAndroid && !dismissAndroidNotice) {
    return (
      <div className="rounded-2xl border border-sky-800/80 bg-sky-950/40 p-4 text-xs text-sky-200 shadow-xl flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Smartphone className="h-5 w-5 shrink-0 text-sky-400 mt-0.5" />
          <div className="space-y-1">
            <strong className="text-sm font-bold text-white block">
              Dispositivo Android Detectado
            </strong>
            <p className="text-slate-300 leading-relaxed">
              Para conectar sua webcam Logitech USB via adaptador USB OTG no Android, certifique-se de que a função OTG está ativada nas configurações do sistema do aparelho. Caso o navegador móvel não liste a câmera USB externa diretamente, a camada de abstração do BabyGuard permite chavear para a câmera traseira do smartphone como alternativa imediata.
            </p>
          </div>
        </div>

        <button
          onClick={() => setDismissAndroidNotice(true)}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return null;
}
