"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Radio,
  Wifi,
  AlertTriangle,
  RefreshCw,
  Bell,
  Sliders,
  CheckCircle2,
} from "lucide-react";
import { VideoPlayer } from "@/components/monitor/video-player";
import { useWebRTCStream } from "@/hooks/use-webrtc-stream";
import { useWakeLock } from "@/hooks/use-wake-lock";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function MonitorPage() {
  const [activeSessionId, setActiveSessionId] = useState<string>("default-room");
  const [stationOnline, setStationOnline] = useState<boolean>(true);
  const [cryState, setCryState] = useState<string>("silence");

  // Keep iPhone / mobile screen awake during monitoring
  const { isLocked: isScreenAwake } = useWakeLock(true);

  const supabase = createClient();

  const {
    connectionState,
    remoteStream,
    stats,
    error,
    connect,
    disconnect,
  } = useWebRTCStream({
    sessionId: activeSessionId,
    role: "monitor",
    autoConnect: true,
  });

  // Listen to cry alerts and station presence via Supabase Realtime
  useEffect(() => {
    const channel = supabase.channel(`monitor_room:${activeSessionId}`);

    channel
      .on("broadcast", { event: "cry_alert" }, (payload) => {
        if (payload?.payload?.state) {
          setCryState(payload.payload.state);
        }
      })
      .on("broadcast", { event: "station_status" }, (payload) => {
        if (payload?.payload?.online !== undefined) {
          setStationOnline(payload.payload.online);
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [activeSessionId, supabase]);

  const isConnected = connectionState === "connected";

  return (
    <div className="space-y-4 max-w-5xl mx-auto animate-in fade-in-50">
      {/* Top Monitor Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Badge
              variant={isConnected ? "success" : "warning"}
              size="sm"
            >
              <span
                className={`h-1.5 w-1.5 rounded-full mr-1 ${
                  isConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                }`}
              />
              {isConnected ? "Monitor Conectado ao Berço" : "Aguardando Transmissão..."}
            </Badge>

            <span className="text-xs text-slate-400 font-mono hidden sm:inline">
              Safari / iOS Otimizado • P2P DTLS-SRTP
            </span>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-white mt-1 sm:text-3xl">
            Monitor do Bebê
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {!isConnected && (
            <Button size="sm" onClick={connect} className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Tentar Reconectar</span>
            </Button>
          )}

          <Link href="/settings">
            <Button variant="outline" size="sm">
              <Sliders className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* WebRTC Remote Video Player */}
      <VideoPlayer
        stream={remoteStream}
        connectionState={connectionState}
        stats={stats}
        onDisconnect={disconnect}
      />

      {/* Connection & Cry Status Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Cry Detector Status Card */}
        <Card className="border-slate-800 bg-night-900/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl border ${
                  cryState === "active_alert" || cryState === "cry_detected"
                    ? "bg-rose-950/80 border-rose-800 text-rose-400 animate-bounce"
                    : "bg-emerald-950/80 border-emerald-800 text-emerald-400"
                }`}
              >
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Reconhecimento de Choro
                </h4>
                <p className="text-xs text-slate-300 font-semibold mt-0.5">
                  {cryState === "active_alert" || cryState === "cry_detected"
                    ? "ALERTA: Choro do bebê detectado!"
                    : cryState === "possible_cry"
                    ? "Possível choro analisando ruído..."
                    : "Ambiente Seguro • Sem choro"}
                </p>
              </div>
            </div>

            <Badge
              variant={
                cryState === "active_alert" || cryState === "cry_detected"
                  ? "danger"
                  : "success"
              }
              size="sm"
            >
              {cryState === "active_alert" ? "Alerta Ativo" : "Monitorando"}
            </Badge>
          </div>
        </Card>

        {/* Link Quality & Security Card */}
        <Card className="border-slate-800 bg-night-900/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-guard-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Privacidade da Transmissão
                </h4>
                <p className="text-xs text-slate-300 font-semibold mt-0.5">
                  Vídeo e áudio diretos de dispositivo a dispositivo
                </p>
              </div>
            </div>

            <Badge variant="neutral" size="sm">P2P Seguro</Badge>
          </div>
        </Card>
      </div>
    </div>
  );
}
