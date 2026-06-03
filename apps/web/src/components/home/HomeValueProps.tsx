const VALUE_PROPS = [
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
    body: "Rent in UGX with a familiar currency hint. Browse from London, Dubai, or Kampala.",
  },
] as const;

export function HomeValueProps() {
  return (
    <section className="grid gap-4 sm:grid-cols-3">
      {VALUE_PROPS.map((card) => (
        <article
          key={card.title}
          className="border border-border bg-surface p-4 shadow-xs"
        >
          <h2 className="font-semibold">{card.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{card.body}</p>
        </article>
      ))}
    </section>
  );
}
