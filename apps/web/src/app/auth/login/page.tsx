import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md border border-border bg-surface p-6">
        <h1 className="text-xl font-bold">Sign in</h1>
        <p className="mt-2 text-sm text-muted">
          Supabase Auth (email + phone OTP) — Sprint 2.
        </p>
        <Link href="/" className="mt-4 inline-block text-sm text-primary">
          ← Back home
        </Link>
      </div>
    </div>
  );
}
