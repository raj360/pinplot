import { Skeleton } from "@/components/ui/skeleton";

export function HomeHeroSkeleton() {
  return (
    <section
      className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(300px,440px)] lg:gap-10"
      aria-busy="true"
      aria-label="Loading hero"
    >
      <div className="max-w-xl space-y-4">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-10 w-full max-w-sm" />
        <div className="space-y-2 pt-1">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
        <div className="flex flex-wrap gap-3 pt-2">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      <Skeleton className="aspect-4/3 w-full sm:aspect-16/10 lg:aspect-auto lg:h-[340px]" />
    </section>
  );
}

function FeaturedListingCardSkeleton() {
  return (
    <div className="overflow-hidden border border-border bg-surface shadow-card">
      <Skeleton className="aspect-4/3 w-full rounded-none" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="mt-3 h-4 w-2/3" />
      </div>
    </div>
  );
}

export function HomeFeaturedSkeleton() {
  return (
    <section className="space-y-5" aria-busy="true" aria-label="Loading featured listings">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-4 w-28" />
      </div>
      <ul className="grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <li key={index}>
            <FeaturedListingCardSkeleton />
          </li>
        ))}
      </ul>
    </section>
  );
}
