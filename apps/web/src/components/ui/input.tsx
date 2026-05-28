import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, id, ...props }, ref) => {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <label className="block text-sm">
        {label ? <span className="text-foreground">{label}</span> : null}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "mt-1 w-full border border-border bg-surface px-3 py-2 text-sm text-foreground",
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
