"use client";

import { useViewerContext } from "@/components/providers/ViewerContextProvider";
import {
  isSupplyMarket,
  supplyMarketsLabel,
} from "@/lib/filters/search-areas";

export function HomeValueProps() {
  const { ready, viewer, countriesByCode } = useViewerContext();
  const viewerCountryName =
    countriesByCode.get(viewer.countryCode)?.name ?? "your country";
  const supply = supplyMarketsLabel();

  const diasporaBody =
    ready && isSupplyMarket(viewer.countryCode)
      ? "Rent in local currency with FX hints for visitors abroad."
      : ready
        ? `Rent in ${supply} (UGX) with a familiar currency hint from ${viewerCountryName}.`
        : "Rent in local currency with a familiar FX hint wherever you browse from.";

  const cards = [
    {
      title: "Map-first discovery",
      body: "Cluster pins, filters, and list/map split — see neighborhoods before you commit.",
    },
    {
      title: "Units before you pay",
      body: "Each building shows available units and rent ranges. Unlock only when you are serious.",
    },
    {
      title: "Built for diaspora",
      body: diasporaBody,
    },
  ] as const;

  return (
    <section className="grid gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <article
          key={card.title}
          className="border border-border bg-surface p-5 shadow-xs transition-shadow hover:shadow-card"
        >
          <h2 className="font-semibold text-primary">{card.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{card.body}</p>
        </article>
      ))}
    </section>
  );
}
