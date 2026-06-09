import Link from "next/link";

export function HomeLandlordCta() {
  return (
    <section className="relative overflow-hidden border border-border bg-surface p-6 shadow-card sm:p-8">
      <div
        className="pointer-events-none absolute inset-0 bg-linear-to-br from-primary/[0.06] via-transparent to-transparent"
        aria-hidden
      />
      <div className="relative max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          For landlords
        </p>
        <h2 className="mt-2 text-lg font-bold sm:text-xl">
          Listing is free after verification
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Submit your building with photos and unit details. Our team verifies
          each listing before it appears on the map. Featured placement on the
          homepage and explore is available for verified supply.
        </p>
        <Link
          href="/landlord"
          className="mt-5 inline-block bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-card hover:bg-primary/95"
        >
          Start listing
        </Link>
      </div>
    </section>
  );
}
