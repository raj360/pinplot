import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils/cn";

type AppLoadingOverlayProps = {
  show: boolean;
  label?: string;
  className?: string;
};

/** Full-viewport translucent overlay — content stays visible beneath. */
export function AppLoadingOverlay({
  show,
  label = "Loading",
  className,
}: AppLoadingOverlayProps) {
  if (!show) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        "bg-white/50 backdrop-blur-[1px]",
        className,
      )}
    >
      <div className="flex items-center gap-3 border border-border bg-surface px-4 py-3 shadow-md">
        <Spinner className="size-5" label={label} />
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
    </div>
  );
}
