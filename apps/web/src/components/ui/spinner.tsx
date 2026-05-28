import { cn } from "@/lib/utils/cn";

type SpinnerProps = {
  className?: string;
  label?: string;
};

/** Inline loading ring (LPMS-style). Uses !rounded-full to override global 2px radius. */
export function Spinner({ className, label = "Loading" }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        "spinner-ring inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-solid border-current border-t-transparent",
        className,
      )}
    />
  );
}
