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

/** Explore list row placeholder (thumbnail + text lines). */
export function ExploreResultRowSkeleton() {
  return (
    <li className="border-b border-border">
      <div className="flex items-stretch p-0">
        <Skeleton className="h-[5.5rem] w-16 shrink-0 rounded-none sm:h-[5.75rem] sm:w-24" />
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 px-3 py-3.5 sm:px-4">
          <Skeleton className="h-4 w-3/5 max-w-xs" />
          <Skeleton className="h-3 w-2/5 max-w-[10rem]" />
          <Skeleton className="h-3 w-1/2 max-w-[12rem]" />
        </div>
      </div>
    </li>
  );
}
