import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";

type BuildingPreviewSkeletonProps = {
  mode: "full" | "summary";
  className?: string;
};

/** Fixed-layout placeholder so bottom sheets do not resize while loading. */
export function BuildingPreviewSkeleton({
  mode,
  className,
}: BuildingPreviewSkeletonProps) {
  const isSummary = mode === "summary";

  return (
    <div className={cn("space-y-4", className)} aria-hidden>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-7 w-4/5 max-w-sm" />
      <Skeleton className="h-16 w-full border border-border bg-neutral-25" />

      {!isSummary ? (
        <>
          <Skeleton className="h-36 w-full md:max-h-52 md:max-w-md md:aspect-[4/3]" />
          <div className="grid grid-cols-4 gap-1.5">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="aspect-square" />
            ))}
          </div>
        </>
      ) : null}

      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-11 w-full" />
    </div>
  );
}

/** Unlock strip only — building detail can render while unlock state loads. */
export function UnlockSectionSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3", className)} aria-hidden>
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-24 w-full border border-border bg-neutral-25" />
      <Skeleton className="h-11 w-full" />
    </div>
  );
}

export function BuildingDetailSkeleton({
  variant = "full",
  className,
}: {
  variant?: "compact" | "full";
  className?: string;
}) {
  const isCompact = variant === "compact";

  return (
    <div className={cn("space-y-4", className)} aria-hidden>
      {!isCompact ? (
        <Skeleton className="h-40 w-full md:max-h-52 md:max-w-md md:aspect-[4/3]" />
      ) : null}
      <Skeleton className="h-16 w-full border border-border bg-neutral-25" />
      {!isCompact ? (
        <div className="grid grid-cols-6 gap-1.5">
          {Array.from({ length: 12 }).map((_, index) => (
            <Skeleton key={index} className="aspect-square" />
          ))}
        </div>
      ) : null}
      <Skeleton className="h-24 w-full border border-border bg-neutral-25" />
      <Skeleton className="h-11 w-full" />
    </div>
  );
}
