"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, AlertCircle, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const supabase = createClient();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/callback?next=/settings`,
        }
      );

      if (resetError) {
        setError(resetError.message);
        setLoading(false);
        return;
      }

      setSent(true);
      setLoading(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao enviar e-mail de recuperação.";
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <Card className="border-slate-800 bg-night-900/90 shadow-2xl">
      <CardHeader>
        <CardTitle className="text-xl">Recuperar Senha</CardTitle>
        <CardDescription>
          Enviaremos um link seguro para redefinir sua credencial.
        </CardDescription>
      </CardHeader>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-800/60 bg-red-950/40 p-3 text-xs text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {sent ? (
        <div className="space-y-4 py-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400">
            <CheckCircle className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-white text-base">E-mail Enviado</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Se houver uma conta cadastrada para <strong className="text-white">{email}</strong>,
            você receberá um link seguro de recuperação nos próximos minutos.
          </p>
          <Link href="/login" className="block pt-2">
            <Button variant="secondary" className="w-full">
              Voltar para o Login
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleReset} className="space-y-4">
          <Input
            label="E-mail Cadastrado"
            type="email"
            placeholder="seu@email.com"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Button
            type="submit"
            className="w-full mt-2"
            size="lg"
            isLoading={loading}
          >
            <span>Enviar Link de Recuperação</span>
          </Button>
        </form>
      )}

      <div className="mt-5 border-t border-slate-800 pt-4 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar para tela de login
        </Link>
      </div>
    </Card>
  );
}
