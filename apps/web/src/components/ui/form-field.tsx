"use client";

import type { InputHTMLAttributes } from "react";
import type {
  FieldError,
  FieldValues,
  Path,
  RegisterOptions,
  UseFormRegister,
} from "react-hook-form";
import { cn } from "@/lib/utils/cn";

type FormFieldProps<T extends FieldValues> = {
  id: string;
  label: string;
  name: Path<T>;
  register: UseFormRegister<T>;
  registerOptions?: RegisterOptions<T, Path<T>>;
  error?: FieldError;
  className?: string;
} & Pick<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "autoComplete" | "placeholder" | "inputMode" | "maxLength"
>;

/** LPMS-style field wired to react-hook-form + zod validation messages. */
export function FormField<T extends FieldValues>({
  id,
  label,
  name,
  register,
  registerOptions,
  error,
  className,
  type = "text",
  autoComplete,
  placeholder,
  inputMode,
  maxLength,
}: FormFieldProps<T>) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm">
        <span className="text-foreground">{label}</span>
        <input
          id={id}
          type={type}
          autoComplete={autoComplete}
          inputMode={inputMode}
          maxLength={maxLength}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          className={cn(
            "mt-1 w-full border bg-surface px-3 py-2 text-sm text-foreground",
            error
              ? "border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/30"
              : "border-border focus:outline-none focus:ring-2 focus:ring-primary/30",
          )}
          {...register(name, registerOptions)}
        />
      </label>
      {error ? (
        <p className="mt-1 text-xs text-red-600">{error.message}</p>
      ) : null}
    </div>
  );
}
