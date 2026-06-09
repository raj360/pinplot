import { cn } from "@/lib/utils/cn";

type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

/** Neutral loading block — uses global skeleton tokens (Bondex-style gray + pulse). */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("skeleton-block", className)}
      aria-hidden
      {...props}
    />
  );
}

/**
 * Explore list row placeholder. Mirrors the real row geometry exactly
 * (edge thumbnail + title / location / price lines) so the list doesn't shift
 * when data arrives. Widths are slightly varied per line for a natural look.
 */
export function ExploreResultRowSkeleton({
  seed = 0,
}: {
  /** Stagger line widths so stacked rows don't read as one solid block. */
  seed?: number;
}) {
  const titleWidths = ["62%", "48%", "55%"];
  const metaWidths = ["70%", "58%", "64%"];
  const i = seed % titleWidths.length;

  return (
    <li className="border-b border-border">
      <div className="flex min-h-[5.75rem] items-stretch">
        <Skeleton className="w-16 shrink-0 rounded-none sm:w-24" />
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-2.5 px-3 py-3.5 sm:px-4">
          <Skeleton className="h-[15px] rounded" style={{ width: titleWidths[i] }} />
          <div className="flex items-center gap-1.5">
            <Skeleton className="size-3.5 shrink-0 rounded-full" />
            <Skeleton className="h-3 rounded" style={{ width: metaWidths[i] }} />
          </div>
          <Skeleton className="h-3 w-2/5 rounded" />
        </div>
      </div>
    </li>
  );
}
