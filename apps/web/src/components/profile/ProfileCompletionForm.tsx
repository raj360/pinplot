"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import {
  DEFAULT_PHONE_DIAL_CODE,
  combineToE164,
  dialCodeFromStored,
  nationalDigitsFromStored,
} from "@plotpin/shared-types";
import { PhoneVerificationNotice } from "@/components/profile/PhoneVerificationNotice";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import {
  IntlPhoneField,
  phoneValuesToE164,
} from "@/components/ui/intl-phone-field";
import {
  notifyProfileUpdated,
  updateMyProfile,
  type UserProfile,
} from "@/lib/api/profiles";
import { profileCompletionMessage } from "@/lib/auth/profile-complete";

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
  phoneDialCode: z.string().min(1),
  phoneNational: z.string().trim().min(1, { message: "Phone number is required" }),
  phoneSecondaryDialCode: z.string().optional(),
  phoneSecondaryNational: z.string().optional(),
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
}: {
  profile: UserProfile | null;
  email?: string;
  onSuccess?: () => void;
  onSkip?: () => void;
  showSkip?: boolean;
  submitLabel?: string;
  showVerification?: boolean;
}) {
  const isLandlord = profile?.role === "LANDLORD";

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(
      profileSchema as unknown as Parameters<typeof zodResolver>[0],
    ) as unknown as Resolver<ProfileFormData>,
    defaultValues: {
      firstName: profile?.first_name?.trim() ?? "",
      lastName: profile?.last_name?.trim() ?? "",
      phoneDialCode: profile?.phone
        ? dialCodeFromStored(profile.phone)
        : DEFAULT_PHONE_DIAL_CODE,
      phoneNational: profile?.phone
        ? nationalDigitsFromStored(profile.phone)
        : "",
      phoneSecondaryDialCode: profile?.phone_secondary
        ? dialCodeFromStored(profile.phone_secondary)
        : DEFAULT_PHONE_DIAL_CODE,
      phoneSecondaryNational: profile?.phone_secondary
        ? nationalDigitsFromStored(profile.phone_secondary)
        : "",
    },
  });

  async function onSubmit(values: ProfileFormData) {
    const phone = phoneValuesToE164(values.phoneDialCode, values.phoneNational);
    if (!phone) {
      form.setError("phoneNational", {
        message: "Enter a valid phone number for the selected country",
      });
      return;
    }

    let phoneSecondary: string | undefined;
    const secondaryNational = values.phoneSecondaryNational?.trim();
    if (secondaryNational) {
      phoneSecondary =
        phoneValuesToE164(
          values.phoneSecondaryDialCode ?? DEFAULT_PHONE_DIAL_CODE,
          secondaryNational,
        ) ?? undefined;
      if (!phoneSecondary) {
        form.setError("phoneSecondaryNational", {
          message: "Enter a valid secondary number or leave it blank",
        });
        return;
      }
      if (phoneSecondary === phone) {
        form.setError("phoneSecondaryNational", {
          message: "Secondary number must differ from your primary phone",
        });
        return;
      }
    }

    try {
      await updateMyProfile({
        firstName: values.firstName.trim(),
        lastName: values.lastName?.trim() || undefined,
        phone,
        phoneSecondary,
      });
      notifyProfileUpdated();
      onSuccess?.();
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
      className="space-y-4"
      noValidate
    >
      <p className="text-sm text-muted">
        {profileCompletionMessage(profile?.role)}
      </p>

      {email ? (
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

      <IntlPhoneField<ProfileFormData>
        id="profile-phone"
        label={
          isLandlord ? "Primary phone (tenant contact)" : "Primary phone"
        }
        dialCodeName="phoneDialCode"
        nationalName="phoneNational"
        register={form.register}
        nationalRegisterOptions={{
          setValueAs: (value: string) => value.replace(/[^\d\s-]/g, ""),
        }}
        nationalError={form.formState.errors.phoneNational}
        hint="Used for calls and WhatsApp where supported"
        defaultStored={profile?.phone}
      />

      <IntlPhoneField<ProfileFormData>
        id="profile-phone-secondary"
        label="Secondary phone"
        dialCodeName="phoneSecondaryDialCode"
        nationalName="phoneSecondaryNational"
        register={form.register}
        required={false}
        nationalRegisterOptions={{
          setValueAs: (value: string) => value.replace(/[^\d\s-]/g, ""),
        }}
        nationalError={form.formState.errors.phoneSecondaryNational}
        hint="Optional backup — e.g. Uganda line if your primary is abroad"
        defaultStored={profile?.phone_secondary}
      />

      {showVerification ? (
        <div className="space-y-2">
          <PhoneVerificationNotice
            phone={profile?.phone}
            verifiedAt={profile?.phone_verified_at}
            label="Primary phone"
          />
          {profile?.phone_secondary ? (
            <PhoneVerificationNotice
              phone={profile.phone_secondary}
              verifiedAt={profile.phone_secondary_verified_at}
              label="Secondary phone"
            />
          ) : null}
        </div>
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
