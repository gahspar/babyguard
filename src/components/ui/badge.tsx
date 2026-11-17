import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "success" | "warning" | "danger" | "info" | "neutral";
  size?: "sm" | "md";
}

export function Badge({
  className,
  variant = "neutral",
  size = "md",
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    success: "bg-emerald-950/70 text-emerald-400 border-emerald-800/60",
    warning: "bg-amber-950/70 text-amber-400 border-amber-800/60",
    danger: "bg-rose-950/70 text-rose-400 border-rose-800/60",
    info: "bg-sky-950/70 text-sky-400 border-sky-800/60",
    neutral: "bg-slate-800/80 text-slate-300 border-slate-700/60",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-semibold rounded-full border tracking-wide uppercase",
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
