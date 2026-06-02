import { cn } from "@/lib/utils/cn";

type FeaturedListingBadgeProps = {
  className?: string;
  /** Overlay on photo thumb vs inline next to title (mobile). */
  variant?: "overlay" | "inline";
};

export function FeaturedListingBadge({
  className,
  variant = "overlay",
}: FeaturedListingBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-semibold uppercase tracking-wide",
        variant === "overlay" &&
          "absolute left-1 top-1 z-10 bg-amber-600 px-1.5 py-0.5 text-[10px] leading-none text-white shadow-sm",
        variant === "inline" &&
          "shrink-0 bg-amber-100 px-1.5 py-0.5 text-[10px] leading-none text-amber-900",
        className,
      )}
    >
      Featured
    </span>
  );
}
