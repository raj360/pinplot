import { cn } from "@/lib/utils/cn";

function Bone({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-sm bg-border/70", className)}
      aria-hidden
    />
  );
}

export function AdminPendingBuildingCardSkeleton() {
  return (
    <li className="border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <Bone className="h-5 w-48 max-w-full" />
          <Bone className="h-4 w-56 max-w-full" />
          <Bone className="h-3 w-40" />
          <Bone className="h-3 w-28" />
        </div>
        <div className="flex gap-2">
          <Bone className="h-8 w-16" />
          <Bone className="h-8 w-20" />
        </div>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Bone className="h-44 w-full" />
        <Bone className="h-44 w-full" />
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
    <section className="border border-border bg-surface p-4">
      <Bone className="h-4 w-24" />
      <div className="mt-3 space-y-3">
        <Bone className="h-10 w-full" />
        <Bone className="h-10 w-full" />
        {tall ? <Bone className="h-56 w-full" /> : null}
      </div>
    </section>
  );
}

/** Admin pending building edit form placeholders. */
export function AdminEditBuildingSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading building">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Bone className="h-4 w-36" />
        <div className="flex gap-2">
          <Bone className="h-9 w-28" />
          <Bone className="h-9 w-32" />
        </div>
      </div>
      <Bone className="h-4 w-64 max-w-full" />
      <AdminEditSectionSkeleton />
      <AdminEditSectionSkeleton tall />
      <AdminEditSectionSkeleton tall />
      <AdminEditSectionSkeleton />
    </div>
  );
}
