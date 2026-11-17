"use client";

import Link from "next/link";
import { ShieldCheck, Video, Smartphone, Settings, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface HeaderProps {
  userEmail?: string | null;
}

export function Header({ userEmail }: HeaderProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-night-900/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-guard-600/20 border border-guard-500/40 text-guard-400 group-hover:scale-105 transition">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-white text-base">BABYGUARD</span>
              <span className="rounded bg-guard-950/80 px-1.5 py-0.5 text-[10px] font-semibold text-guard-400 border border-guard-800/50">
                P2P SECURE
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Babá Eletrônica IP Privada</p>
          </div>
        </Link>

        {userEmail && (
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <span className="block text-xs font-semibold text-slate-200">{userEmail}</span>
              <span className="text-[10px] text-emerald-400 font-mono flex items-center justify-end gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Sessão Criptografada
              </span>
            </div>

            <button
              onClick={handleLogout}
              title="Encerrar Sessão Segura"
              className="flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-red-950/40 hover:text-red-300 hover:border-red-800/60 transition"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
