"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, AlertCircle, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(signInError.message || "Credenciais inválidas. Verifique seu e-mail e senha.");
        setLoading(false);
        return;
      }

      if (data.session) {
        router.push(redirectPath);
        router.refresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro inesperado ao realizar login.";
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <Card className="border-slate-800 bg-night-900/90 shadow-2xl">
      <CardHeader>
        <CardTitle className="text-xl">Autenticação do Proprietário</CardTitle>
        <CardDescription>
          Informe suas credenciais para gerenciar a babá eletrônica.
        </CardDescription>
      </CardHeader>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-800/60 bg-red-950/40 p-3 text-xs text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <Input
          label="E-mail"
          type="email"
          placeholder="seu@email.com"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Senha
            </label>
            <Link
              href="/forgot"
              className="text-xs text-guard-400 hover:text-guard-300 transition"
            >
              Esqueceu a senha?
            </Link>
          </div>
          <Input
            type="password"
            placeholder="••••••••"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <Button
          type="submit"
          className="w-full mt-2"
          size="lg"
          isLoading={loading}
        >
          <span>Acessar Painel Seguro</span>
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </form>

      <div className="mt-5 border-t border-slate-800 pt-4 text-center">
        <p className="text-xs text-slate-400">
          Primeira vez aqui?{" "}
          <Link
            href="/register"
            className="font-semibold text-guard-400 hover:text-guard-300 transition"
          >
            Cadastrar Conta do Proprietário
          </Link>
        </p>
      </div>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <Card className="border-slate-800 bg-night-900/90 p-8 text-center text-slate-400">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-guard-400" />
          <p className="text-xs mt-2">Carregando formulário seguro...</p>
        </Card>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
