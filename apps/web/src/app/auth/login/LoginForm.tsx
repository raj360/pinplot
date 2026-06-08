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
import { PlotPinLogo } from "@/components/brand/PlotPinLogo";
import { GoogleIcon } from "@/components/icons/GoogleIcon";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { cn } from "@/lib/utils/cn";

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
    <div className="flex min-h-screen bg-background">
      {/* Brand panel — desktop only */}
      <aside
        className="relative hidden w-[min(42%,480px)] shrink-0 overflow-hidden bg-primary lg:flex lg:flex-col lg:justify-between lg:p-10"
        aria-hidden
      >
        <div
          className="pointer-events-none absolute inset-0 bg-linear-to-br from-primary via-primary to-[#1e40af] opacity-100"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-16 -top-24 size-64 rounded-full bg-white/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-20 -left-12 size-72 rounded-full bg-white/5 blur-3xl"
          aria-hidden
        />

        <div className="relative z-10">
          <PlotPinLogo variant="white" height={32} href="/" priority />
        </div>

        <div className="relative z-10 space-y-4">
          <p className="text-sm font-medium uppercase tracking-widest text-primary-foreground/70">
            Map-first rentals
          </p>
          <h1 className="max-w-sm text-2xl font-bold leading-snug text-primary-foreground">
            Browse on the map. Unlock the landlord when you are ready.
          </h1>
          <p className="max-w-sm text-sm leading-relaxed text-primary-foreground/80">
            Uganda supply, global discovery — prices shown in your familiar
            currency.
          </p>
        </div>

        <p className="relative z-10 text-xs text-primary-foreground/60">
          © PlotPin
        </p>
      </aside>

      {/* Form panel */}
      <div className="flex flex-1 flex-col items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <PlotPinLogo variant="icon" height={48} href="/" priority />
            <div className="mt-3">
              <PlotPinLogo variant="colored" height={24} href={null} />
            </div>
          </div>

          <div className="border border-border bg-surface p-6 shadow-card sm:p-8">
            <div className="mb-6 hidden text-center lg:block">
              <PlotPinLogo variant="icon" height={44} href={null} />
            </div>

            <h2 className="text-xl font-bold tracking-tight">Sign in</h2>
            <p className="mt-1 text-sm text-muted">
              {step === "email"
                ? "Enter your email — we will send a 6-digit code. No password needed."
                : "Enter the code we sent to your inbox."}
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
                {error ? <p className="text-sm text-red-600">{error}</p> : null}
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
                  Code sent to <strong className="text-foreground">{email}</strong>
                </p>
                {devHint ? (
                  <p className="border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-muted">
                    {devHint}
                  </p>
                ) : null}
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
                {error ? <p className="text-sm text-red-600">{error}</p> : null}
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
              className={cn(
                "w-full gap-2.5 bg-surface font-medium",
                "hover:bg-neutral-25",
              )}
              loading={oauthLoading}
              loadingLabel="Redirecting to Google"
              onClick={signInWithGoogle}
            >
              {!oauthLoading ? <GoogleIcon className="shrink-0" /> : null}
              Continue with Google
            </Button>

            <p className="mt-4 text-xs leading-relaxed text-muted">
              By signing in you agree to our{" "}
              <Link href="/terms" className="text-primary hover:underline">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </div>

          <Link
            href="/"
            className="mt-6 block text-center text-sm text-muted hover:text-foreground"
          >
            ← Back home
          </Link>
        </div>
      </div>
    </div>
  );
}
