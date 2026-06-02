import { Button } from "@/components/ui/button";
import type { ExploreLoadErrorKind } from "@/lib/api/http-errors";
import { cn } from "@/lib/utils/cn";

type ExploreSearchAlertProps = {
  kind: ExploreLoadErrorKind;
  message: string;
  onRetry?: () => void;
  retrying?: boolean;
  className?: string;
};

export function ExploreSearchAlert({
  kind,
  message,
  onRetry,
  retrying = false,
  className,
}: ExploreSearchAlertProps) {
  const isRateLimit = kind === "rate_limit";

  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-3 px-3 py-2.5 text-sm",
        isRateLimit
          ? "border border-amber-200 bg-amber-50 text-amber-950"
          : "border border-red-200 bg-red-50 text-red-900",
        className,
      )}
      role="alert"
    >
      <p className="min-w-0 flex-1">{message}</p>
      {onRetry ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={cn(
            "shrink-0",
            isRateLimit
              ? "border-amber-300 bg-white text-amber-950 hover:bg-amber-100"
              : "border-red-200 bg-white text-red-900 hover:bg-red-100",
          )}
          loading={retrying}
          loadingLabel="Retrying search"
          onClick={onRetry}
        >
          Try again
        </Button>
      ) : null}
    </div>
  );
}
