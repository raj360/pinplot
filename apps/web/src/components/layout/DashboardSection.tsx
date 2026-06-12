import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type DashboardSectionProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

/** Card-style section for dashboard pages, clearer bands on mobile. */
export function DashboardSection({
  title,
  description,
  action,
  children,
  className,
}: DashboardSectionProps) {
  return (
    <section
      className={cn("card-elevated-md p-4 sm:p-5", className)}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
          {description ? (
            <p className="mt-1.5 max-w-2xl text-sm text-muted">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

type StatCardProps = {
  label: string;
  value: number | string;
  highlight?: boolean;
  variant?: "default" | "primary";
  className?: string;
};

export function StatCard({
  label,
  value,
  highlight,
  variant = "default",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-DEFAULT)] border px-4 py-3",
        highlight
          ? "border-sky-300 bg-sky-50"
          : variant === "primary"
            ? "border-primary/25 bg-primary/10"
            : "border-border bg-surface shadow-[var(--shadow-card)]",
        className,
      )}
    >
      <dt className="text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 text-2xl font-semibold tabular-nums",
          variant === "primary" && !highlight && "text-primary",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
