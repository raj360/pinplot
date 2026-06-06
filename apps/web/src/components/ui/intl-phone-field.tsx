"use client";

import type { FieldError } from "react-hook-form";
import PhoneInput, {
  type Country,
  type Value,
} from "react-phone-number-input";
import en from "react-phone-number-input/locale/en.json";
import { formatPhoneDisplay } from "@plotpin/shared-types";
import { cn } from "@/lib/utils/cn";

type IntlPhoneFieldProps = {
  id: string;
  label: string;
  value: Value;
  onChange: (value: Value) => void;
  onBlur?: () => void;
  error?: FieldError;
  hint?: string;
  required?: boolean;
  defaultCountry?: Country;
  defaultStored?: string | null;
};

export function IntlPhoneField({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  hint,
  required = true,
  defaultCountry = "UG",
  defaultStored,
}: IntlPhoneFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm">
        <span className="text-foreground">
          {label}
          {required ? "" : " (optional)"}
        </span>
        <PhoneInput
          id={id}
          international
          countryCallingCodeEditable={false}
          defaultCountry={defaultCountry}
          labels={en}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          aria-invalid={error ? true : undefined}
          className={cn(
            "PlotPinPhoneInput mt-1",
            error && "PlotPinPhoneInput--error",
          )}
          numberInputProps={{
            autoComplete: "tel-national",
            inputMode: "tel",
            placeholder: "Phone number",
          }}
        />
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
