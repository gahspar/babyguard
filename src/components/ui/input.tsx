import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", label, error, helperText, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          ref={ref}
          className={cn(
            "w-full rounded-xl bg-night-850 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 border border-slate-700/80 transition-all duration-200 focus:border-guard-500 focus:outline-none focus:ring-1 focus:ring-guard-500 disabled:opacity-50 disabled:bg-slate-900",
            error && "border-alert-500 focus:border-alert-500 focus:ring-alert-500",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-alert-500 font-medium">{error}</p>}
        {helperText && !error && (
          <p className="text-xs text-slate-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
