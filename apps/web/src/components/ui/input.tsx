import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", type = "text", label, error, id, ...props }, ref) => {
    const inputId = id || React.useId();
    const [showPassword, setShowPassword] = React.useState(false);
    const isPassword = type === "password";
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;
    
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-semibold text-foreground">
            {label}
          </label>
        )}
        <div className="relative flex items-center w-full">
          <input
            id={inputId}
            type={inputType}
            ref={ref}
            onFocus={(e) => {
              if (type === "number") {
                e.target.select();
              }
              props.onFocus?.(e);
            }}
            className={`h-11 w-full rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400/80 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 shadow-xs transition-all disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-800/60 disabled:border-slate-200 dark:disabled:border-slate-800 disabled:text-slate-400 ${
              error ? "border-red-500 focus:ring-red-500/50 focus:border-red-500" : ""
            } ${isPassword ? "pr-10" : ""} ${className}`}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 flex items-center justify-center text-muted-foreground hover:text-foreground focus:outline-none transition-colors cursor-pointer"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          )}
        </div>
        {error && <span className="text-xs text-danger font-medium mt-0.5">{error}</span>}
      </div>
    );
  }
);
Input.displayName = "Input";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", label, error, id, rows = 3, ...props }, ref) => {
    const inputId = id || React.useId();

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-semibold text-foreground">
            {label}
          </label>
        )}
        <textarea
          id={inputId}
          ref={ref}
          rows={rows}
          className={`w-full rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400/80 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 shadow-xs transition-all disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-800/60 disabled:border-slate-200 dark:disabled:border-slate-800 disabled:text-slate-400 ${
            error ? "border-red-500 focus:ring-red-500/50" : ""
          } ${className}`}
          {...props}
        />
        {error && <span className="text-xs text-danger font-medium mt-0.5">{error}</span>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
