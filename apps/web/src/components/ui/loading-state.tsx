import { cn } from "@/lib/utils/cn";
import { Spinner } from "@/components/ui/spinner";

type LoadingStateProps = {
  label?: string;
  className?: string;
  compact?: boolean;
};

/** Centered or inline loading placeholder — prefer over "Please wait…" text alone. */
export function LoadingState({
  label = "Loading",
  className,
  compact = false,
}: LoadingStateProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex items-center gap-2 text-sm text-muted",
        compact ? "" : "justify-center py-8",
        className,
      )}
    >
      <Spinner label={label} />
      <span>{label}</span>
    </div>
  );
}
