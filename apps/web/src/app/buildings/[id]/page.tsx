import Link from "next/link";
import { notFound } from "next/navigation";
import { BuildingDetailPanel } from "@/components/buildings/BuildingDetailPanel";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageMain } from "@/components/layout/PageShell";
import { fetchBuilding } from "@/lib/api/buildings";
import { PRICING } from "@plotpin/shared-types";

type Props = { params: Promise<{ id: string }> };

export default async function BuildingPage({ params }: Props) {
  const { id } = await params;

  let building;
  try {
    building = await fetchBuilding(id);
  } catch {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        backHref="/explore"
        backLabel="← Back to map"
      />

      <PageMain>
        <BuildingDetailPanel building={building} />
        <section className="mt-8 border border-border bg-surface p-4">
          <h2 className="font-semibold">Unlock contact</h2>
          <p className="mt-2 text-sm text-muted">
            Pay {PRICING.tenantUnlockFeeUgx.toLocaleString()} UGX to reveal exact
            location and landlord phone. First successful payment wins exclusive
            access for {PRICING.unlockExclusiveHours} hours. Payments — Sprint 3.
          </p>
          <Link
            href="/auth/login"
            className="mt-4 inline-block bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            Sign in to unlock
          </Link>
        </section>
      </PageMain>
    </div>
  );
}
