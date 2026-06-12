import { cn } from "@/lib/utils/cn";

type HeaderNavSkeletonProps = {
  /** Reserve space for "My buildings" / "Admin" link on wider headers. */
  showNavLink?: boolean;
  className?: string;
};

/** Fixed-size header nav placeholder, avoids layout shift while auth resolves. */
export function HeaderNavSkeleton({
  showNavLink = true,
  className,
}: HeaderNavSkeletonProps) {
  return (
    <div
      className={cn("flex shrink-0 items-center gap-3", className)}
      aria-hidden
    >
      {showNavLink ? (
        <div className="hidden h-4 w-[5.5rem] animate-pulse rounded-sm bg-primary-foreground/20 sm:block" />
      ) : null}
      <div className="user-avatar size-8 shrink-0 animate-pulse border-2 border-primary-foreground/25 bg-primary-foreground/10" />
    </div>
  );
}
