import { Skeleton } from "@/components/ui/skeleton";

function StatCardSkeleton() {
  return (
    <div className="card-elevated px-4 py-3">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="mt-3 h-8 w-10" />
    </div>
  );
}

export function LandlordStatCardsSkeleton() {
  return (
    <dl className="grid gap-3 sm:grid-cols-3" aria-hidden>
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
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

/** Building manage page — title band + unit rows. */
export function ManageBuildingSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading building">
      <Skeleton className="h-4 w-36" />
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
