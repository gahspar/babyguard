import React from "react";
import Link from "next/link";
import {
  Video,
  ShieldAlert,
  Smartphone,
  ShieldCheck,
  Radio,
  Wifi,
  Lock,
  ArrowRight,
  Activity,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  return (
    <div className="space-y-6 animate-in fade-in-50">
      {/* Welcome & Security Banner */}
      <div className="rounded-2xl border border-guard-800/40 bg-gradient-to-r from-guard-950/40 via-night-900 to-night-900 p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="success" size="sm">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Segurança Ativa
              </Badge>
              <span className="text-xs text-slate-400 font-mono">DTLS-SRTP • P2P Isolado</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              Painel de Controle BabyGuard
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              Seu sistema privado de babá eletrônica IP. Transmissão direta entre seus dispositivos sem armazenamento de vídeo em servidores externos.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/monitor">
              <Button size="lg" className="w-full sm:w-auto shadow-emerald-950/60">
                <ShieldCheck className="mr-2 h-5 w-5" />
                <span>Abrir Monitor Bebê</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Action Hub */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Estação da Câmera Card */}
        <Card className="border-slate-800 bg-night-900/90 hover:border-guard-800/50 transition">
          <div className="flex items-start justify-between pb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-guard-600/20 border border-guard-500/30 text-guard-400">
              <Video className="h-6 w-6" />
            </div>
            <Badge variant="neutral" size="sm">Transmissor</Badge>
          </div>
          <CardHeader className="p-0 mt-3">
            <CardTitle>Estação da Câmera</CardTitle>
            <CardDescription>
              Utilize este dispositivo (PC Windows ou Android com Webcam Logitech USB) para capturar o berço e transmitir.
            </CardDescription>
          </CardHeader>
          <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <Radio className="h-3.5 w-3.5 text-guard-400" />
              Captura Local & IA de Choro
            </span>
            <Link href="/station">
              <Button size="sm" variant="secondary">
                <span>Iniciar Câmera</span>
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </Card>

        {/* Monitor Bebê Card */}
        <Card className="border-slate-800 bg-night-900/90 hover:border-guard-800/50 transition">
          <div className="flex items-start justify-between pb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-600/20 border border-sky-500/30 text-sky-400">
              <Smartphone className="h-6 w-6" />
            </div>
            <Badge variant="info" size="sm">Receptor / iPhone</Badge>
          </div>
          <CardHeader className="p-0 mt-3">
            <CardTitle>Monitor do Bebê</CardTitle>
            <CardDescription>
              Interface de visualização em tempo real otimizada para Safari no iPhone, com áudio contínuo e alertas visuais.
            </CardDescription>
          </CardHeader>
          <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <Wifi className="h-3.5 w-3.5 text-sky-400" />
              Baixa Latência WebRTC
            </span>
            <Link href="/monitor">
              <Button size="sm" variant="secondary">
                <span>Ver Transmissão</span>
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Security & System Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-800 bg-night-900/60 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-800/80 text-guard-400 border border-slate-700/60">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Isolamento RLS</p>
              <p className="text-sm font-bold text-white">100% Protegido</p>
            </div>
          </div>
        </Card>

        <Card className="border-slate-800 bg-night-900/60 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-800/80 text-sky-400 border border-slate-700/60">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Pareamento de Dispositivos</p>
              <Link href="/devices" className="text-sm font-bold text-guard-400 hover:underline">
                Gerenciar Dispositivos
              </Link>
            </div>
          </div>
        </Card>

        <Card className="border-slate-800 bg-night-900/60 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-800/80 text-emerald-400 border border-slate-700/60">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Detecção de Choro</p>
              <p className="text-sm font-bold text-white">Pronto p/ FASE 5</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
