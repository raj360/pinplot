const TRUST_ITEMS = [
  {
    title: "Admin-verified listings",
    body: "Every building is reviewed before it appears on the map.",
  },
  {
    title: "Pay once to unlock",
    body: "Browse for free. One fee reveals exact location and landlord contact.",
  },
  {
    title: "Free for landlords",
    body: "No listing fee after verification. Tenants pay PlotPin to unlock.",
  },
] as const;

export function HomeTrustStrip() {
  return (
    <section
      aria-label="Why PlotPin"
      className="grid gap-3 border border-border bg-surface/80 p-4 sm:grid-cols-3 sm:gap-4 sm:p-5"
    >
      {TRUST_ITEMS.map((item) => (
        <div key={item.title} className="flex gap-3 sm:flex-col sm:gap-1.5">
          <span
            className="mt-1 size-1.5 shrink-0 rounded-full bg-primary sm:mt-0"
            aria-hidden
          />
          <div>
            <p className="text-sm font-semibold text-foreground">{item.title}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted sm:mt-1">
              {item.body}
            </p>
          </div>
        </div>
      ))}
    </section>
  );
}
