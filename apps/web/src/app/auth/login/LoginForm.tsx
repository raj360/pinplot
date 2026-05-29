"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { sendLoginCode, verifyLoginCode } from "@/lib/api/auth";
import { fetchMyProfile } from "@/lib/api/profiles";
import { isProfileIncomplete } from "@/lib/auth/profile-complete";
import { syncProfileAfterAuth } from "@/lib/auth/sync-profile";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";

const emailSchema = z.object({
  email: z.string().email({ message: "Enter a valid email address" }),
});

const otpSchema = z.object({
  code: z
    .string()
    .min(6, { message: "Enter the 6-digit code" })
    .max(6, { message: "Enter the 6-digit code" })
    .regex(/^\d{6}$/, { message: "Code must be 6 digits" }),
});

type EmailFormData = z.infer<typeof emailSchema>;
type OtpFormData = z.infer<typeof otpSchema>;

type Step = "email" | "otp";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/explore";
  const urlError = searchParams.get("error");

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [devHint, setDevHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(urlError);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(
      emailSchema as unknown as Parameters<typeof zodResolver>[0],
    ) as unknown as Resolver<EmailFormData>,
    defaultValues: { email: "" },
  });

  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(
      otpSchema as unknown as Parameters<typeof zodResolver>[0],
    ) as unknown as Resolver<OtpFormData>,
    defaultValues: { code: "" },
  });

  async function onSendCode(values: EmailFormData) {
    setError(null);
    setDevHint(null);
    setLoading(true);

    try {
      const result = await sendLoginCode(values.email);
      setEmail(values.email);
      if (result.devCode) {
        setDevHint(
          `Dev mode: your code is ${result.devCode} (also printed in the API terminal).`,
        );
      } else {
        setDevHint("Check your email for a 6-digit code from PlotPin.");
      }
      otpForm.reset({ code: "" });
      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send sign-in code");
    } finally {
      setLoading(false);
    }
  }

  async function onVerifyCode(values: OtpFormData) {
    setError(null);
    setLoading(true);

    try {
      const session = await verifyLoginCode(email, values.code);
      const supabase = createClient();
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });
      if (sessionError) throw sessionError;

      await syncProfileAfterAuth(session.access_token);

      let destination = next;
      try {
        const profile = await fetchMyProfile();
        if (isProfileIncomplete(profile)) {
          destination = `/auth/complete-profile?next=${encodeURIComponent(next)}`;
        }
      } catch {
        /* proceed to original destination; modal will prompt later */
      }

      router.push(destination);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid or expired code");
    } finally {
      setLoading(false);
    }
  }

  async function signInWithGoogle() {
    setError(null);
    setOauthLoading(true);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });

    if (oauthError) {
      setError(oauthError.message);
      setOauthLoading(false);
    }
  }

  function backToEmail() {
    setStep("email");
    setDevHint(null);
    setError(null);
    otpForm.reset({ code: "" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md border border-border bg-surface p-6">
        <h1 className="text-xl font-bold">Sign in to PlotPin</h1>
        <p className="mt-1 text-sm text-muted">
          Enter your email and we&apos;ll send a 6-digit code from PlotPin — no
          password required.
        </p>

        {step === "email" ? (
          <form
            onSubmit={emailForm.handleSubmit(onSendCode)}
            className="mt-6 space-y-4"
            noValidate
          >
            <FormField<EmailFormData>
              id="login-email"
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              register={emailForm.register}
              error={emailForm.formState.errors.email}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button
              type="submit"
              className="w-full"
              loading={loading}
              loadingLabel="Sending sign-in code"
            >
              Continue with email
            </Button>
          </form>
        ) : (
          <form
            onSubmit={otpForm.handleSubmit(onVerifyCode)}
            className="mt-6 space-y-4"
            noValidate
          >
            <p className="text-sm text-muted">
              Enter the 6-digit code for <strong>{email}</strong>.
            </p>
            {devHint && (
              <p className="border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-muted">
                {devHint}
              </p>
            )}
            <FormField<OtpFormData>
              id="login-code"
              label="Verification code"
              name="code"
              autoComplete="one-time-code"
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              register={otpForm.register}
              registerOptions={{
                setValueAs: (value: string) =>
                  value.replace(/\D/g, "").slice(0, 6),
              }}
              error={otpForm.formState.errors.code}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button
              type="submit"
              className="w-full"
              loading={loading}
              loadingLabel="Verifying code"
            >
              Verify and sign in
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={backToEmail}
            >
              Use a different email
            </Button>
          </form>
        )}

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-surface px-2 text-muted">Or</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          loading={oauthLoading}
          loadingLabel="Redirecting to Google"
          onClick={signInWithGoogle}
        >
          Continue with Google
        </Button>

        <p className="mt-4 text-xs text-muted">
          In development the code is printed in the API terminal. Production
          email delivery via Postmark is planned.
        </p>

        <Link href="/" className="mt-4 block text-sm text-muted">
          ← Back home
        </Link>
      </div>
    </div>
  );
}
