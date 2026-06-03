import Link from "next/link";
import { PRICING } from "@plotpin/shared-types";

export function HomeLandlordCta() {
  return (
    <section className="border border-border bg-surface p-6 shadow-card sm:p-8">
      <div className="max-w-2xl">
        <h2 className="text-lg font-bold sm:text-xl">Landlords</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          List your building, add photos, and mark units available for{" "}
          {PRICING.landlordListingFeeUgx.toLocaleString()} UGX per unit. Verified
          listings can earn featured placement on the homepage and explore.
        </p>
        <Link
          href="/landlord"
          className="mt-4 inline-block border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-neutral-25"
        >
          Start listing
        </Link>
      </div>
    </section>
  );
}
