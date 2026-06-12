"use client";

import type { FieldError } from "react-hook-form";
import PhoneInput, {
  type Country,
  type Value,
} from "react-phone-number-input";
import en from "react-phone-number-input/locale/en.json";
import { parsePhoneNumber } from "libphonenumber-js";
import { cn } from "@/lib/utils/cn";
import {
  callingCodePrefix,
  clampPhoneValue,
  countryFromE164,
  isBareCallingCode,
  toPhoneInputValue,
} from "@/lib/profile/phone-input";

type IntlPhoneFieldProps = {
  id: string;
  label: string;
  value: Value | undefined;
  onChange: (value: Value | undefined) => void;
  onBlur?: () => void;
  error?: FieldError;
  hint?: string;
  required?: boolean;
  defaultCountry?: Country;
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
  defaultCountry = "GB",
}: IntlPhoneFieldProps) {
  const activeCountry = countryFromE164(value, defaultCountry);
  const inputValue = toPhoneInputValue(value) as Value | undefined;

  function emit(next: Value | undefined) {
    if (!next?.trim()) {
      if (required) {
        onChange(callingCodePrefix(defaultCountry) as Value);
      } else {
        onChange(undefined);
      }
      return;
    }

    const country = countryFromE164(next, defaultCountry);
    onChange(clampPhoneValue(next, country, defaultCountry) as Value);
  }

  function handleChange(next: Value) {
    emit(next);
  }

  /** User picked a flag from the dropdown — ignore undefined from typing. */
  function handleCountryChange(nextCountry: Country | undefined) {
    if (!nextCountry) return;

    const prefix = callingCodePrefix(nextCountry, defaultCountry);
    if (!value?.trim() || isBareCallingCode(value, activeCountry, defaultCountry)) {
      onChange(prefix as Value);
      return;
    }

    try {
      const parsed = parsePhoneNumber(value);
      const national = parsed?.nationalNumber;
      if (national) {
        const reformatted = parsePhoneNumber(`${prefix}${national}`, nextCountry);
        onChange(
          (reformatted?.number ?? prefix) as Value,
        );
        return;
      }
    } catch {
      /* fall through */
    }

    onChange(prefix as Value);
  }

  function handleBlur() {
    if (!required && isBareCallingCode(value, activeCountry, defaultCountry)) {
      onChange(undefined);
    }
    onBlur?.();
  }

  function handleFocus() {
    if (!value?.trim()) {
      emit(callingCodePrefix(defaultCountry) as Value);
    }
  }

  return (
    <div>
      <label htmlFor={id} className="block text-sm">
        <span className="text-foreground">
          {label}
          {required ? "" : " (optional)"}
        </span>
        <PhoneInput
          id={id}
          country={activeCountry}
          onCountryChange={handleCountryChange}
          international
          countryCallingCodeEditable={false}
          limitMaxLength
          defaultCountry={defaultCountry}
          labels={en}
          value={inputValue}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-invalid={error ? true : undefined}
          className={cn(
            "PlotPinPhoneInput mt-1",
            error && "PlotPinPhoneInput--error",
          )}
          numberInputProps={{
            autoComplete: "tel",
            inputMode: "tel",
            placeholder: `${callingCodePrefix(activeCountry, defaultCountry)} …`,
            onFocus: handleFocus,
          }}
        />
      </label>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
      {error ? (
        <p className="mt-1 text-xs text-red-600">{error.message}</p>
      ) : null}
    </div>
  );
}
