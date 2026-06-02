import { Skeleton } from "@/components/ui/skeleton";

export function AdminPendingBuildingCardSkeleton() {
  return (
    <li className="card-elevated p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-5 w-48 max-w-full" />
          <Skeleton className="h-4 w-56 max-w-full" />
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-3 w-28" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-44 w-full" />
      </div>
    </li>
  );
}

/** Pending buildings list — card placeholders. */
export function AdminPendingBuildingsSkeleton() {
  return (
    <ul className="space-y-4" aria-busy="true" aria-label="Loading pending buildings">
      <AdminPendingBuildingCardSkeleton />
      <AdminPendingBuildingCardSkeleton />
    </ul>
  );
}

function AdminEditSectionSkeleton({ tall = false }: { tall?: boolean }) {
  return (
    <section className="card-elevated p-4">
      <Skeleton className="h-4 w-24" />
      <div className="mt-3 space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        {tall ? <Skeleton className="h-56 w-full" /> : null}
      </div>
    </section>
  );
}

/** Admin pending building edit form placeholders. */
export function AdminEditBuildingSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading building">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-4 w-36" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
      <Skeleton className="h-4 w-64 max-w-full" />
      <AdminEditSectionSkeleton />
      <AdminEditSectionSkeleton tall />
      <AdminEditSectionSkeleton tall />
      <AdminEditSectionSkeleton />
    </div>
  );
}
