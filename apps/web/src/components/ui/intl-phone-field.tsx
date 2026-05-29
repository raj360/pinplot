"use client";

import type {
  FieldError,
  Path,
  RegisterOptions,
  UseFormRegister,
} from "react-hook-form";
import {
  PHONE_COUNTRIES,
  combineToE164,
  formatPhoneDisplay,
  type PhoneCountry,
} from "@plotpin/shared-types";
import { cn } from "@/lib/utils/cn";

type IntlPhoneFieldProps<T extends Record<string, unknown>> = {
  id: string;
  label: string;
  dialCodeName: Path<T>;
  nationalName: Path<T>;
  register: UseFormRegister<T>;
  dialCodeRegisterOptions?: RegisterOptions<T, Path<T>>;
  nationalRegisterOptions?: RegisterOptions<T, Path<T>>;
  dialCodeError?: FieldError;
  nationalError?: FieldError;
  hint?: string;
  required?: boolean;
  defaultStored?: string | null;
  defaultDialCode?: string;
};

export function IntlPhoneField<T extends Record<string, unknown>>({
  id,
  label,
  dialCodeName,
  nationalName,
  register,
  dialCodeRegisterOptions,
  nationalRegisterOptions,
  dialCodeError,
  nationalError,
  hint,
  required = true,
  defaultStored,
}: IntlPhoneFieldProps<T>) {
  const error = nationalError ?? dialCodeError;

  return (
    <div>
      <label htmlFor={`${id}-national`} className="block text-sm">
        <span className="text-foreground">
          {label}
          {required ? "" : " (optional)"}
        </span>
        <div className="mt-1 flex">
          <select
            id={`${id}-country`}
            aria-label={`${label} country code`}
            className={cn(
              "max-w-[9.5rem] shrink-0 border border-r-0 bg-muted/40 px-2 py-2 text-sm text-foreground",
              error
                ? "border-red-600"
                : "border-border",
            )}
            {...register(dialCodeName, dialCodeRegisterOptions)}
          >
            {PHONE_COUNTRIES.map((country: PhoneCountry) => (
              <option key={country.code} value={country.dialCode}>
                +{country.dialCode} {country.name}
              </option>
            ))}
          </select>
          <input
            id={`${id}-national`}
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder="Phone number"
            aria-invalid={error ? true : undefined}
            className={cn(
              "min-w-0 flex-1 border bg-surface px-3 py-2 text-sm text-foreground",
              error
                ? "border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/30"
                : "border-border focus:outline-none focus:ring-2 focus:ring-primary/30",
            )}
            {...register(nationalName, nationalRegisterOptions)}
          />
        </div>
      </label>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
      {defaultStored && !defaultStored.includes("@") ? (
        <p className="mt-1 text-xs text-muted">
          Saved as {formatPhoneDisplay(defaultStored)}
        </p>
      ) : null}
      {error ? (
        <p className="mt-1 text-xs text-red-600">{error.message}</p>
      ) : null}
    </div>
  );
}

/** Combine react-hook-form dial + national values into E.164. */
export function phoneValuesToE164(dialCode: string, national: string) {
  return combineToE164(dialCode, national);
}
