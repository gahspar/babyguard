"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Video, Smartphone, Settings, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export function Nav() {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Início",
      href: "/dashboard",
      icon: LayoutDashboard,
      active: pathname === "/dashboard",
    },
    {
      label: "Estação Câmera",
      href: "/station",
      icon: Video,
      active: pathname === "/station",
    },
    {
      label: "Monitor Bebê",
      href: "/monitor",
      icon: Shield,
      active: pathname === "/monitor",
    },
    {
      label: "Dispositivos",
      href: "/devices",
      icon: Smartphone,
      active: pathname === "/devices",
    },
    {
      label: "Ajustes",
      href: "/settings",
      icon: Settings,
      active: pathname === "/settings",
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800 bg-night-900/95 backdrop-blur-lg sm:static sm:border-t-0 sm:border-b sm:bg-night-850/50">
      <div className="mx-auto flex max-w-6xl items-center justify-around px-2 py-1.5 sm:justify-start sm:gap-2 sm:px-6 sm:py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-150 sm:flex-row sm:gap-2 sm:px-4 sm:py-2",
                item.active
                  ? "text-guard-400 bg-guard-950/60 border border-guard-800/40"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="text-[11px] sm:text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
