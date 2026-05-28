import Link from "next/link";
import { PRICING } from "@plotpin/shared-types";

export default function LandlordDashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-primary text-primary-foreground">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="font-semibold">
            PlotPin
          </Link>
          <span className="text-sm">Landlord dashboard</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-bold">Your buildings</h1>
        <p className="mt-2 text-sm text-muted">
          Mark units available or unavailable —{" "}
          {PRICING.landlordListingFeeUgx.toLocaleString()} UGX per status change
          (payments in Sprint 3).
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link
            href="/landlord/new"
            className="border border-dashed border-border bg-surface p-6 text-center text-sm text-primary"
          >
            + Add building (auth required — Sprint 2)
          </Link>
        </div>

        <Link href="/explore" className="mt-8 inline-block text-sm text-primary">
          ← Browse map
        </Link>
      </main>
    </div>
  );
}
