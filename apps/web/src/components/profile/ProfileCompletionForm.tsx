"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import type { Country } from "react-phone-number-input";
import { ProfileAccountSummary } from "@/components/profile/ProfileAccountSummary";
import { ProfilePhoneVerificationSummary } from "@/components/profile/PhoneVerificationNotice";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { IntlPhoneField } from "@/components/ui/intl-phone-field";
import {
  notifyProfileUpdated,
  updateMyProfile,
  type UserProfile,
} from "@/lib/api/profiles";
import { profileCompletionMessage } from "@/lib/auth/profile-complete";
import {
  isCompletePhoneNumber,
  normalizePhoneE164,
  primaryPhoneLabel,
  toPhoneInputValue,
} from "@/lib/profile/phone-input";
import { resolveProfilePhoneDefaultCountry } from "@/lib/profile/phone-default-country";

function storedPhoneValue(stored: string | null | undefined) {
  if (!stored?.trim() || stored.includes("@")) return "";
  return toPhoneInputValue(stored) ?? "";
}

function profileToFormValues(profile: UserProfile | null): ProfileFormData {
  return {
    firstName: profile?.first_name?.trim() ?? "",
    lastName: profile?.last_name?.trim() ?? "",
    phone: storedPhoneValue(profile?.phone),
    phoneSecondary: storedPhoneValue(profile?.phone_secondary),
  };
}

const profileSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, { message: "First name is required" })
    .max(80, { message: "First name is too long" }),
  lastName: z
    .string()
    .trim()
    .max(80, { message: "Last name is too long" })
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .trim()
    .min(1, { message: "Phone number is required" })
    .refine((value) => isCompletePhoneNumber(value), {
      message: "Enter a complete number after the country code (e.g. +44 7911 123456)",
    }),
  phoneSecondary: z
    .string()
    .optional()
    .refine((value) => !value?.trim() || isCompletePhoneNumber(value), {
      message: "Enter a complete secondary number or leave it blank",
    }),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function ProfileCompletionForm({
  profile,
  email,
  onSuccess,
  onSkip,
  showSkip = false,
  submitLabel = "Save profile",
  showVerification = false,
  compact = false,
}: {
  profile: UserProfile | null;
  email?: string;
  onSuccess?: (profile: UserProfile) => void;
  onSkip?: () => void;
  showSkip?: boolean;
  submitLabel?: string;
  showVerification?: boolean;
  /** Tighter layout for /settings — skips long intro copy. */
  compact?: boolean;
}) {
  const formValues = useMemo(() => profileToFormValues(profile), [profile]);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(
      profileSchema as unknown as Parameters<typeof zodResolver>[0],
    ) as unknown as Resolver<ProfileFormData>,
    defaultValues: formValues,
    values: formValues,
  });

  const watched = form.watch();
  const summaryProfile: UserProfile | null = profile
    ? {
        ...profile,
        first_name: watched.firstName || null,
        last_name: watched.lastName || null,
        phone: watched.phone || null,
        phone_secondary: watched.phoneSecondary || null,
      }
    : null;

  async function onSubmit(values: ProfileFormData) {
    const phoneSecondary = values.phoneSecondary?.trim();
    if (phoneSecondary && phoneSecondary === values.phone) {
      form.setError("phoneSecondary", {
        message: "Secondary number must differ from your primary phone",
      });
      return;
    }

    try {
      const phone = normalizePhoneE164(values.phone) ?? values.phone;
      const phoneSecondaryRaw = phoneSecondary
        ? normalizePhoneE164(phoneSecondary) ?? phoneSecondary
        : undefined;

      const updated = await updateMyProfile({
        firstName: values.firstName.trim(),
        lastName: values.lastName?.trim() || undefined,
        phone,
        phoneSecondary: phoneSecondaryRaw,
      });
      form.reset(profileToFormValues(updated));
      notifyProfileUpdated();
      onSuccess?.(updated);
    } catch (err) {
      form.setError("root", {
        message:
          err instanceof Error ? err.message : "Could not save your profile",
      });
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className={compact ? "space-y-3" : "space-y-4"}
      noValidate
    >
      {compact ? (
        <ProfileAccountSummary profile={summaryProfile} email={email} />
      ) : null}

      {!compact ? (
        <p className="text-sm text-muted">
          {profileCompletionMessage(profile?.role)}
        </p>
      ) : null}

      {!compact && email ? (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Email
          </p>
          <p className="mt-1 text-sm">{email}</p>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField<ProfileFormData>
          id="profile-first-name"
          label="First name"
          name="firstName"
          autoComplete="given-name"
          placeholder="Raymond"
          register={form.register}
          error={form.formState.errors.firstName}
        />
        <FormField<ProfileFormData>
          id="profile-last-name"
          label="Last name (optional)"
          name="lastName"
          autoComplete="family-name"
          placeholder="Okello"
          register={form.register}
          error={form.formState.errors.lastName}
        />
      </div>

      <Controller
        name="phone"
        control={form.control}
        render={({ field, fieldState }) => (
          <IntlPhoneField
            id="profile-phone"
            label={primaryPhoneLabel(profile?.role)}
            value={field.value || undefined}
            onChange={(value) => field.onChange(value ?? "")}
            onBlur={field.onBlur}
            error={fieldState.error}
            defaultCountry={
              resolveProfilePhoneDefaultCountry(profile, field.value) as Country
            }
            hint={
              compact
                ? "Country code stays fixed. Extra digits are blocked at the max for that country."
                : "Country code is added automatically. Length is limited to a valid number."
            }
          />
        )}
      />

      <Controller
        name="phoneSecondary"
        control={form.control}
        render={({ field, fieldState }) => (
          <IntlPhoneField
            id="profile-phone-secondary"
            label="Secondary phone"
            value={field.value || undefined}
            onChange={(value) => field.onChange(value ?? "")}
            onBlur={field.onBlur}
            error={fieldState.error}
            required={false}
            defaultCountry={
              resolveProfilePhoneDefaultCountry(
                profile,
                field.value || form.watch("phone"),
              ) as Country
            }
            hint={
              compact
                ? "Optional. Country code is added when you pick a flag."
                : "Optional backup line in another country"
            }
          />
        )}
      />

      {showVerification ? (
        <ProfilePhoneVerificationSummary profile={profile} />
      ) : null}

      {form.formState.errors.root ? (
        <p className="text-sm text-red-600">
          {form.formState.errors.root.message}
        </p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button
          type="submit"
          className="sm:flex-1"
          loading={form.formState.isSubmitting}
          loadingLabel="Saving profile"
        >
          {submitLabel}
        </Button>
        {showSkip && onSkip ? (
          <Button type="button" variant="ghost" onClick={onSkip}>
            Remind me later
          </Button>
        ) : null}
      </div>
    </form>
  );
}
