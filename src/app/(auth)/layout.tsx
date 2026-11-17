import React from "react";
import { ShieldCheck, Lock } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-night-950 flex flex-col justify-center items-center p-4 selection:bg-guard-500 selection:text-white">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-guard-600/20 border border-guard-500/30 text-guard-400 shadow-xl shadow-guard-950">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            BABYGUARD
          </h1>
          <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5 font-medium">
            <Lock className="h-3 w-3 text-guard-400" />
            Babá Eletrônica IP Privada • Criptografia P2P
          </p>
        </div>

        {children}

        <footer className="text-center text-[11px] text-slate-500">
          Acesso estritamente privado ao proprietário autorizado.
        </footer>
      </div>
    </div>
  );
}
