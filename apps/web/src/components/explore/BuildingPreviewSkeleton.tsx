import { cn } from "@/lib/utils/cn";

type BuildingPreviewSkeletonProps = {
  mode: "full" | "summary";
  className?: string;
};

function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-sm bg-border/70", className)} />;
}

/** Fixed-layout placeholder so bottom sheets do not resize while loading. */
export function BuildingPreviewSkeleton({
  mode,
  className,
}: BuildingPreviewSkeletonProps) {
  const isSummary = mode === "summary";

  return (
    <div className={cn("space-y-4", className)} aria-hidden>
      <Bone className="h-4 w-24" />
      <Bone className="h-7 w-4/5 max-w-sm" />
      <Bone className="h-16 w-full border border-border/40 bg-background/60" />

      {!isSummary ? (
        <>
          <Bone className="h-36 w-full" />
          <div className="grid grid-cols-4 gap-1.5">
            {Array.from({ length: 8 }).map((_, index) => (
              <Bone key={index} className="aspect-square" />
            ))}
          </div>
        </>
      ) : null}

      <Bone className="h-11 w-full" />
      <Bone className="h-11 w-full" />
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
      {!isCompact ? <Bone className="h-40 w-full" /> : null}
      <Bone className="h-16 w-full border border-border/40 bg-background/60" />
      {!isCompact ? (
        <div className="grid grid-cols-6 gap-1.5">
          {Array.from({ length: 12 }).map((_, index) => (
            <Bone key={index} className="aspect-square" />
          ))}
        </div>
      ) : null}
      <Bone className="h-24 w-full border border-border/40 bg-background/60" />
      <Bone className="h-11 w-full" />
    </div>
  );
}
