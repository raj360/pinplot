import { cn } from "@/lib/utils/cn";

function Bone({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-sm bg-border/70", className)}
      aria-hidden
    />
  );
}

function StatCardSkeleton() {
  return (
    <div className="border border-border bg-surface px-4 py-3">
      <Bone className="h-3 w-16" />
      <Bone className="mt-3 h-8 w-10" />
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
    <li className="flex flex-wrap items-center justify-between gap-3 border border-border bg-surface p-4">
      <div className="min-w-0 flex-1 space-y-2">
        <Bone className="h-5 w-48 max-w-full" />
        <Bone className="h-4 w-64 max-w-full" />
        <Bone className="h-3 w-36" />
      </div>
      <Bone className="h-6 w-24 shrink-0" />
      <Bone className="h-8 w-24 shrink-0" />
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
    <li className="flex flex-wrap items-center justify-between gap-3 border border-border bg-surface p-4">
      <div className="min-w-0 flex-1 space-y-2">
        <Bone className="h-5 w-28" />
        <Bone className="h-4 w-52 max-w-full" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Bone className="h-6 w-20" />
        <Bone className="h-8 w-28" />
      </div>
    </li>
  );
}

/** Building manage page — title band + unit rows. */
export function ManageBuildingSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading building">
      <Bone className="h-4 w-36" />
      <section className="border border-border bg-surface p-4 sm:p-5">
        <Bone className="h-8 w-64 max-w-full" />
        <Bone className="mt-2 h-4 w-56 max-w-full" />
        <ul className="mt-5 space-y-3">
          <LandlordUnitRowSkeleton />
          <LandlordUnitRowSkeleton />
          <LandlordUnitRowSkeleton />
        </ul>
      </section>
    </div>
  );
}
