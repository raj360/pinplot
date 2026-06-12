import { Skeleton } from "@/components/ui/skeleton";
import { PageMain } from "@/components/layout/PageShell";

function FieldSkeleton({ wide = false }: { wide?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Skeleton className="h-3 w-20" />
      <Skeleton className={wide ? "h-10 w-full" : "h-10 w-full max-w-xs"} />
    </div>
  );
}

function PhoneFieldSkeleton() {
  return (
    <div className="space-y-1.5">
      <Skeleton className="h-3 w-28" />
      <div className="flex gap-0">
        <Skeleton className="h-10 w-[9.5rem] shrink-0" />
        <Skeleton className="h-10 min-w-0 flex-1" />
      </div>
    </div>
  );
}

export function SettingsPageSkeleton() {
  return (
    <PageMain aria-busy="true" aria-label="Loading settings">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-3 w-16" />
      </div>

      <section className="mt-6 max-w-lg divide-y divide-border border border-border bg-surface">
        <div className="space-y-4 p-4">
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-3 w-56" />
          </div>
          <div className="space-y-3 border border-border bg-background/40 p-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-32" />
          </div>
          <FieldSkeleton />
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldSkeleton />
            <FieldSkeleton />
          </div>
          <PhoneFieldSkeleton />
          <PhoneFieldSkeleton />
          <Skeleton className="h-10 w-full" />
        </div>

        <div className="space-y-4 p-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-full max-w-sm" />
          <FieldSkeleton wide />
          <Skeleton className="h-3 w-56" />
          <Skeleton className="h-9 w-40" />
        </div>
      </section>
    </PageMain>
  );
}

export function ViewerCountrySettingsSkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      <Skeleton className="h-3 w-full max-w-sm" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-3 w-56" />
      <Skeleton className="h-9 w-40" />
    </div>
  );
}
