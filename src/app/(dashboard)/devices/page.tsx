"use client";

import React, { useState, useEffect } from "react";
import {
  Smartphone,
  Video,
  Plus,
  ShieldCheck,
  Trash2,
  Clock,
  KeyRound,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import {
  generateCryptographicPairingCode,
  hashPairingCode,
  PAIRING_CODE_TTL_MINUTES,
} from "@/lib/security/pairing-crypto";
import { DeviceRow } from "@/types/device";
import { formatDate } from "@/lib/utils";

export default function DevicesPage() {
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState("");
  const [targetType, setTargetType] = useState<"station" | "monitor">("monitor");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [codeExpiresAt, setCodeExpiresAt] = useState<Date | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchDevices = async () => {
    setLoading(true);
    const { data, error: fetchErr } = await supabase
      .from("devices")
      .select("*")
      .order("created_at", { ascending: false });

    if (!fetchErr && data) {
      setDevices(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleGenerateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsGenerating(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Usuário não autenticado.");

      const code = generateCryptographicPairingCode();
      const codeHash = await hashPairingCode(code, user.id);
      const expiresAt = new Date(Date.now() + PAIRING_CODE_TTL_MINUTES * 60 * 1000);

      const { error: insertErr } = await supabase.from("pairing_codes").insert({
        user_id: user.id,
        code_hash: codeHash,
        target_device_type: targetType,
        device_name: newDeviceName.trim() || `Dispositivo ${targetType}`,
        expires_at: expiresAt.toISOString(),
      });

      if (insertErr) throw insertErr;

      setGeneratedCode(code);
      setCodeExpiresAt(expiresAt);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao gerar código de pareamento.";
      setError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRevokeDevice = async (deviceId: string) => {
    const confirmRevoke = window.confirm(
      "Deseja revogar o acesso deste dispositivo? Ele será imediatamente desconectado e não conseguirá transmitir nem monitorar."
    );
    if (!confirmRevoke) return;

    const { error: revokeErr } = await supabase
      .from("devices")
      .update({
        is_active: false,
        revoked_at: new Date().toISOString(),
      })
      .eq("id", deviceId);

    if (!revokeErr) {
      fetchDevices();
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setGeneratedCode(null);
    setCodeExpiresAt(null);
    setNewDeviceName("");
    fetchDevices();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Dispositivos Pareados
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Apenas dispositivos expressamente autorizados pelo proprietário têm acesso à transmissão.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          <span>Parear Novo Dispositivo</span>
        </Button>
      </div>

      {/* Devices List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-guard-400" />
            <p className="text-xs">Carregando dispositivos autorizados...</p>
          </div>
        ) : devices.length === 0 ? (
          <Card className="col-span-full py-12 text-center border-dashed border-slate-800">
            <Smartphone className="h-10 w-10 mx-auto mb-3 text-slate-600" />
            <h3 className="text-base font-bold text-white">Nenhum dispositivo pareado ainda</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
              Gere um código de pareamento seguro para conectar a Estação da Câmera (PC/Android) ou o Monitor (iPhone).
            </p>
            <Button size="sm" onClick={() => setModalOpen(true)}>
              Gerar Primeiro Código
            </Button>
          </Card>
        ) : (
          devices.map((device) => {
            const isTransmitter = device.type === "station";
            const Icon = isTransmitter ? Video : Smartphone;

            return (
              <Card
                key={device.id}
                className={
                  !device.is_active
                    ? "opacity-60 border-slate-900 bg-night-950/40"
                    : "border-slate-800 bg-night-900/80"
                }
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                        isTransmitter
                          ? "bg-guard-600/20 border-guard-500/30 text-guard-400"
                          : "bg-sky-600/20 border-sky-500/30 text-sky-400"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{device.name}</h4>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Fingerprint: {device.device_fingerprint.slice(0, 16)}...
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant={device.is_active ? "success" : "danger"}
                    size="sm"
                  >
                    {device.is_active ? "Autorizado" : "Revogado"}
                  </Badge>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-500" />
                    <span>Último acesso: {formatDate(device.last_seen_at)}</span>
                  </div>

                  {device.is_active && (
                    <button
                      onClick={() => handleRevokeDevice(device.id)}
                      className="text-red-400 hover:text-red-300 flex items-center gap-1 text-xs font-medium transition"
                      title="Revogar Acesso Imediatamente"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Revogar</span>
                    </button>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Modal de Pareamento Seguro */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title="Pareamento Seguro de Dispositivo"
        description="Gere um token de uso único com expiração curta para autorizar uma nova câmera ou monitor."
      >
        {generatedCode ? (
          <div className="space-y-5 text-center py-2">
            <div className="rounded-2xl border border-guard-500/40 bg-guard-950/40 p-5">
              <span className="text-xs uppercase font-semibold text-guard-400 tracking-wider">
                Código de Pareamento de Uso Único
              </span>
              <div className="mt-2 text-4xl font-mono font-black tracking-widest text-white">
                {generatedCode}
              </div>
              <p className="mt-2 text-xs text-slate-300">
                Digite este código no dispositivo receptor ou transmissor para concluir a vinculação.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-amber-400 bg-amber-950/30 border border-amber-800/50 rounded-xl p-3">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>
                Válido por <strong>{PAIRING_CODE_TTL_MINUTES} minutos</strong>. Nunca compartilhe este código com terceiros.
              </span>
            </div>

            <Button onClick={closeModal} className="w-full">
              Concluir e Fechar
            </Button>
          </div>
        ) : (
          <form onSubmit={handleGenerateCode} className="space-y-4">
            {error && (
              <div className="rounded-xl border border-red-800/60 bg-red-950/40 p-3 text-xs text-red-300">
                {error}
              </div>
            )}

            <Input
              label="Nome de Identificação"
              placeholder="Ex: Webcam Logitech Sala, iPhone Mãe"
              required
              value={newDeviceName}
              onChange={(e) => setNewDeviceName(e.target.value)}
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Tipo do Dispositivo
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTargetType("station")}
                  className={`flex items-center justify-center gap-2 rounded-xl p-3 border text-xs font-bold transition ${
                    targetType === "station"
                      ? "border-guard-500 bg-guard-950/60 text-guard-300"
                      : "border-slate-800 bg-night-900 text-slate-400"
                  }`}
                >
                  <Video className="h-4 w-4" />
                  <span>Estação Câmera</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetType("monitor")}
                  className={`flex items-center justify-center gap-2 rounded-xl p-3 border text-xs font-bold transition ${
                    targetType === "monitor"
                      ? "border-sky-500 bg-sky-950/60 text-sky-300"
                      : "border-slate-800 bg-night-900 text-slate-400"
                  }`}
                >
                  <Smartphone className="h-4 w-4" />
                  <span>Monitor Bebê</span>
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full mt-2"
              isLoading={isGenerating}
            >
              <KeyRound className="mr-2 h-4 w-4" />
              <span>Gerar Código de Pareamento Criptográfico</span>
            </Button>
          </form>
        )}
      </Modal>
    </div>
  );
}
