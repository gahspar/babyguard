"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, ArrowRight, AlertCircle, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("A senha deve possuir pelo menos 8 caracteres para proteção da transmissão.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas digitadas não conferem.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/callback`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (data.session) {
        router.push("/dashboard");
        router.refresh();
      } else {
        // Confirmation email required
        setSuccess(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao cadastrar usuário.";
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <Card className="border-slate-800 bg-night-900/90 shadow-2xl">
      <CardHeader>
        <CardTitle className="text-xl">Criar Conta do Proprietário</CardTitle>
        <CardDescription>
          Apenas um proprietário autorizado pode monitorar o bebê.
        </CardDescription>
      </CardHeader>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-800/60 bg-red-950/40 p-3 text-xs text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {success ? (
        <div className="space-y-4 py-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400">
            <CheckCircle className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-white text-base">Confirme seu E-mail</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Enviamos um link de confirmação para <strong className="text-white">{email}</strong>.
            Acesse o e-mail para ativar sua conta e liberar o monitoramento.
          </p>
          <Link href="/login" className="block pt-2">
            <Button variant="secondary" className="w-full">
              Voltar para o Login
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleRegister} className="space-y-4">
          <Input
            label="E-mail"
            type="email"
            placeholder="seu@email.com"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            label="Senha (mínimo 8 caracteres)"
            type="password"
            placeholder="••••••••"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Input
            label="Confirmar Senha"
            type="password"
            placeholder="••••••••"
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <Button
            type="submit"
            className="w-full mt-2"
            size="lg"
            isLoading={loading}
          >
            <span>Criar Conta e Proteger Acesso</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>
      )}

      <div className="mt-5 border-t border-slate-800 pt-4 text-center">
        <p className="text-xs text-slate-400">
          Já possui conta?{" "}
          <Link
            href="/login"
            className="font-semibold text-guard-400 hover:text-guard-300 transition"
          >
            Entrar
          </Link>
        </p>
      </div>
    </Card>
  );
}
