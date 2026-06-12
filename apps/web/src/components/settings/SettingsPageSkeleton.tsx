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
        <Skeleton className="h-10 w-[4.75rem] shrink-0" />
        <Skeleton className="h-10 min-w-0 flex-1" />
      </div>
    </div>
  );
}

function AccountSummarySkeleton() {
  return (
    <div className="card-elevated space-y-2 px-3 py-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-3 w-32" />
      <Skeleton className="h-3 w-36" />
    </div>
  );
}

export function SettingsPageSkeleton() {
  return (
    <PageMain aria-busy="true" aria-label="Loading settings">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-6 w-16" />
      </div>

      <section className="card-elevated-md mt-6 divide-y divide-border">
        <div className="p-4 sm:p-5">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="mt-2 h-3 w-full max-w-md" />
          <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_17.5rem] lg:items-start">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldSkeleton />
                <FieldSkeleton />
              </div>
              <PhoneFieldSkeleton />
              <PhoneFieldSkeleton />
              <Skeleton className="h-10 w-full" />
            </div>
            <aside className="hidden lg:block">
              <AccountSummarySkeleton />
            </aside>
          </div>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
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
