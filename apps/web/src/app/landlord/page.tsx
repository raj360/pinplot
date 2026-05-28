import Link from "next/link";

export default function LandlordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md border border-border bg-surface p-6">
        <h1 className="text-xl font-bold">Landlord portal</h1>
        <p className="mt-2 text-sm text-muted">
          List buildings, manage units, and pay per status update.
        </p>
        <Link
          href="/landlord/dashboard"
          className="mt-4 inline-block bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          Open dashboard
        </Link>
        <Link href="/" className="mt-4 block text-sm text-primary">
          ← Back home
        </Link>
      </div>
    </div>
  );
}
