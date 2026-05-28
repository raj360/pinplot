import Link from "next/link";
import { APP_NAME, DEFAULT_COUNTRY, PRICING } from "@plotpin/shared-types";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-primary text-primary-foreground">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            {APP_NAME}
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/explore" className="hover:underline">
              Explore
            </Link>
            <Link
              href="/auth/login"
              className="border border-primary-foreground/30 bg-primary-foreground/10 px-3 py-1.5"
            >
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-10">
        <section className="max-w-2xl">
          <p className="mb-2 text-sm font-medium uppercase tracking-wide text-muted">
            {DEFAULT_COUNTRY.name} · Launch preview
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Find apartments on the map. Pay to unlock the landlord contact.
          </h1>
          <p className="mt-4 text-base text-muted">
            PlotPin is a map-first rental discovery platform. Browse buildings
            for free, unlock exact location and owner contact for{" "}
            {PRICING.tenantUnlockFeeUgx.toLocaleString()} UGX. Landlords pay{" "}
            {PRICING.landlordListingFeeUgx.toLocaleString()} UGX to mark units
            available.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/explore"
              className="bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Open map explorer
            </Link>
            <Link
              href="/landlord"
              className="border border-border bg-surface px-4 py-2 text-sm font-medium"
            >
              List a building
            </Link>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {[
            {
              title: "Map-first search",
              body: "Cluster markers, filters, and list/map split inspired by SchoolSpring.",
            },
            {
              title: "Building → units",
              body: "Each property shows a unit grid — see what is empty before you pay.",
            },
            {
              title: "First unlock wins",
              body: "The first tenant to pay secures exclusive contact access for 72 hours.",
            },
          ].map((card) => (
            <article
              key={card.title}
              className="border border-border bg-surface p-4"
            >
              <h2 className="font-semibold">{card.title}</h2>
              <p className="mt-2 text-sm text-muted">{card.body}</p>
            </article>
          ))}
        </section>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted">
        PlotPin monorepo · Sprint 1 · Next.js 16 + NestJS REST + Supabase
      </footer>
    </div>
  );
}
