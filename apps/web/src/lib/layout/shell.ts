import { cn } from "@/lib/utils/cn";

/** Shared layout, SchoolSpring-style: header + content share one horizontal grid. */
export const LAYOUT = {
  /** Standard app pages (home, landlord, settings). */
  maxDefault: "max-w-5xl",
  /** Map explorer only. */
  maxWide: "max-w-[1600px]",
  /** Admin sidebar column, must match header sidebar cell. */
  sidebarWidth: "w-52",
  padX: "px-4",
  mainPy: "py-8",
  headerHeight: "h-12",
} as const;

export type LayoutWidth = "default" | "wide";
export type HeaderVariant = "standard" | "wide" | "sidebar";

export function layoutMaxClass(width: LayoutWidth = "default") {
  return width === "wide" ? LAYOUT.maxWide : LAYOUT.maxDefault;
}

/** Sidebar column (admin), logo and nav links share this width. */
export function sidebarColumnClass(className?: string) {
  return cn(LAYOUT.sidebarWidth, "shrink-0", LAYOUT.padX, className);
}

/** Standard / wide header, content box aligns with PageMain below. */
export function headerInnerClass(variant: HeaderVariant = "standard") {
  const width: LayoutWidth = variant === "wide" ? "wide" : "default";
  return cn(
    "mx-auto flex w-full items-center justify-between gap-4",
    LAYOUT.headerHeight,
    LAYOUT.padX,
    layoutMaxClass(width),
  );
}

/** Sidebar header, full width row split into sidebar + nav columns. */
export function headerSidebarShellClass() {
  return cn("flex w-full items-stretch", LAYOUT.headerHeight);
}

export function headerSidebarNavClass() {
  return cn(
    "flex min-w-0 flex-1 items-center justify-end gap-3",
    LAYOUT.padX,
  );
}

/** Main content container (centered content column). */
export function pageMainClass(
  width: LayoutWidth = "default",
  className?: string,
) {
  return cn(
    "mx-auto w-full",
    LAYOUT.padX,
    LAYOUT.mainPy,
    layoutMaxClass(width),
    className,
  );
}

/** Main area beside admin sidebar, left-aligned, no extra centering. */
export function pageMainBesideSidebarClass(className?: string) {
  return cn("min-w-0 flex-1", LAYOUT.padX, LAYOUT.mainPy, className);
}

/** Full-width band with inner alignment (explore filters, footer). */
export function contentBandInnerClass(width: LayoutWidth = "default") {
  return cn("mx-auto w-full", LAYOUT.padX, layoutMaxClass(width));
}
