"use client";

import React, { useState, useEffect } from "react";
import { Sliders, Shield, Volume2, Video, Bell, Save, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const [sensitivity, setSensitivity] = useState(70);
  const [minDurationMs, setMinDurationMs] = useState(1500);
  const [videoResolution, setVideoResolution] = useState("720p");
  const [framerate, setFramerate] = useState(30);
  const [noiseSuppression, setNoiseSuppression] = useState(true);
  const [echoCancellation, setEchoCancellation] = useState(true);
  const [alertSound, setAlertSound] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function loadPreferences() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data && !error) {
        setSensitivity(data.cry_sensitivity);
        setMinDurationMs(data.cry_min_duration_ms);
        setVideoResolution(data.video_max_resolution);
        setFramerate(data.video_max_framerate);
        setNoiseSuppression(data.audio_noise_suppression);
        setEchoCancellation(data.audio_echo_cancellation);
        setAlertSound(data.alert_sound_enabled);
      }
    }

    loadPreferences();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Usuário não autenticado.");

      const { error } = await supabase.from("user_preferences").upsert({
        user_id: user.id,
        cry_sensitivity: sensitivity,
        cry_min_duration_ms: minDurationMs,
        video_max_resolution: videoResolution,
        video_max_framerate: framerate,
        audio_noise_suppression: noiseSuppression,
        audio_echo_cancellation: echoCancellation,
        alert_sound_enabled: alertSound,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: unknown) {
      alert("Erro ao salvar configurações.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Configurações do BabyGuard
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Ajuste as preferências de transmissão de vídeo, processamento de áudio e sensibilidade de choro.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* IA de Choro */}
        <Card className="border-slate-800 bg-night-900/80">
          <CardHeader>
            <div className="flex items-center gap-2 text-guard-400">
              <Sliders className="h-5 w-5" />
              <CardTitle>Detecção Inteligente de Choro</CardTitle>
            </div>
            <CardDescription>
              Processamento local no transmissor sem enviar amostras para serviços na nuvem.
            </CardDescription>
          </CardHeader>

          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
                <span>Sensibilidade do Algoritmo</span>
                <span className="text-guard-400 font-mono">{sensitivity}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={sensitivity}
                onChange={(e) => setSensitivity(Number(e.target.value))}
                className="w-full accent-guard-500 bg-slate-800 rounded-lg h-2"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Valores mais altos detectam choros sutis, mas podem reagir a ruídos ambientes.
              </p>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
                <span>Duração Mínima Contínua para Alerta</span>
                <span className="text-guard-400 font-mono">{(minDurationMs / 1000).toFixed(1)}s</span>
              </div>
              <input
                type="range"
                min="500"
                max="5000"
                step="250"
                value={minDurationMs}
                onChange={(e) => setMinDurationMs(Number(e.target.value))}
                className="w-full accent-guard-500 bg-slate-800 rounded-lg h-2"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Evita falsos positivos causados por tosses ou portas batendo.
              </p>
            </div>
          </div>
        </Card>

        {/* Vídeo e Qualidade WebRTC */}
        <Card className="border-slate-800 bg-night-900/80">
          <CardHeader>
            <div className="flex items-center gap-2 text-sky-400">
              <Video className="h-5 w-5" />
              <CardTitle>Transmissão de Vídeo (Webcam Logitech USB)</CardTitle>
            </div>
            <CardDescription>
              Configuração do perfil de streaming WebRTC P2P.
            </CardDescription>
          </CardHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Resolução Máxima
              </label>
              <select
                value={videoResolution}
                onChange={(e) => setVideoResolution(e.target.value)}
                className="w-full rounded-xl bg-night-850 px-3 py-2 text-sm text-slate-200 border border-slate-700 focus:border-guard-500 focus:outline-none"
              >
                <option value="720p">HD 720p (1280x720) - Logitech Nativo</option>
                <option value="480p">SD 480p (854x480) - Baixo Consumo</option>
                <option value="360p">Eco 360p (640x360) - Conexão Lenta</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Taxa de Quadros (FPS)
              </label>
              <select
                value={framerate}
                onChange={(e) => setFramerate(Number(e.target.value))}
                className="w-full rounded-xl bg-night-850 px-3 py-2 text-sm text-slate-200 border border-slate-700 focus:border-guard-500 focus:outline-none"
              >
                <option value={30}>30 FPS - Fluidez Máxima</option>
                <option value={24}>24 FPS - Modo Cinema Econômico</option>
                <option value={15}>15 FPS - Modo Conservação</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Áudio e Notificações */}
        <Card className="border-slate-800 bg-night-900/80">
          <CardHeader>
            <div className="flex items-center gap-2 text-amber-400">
              <Volume2 className="h-5 w-5" />
              <CardTitle>Tratamento de Áudio & Alertas</CardTitle>
            </div>
            <CardDescription>
              Filtros para microfone USB e notificações de segurança.
            </CardDescription>
          </CardHeader>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-xl bg-night-850 border border-slate-800 cursor-pointer">
              <div>
                <span className="text-xs font-bold text-slate-200 block">Cancelamento de Eco</span>
                <span className="text-[11px] text-slate-400">
                  Impede microfonia se áudio bidirecional estiver em uso
                </span>
              </div>
              <input
                type="checkbox"
                checked={echoCancellation}
                onChange={(e) => setEchoCancellation(e.target.checked)}
                className="h-4 w-4 rounded accent-guard-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-night-850 border border-slate-800 cursor-pointer">
              <div>
                <span className="text-xs font-bold text-slate-200 block">Supressão de Ruído de Fundo</span>
                <span className="text-[11px] text-slate-400">
                  Reduz chiados de ventiladores e ar-condicionado
                </span>
              </div>
              <input
                type="checkbox"
                checked={noiseSuppression}
                onChange={(e) => setNoiseSuppression(e.target.checked)}
                className="h-4 w-4 rounded accent-guard-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-night-850 border border-slate-800 cursor-pointer">
              <div>
                <span className="text-xs font-bold text-slate-200 block">Alerta Sonoro no Monitor</span>
                <span className="text-[11px] text-slate-400">
                  Toca sinal de alarme no iPhone/Safari ao detectar choro
                </span>
              </div>
              <input
                type="checkbox"
                checked={alertSound}
                onChange={(e) => setAlertSound(e.target.checked)}
                className="h-4 w-4 rounded accent-guard-500"
              />
            </label>
          </div>
        </Card>

        <div className="flex items-center justify-between pt-2">
          {savedSuccess && (
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4" />
              Preferências salvas com sucesso!
            </span>
          )}
          <div className="ml-auto">
            <Button type="submit" size="lg" isLoading={saving} className="gap-2">
              <Save className="h-4 w-4" />
              <span>Salvar Configurações</span>
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
