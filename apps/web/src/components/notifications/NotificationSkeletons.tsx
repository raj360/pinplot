import { Skeleton } from "@/components/ui/skeleton";

function NotificationRowSkeleton({ seed = 0 }: { seed?: number }) {
  const titleWidths = ["58%", "52%", "64%"];
  const bodyWidths = ["92%", "88%", "95%"];
  const i = seed % titleWidths.length;

  return (
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 rounded-sm" style={{ width: titleWidths[i] }} />
        <Skeleton className="h-3 rounded-sm" style={{ width: bodyWidths[i] }} />
        <Skeleton className="h-3 w-4/5 rounded-sm" />
        <Skeleton className="h-2.5 w-24 rounded-sm" />
      </div>
      <Skeleton className="size-5 shrink-0 rounded-sm" />
    </div>
  );
}

/** Bell dropdown list placeholder, mirrors notification row geometry. */
export function NotificationBellListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, index) => (
        <li
          key={index}
          className="border-b border-border px-3 py-3 last:border-b-0"
          aria-hidden
        >
          <NotificationRowSkeleton seed={index} />
        </li>
      ))}
    </>
  );
}

/** Dashboard banner placeholder while hold-ended alerts load. */
export function NotificationBannerSkeleton({ count = 1 }: { count?: number }) {
  return (
    <ul className="space-y-2" aria-hidden>
      {Array.from({ length: count }).map((_, index) => (
        <li
          key={index}
          className="border border-border bg-surface px-4 py-3"
        >
          <NotificationRowSkeleton seed={index} />
        </li>
      ))}
    </ul>
  );
}
