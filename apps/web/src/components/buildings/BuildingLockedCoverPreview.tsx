import { cn } from "@/lib/utils/cn";

type BuildingLockedCoverPreviewProps = {
  src: string;
  alt?: string;
  /** Cap width/height on md+ so wide detail panes do not stretch the teaser. */
  constrainOnDesktop?: boolean;
  className?: string;
};

/** Teaser cover shown before unlock, full-width on mobile, modest card on desktop. */
export function BuildingLockedCoverPreview({
  src,
  alt = "",
  constrainOnDesktop = true,
  className,
}: BuildingLockedCoverPreviewProps) {
  return (
    <div
      className={cn(
        "overflow-hidden border border-border bg-surface",
        constrainOnDesktop && "md:max-w-md",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={cn(
          "w-full object-cover",
          constrainOnDesktop
            ? "aspect-[16/10] md:aspect-[4/3] md:max-h-52"
            : "aspect-[16/10]",
        )}
      />
    </div>
  );
}
