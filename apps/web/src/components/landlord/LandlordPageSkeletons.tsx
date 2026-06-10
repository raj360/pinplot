import { Skeleton } from "@/components/ui/skeleton";

function StatCardSkeleton() {
  return (
    <div className="card-elevated px-4 py-3">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="mt-3 h-8 w-10" />
    </div>
  );
}

export function LandlordStatCardsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <dl className="grid gap-3 sm:grid-cols-3" aria-hidden>
      {Array.from({ length: count }, (_, index) => (
        <StatCardSkeleton key={index} />
      ))}
    </dl>
  );
}

export function LandlordBuildingRowSkeleton() {
  return (
    <li className="card-elevated flex flex-wrap items-center justify-between gap-3 p-4">
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-5 w-48 max-w-full" />
        <Skeleton className="h-4 w-64 max-w-full" />
        <Skeleton className="h-3 w-36" />
      </div>
      <Skeleton className="h-6 w-24 shrink-0" />
      <Skeleton className="h-8 w-24 shrink-0" />
    </li>
  );
}

/** Stats + building list placeholders for the landlord dashboard. */
export function LandlordDashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading buildings">
      <LandlordStatCardsSkeleton />
      <ul className="mt-6 space-y-3">
        <LandlordBuildingRowSkeleton />
        <LandlordBuildingRowSkeleton />
      </ul>
    </div>
  );
}

function LandlordUnitRowSkeleton() {
  return (
    <li className="card-elevated flex flex-wrap items-center justify-between gap-3 p-4">
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-4 w-52 max-w-full" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-8 w-28" />
      </div>
    </li>
  );
}

/** Building manage page — title band + featured panel + unit rows. */
export function ManageBuildingSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading building">
      <Skeleton className="h-4 w-36" />
      <FeaturedBoostPanelSkeleton />
      <section className="card-elevated-md p-4 sm:p-5">
        <Skeleton className="h-8 w-64 max-w-full" />
        <Skeleton className="mt-2 h-4 w-56 max-w-full" />
        <ul className="mt-5 space-y-3">
          <LandlordUnitRowSkeleton />
          <LandlordUnitRowSkeleton />
          <LandlordUnitRowSkeleton />
        </ul>
      </section>
    </div>
  );
}

export function FeaturedBoostPanelSkeleton() {
  return (
    <section className="border border-border bg-surface p-4" aria-hidden>
      <Skeleton className="h-6 w-40" />
      <Skeleton className="mt-2 h-4 w-full max-w-md" />
      <dl className="mt-4 grid grid-cols-2 gap-3">
        <div className="border border-border bg-background p-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-2 h-7 w-10" />
        </div>
        <div className="border border-border bg-background p-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-2 h-7 w-16" />
        </div>
      </dl>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    </section>
  );
}

export function TenantUnlockCardSkeleton() {
  return (
    <article className="overflow-hidden border border-border bg-surface">
      <div className="border-b border-primary/20 bg-primary/10 px-4 py-3">
        <Skeleton className="h-3 w-36" />
        <Skeleton className="mt-2 h-6 w-64 max-w-full" />
        <Skeleton className="mt-2 h-4 w-40" />
      </div>
      <Skeleton className="aspect-[16/10] w-full" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </article>
  );
}

/** Tenant My unlocks — card stack placeholder. */
export function TenantUnlocksSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading unlocks">
      <TenantUnlockCardSkeleton />
      <TenantUnlockCardSkeleton />
    </div>
  );
}
