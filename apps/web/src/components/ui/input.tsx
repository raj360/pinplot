import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  compact?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, id, compact = false, ...props }, ref) => {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <label className={cn("block", compact ? "text-xs" : "text-sm")}>
        {label ? (
          <span className={cn("text-foreground", compact && "text-xs font-medium")}>
            {label}
          </span>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "mt-0.5 w-full border border-border bg-surface text-foreground",
            "focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/25",
            compact ? "px-2.5 py-1.5 text-sm" : "px-3 py-2 text-sm",
            className,
          )}
          {...props}
        />
        {hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
      </label>
    );
  },
);

Input.displayName = "Input";
