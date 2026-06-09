const STEPS = [
  {
    step: "1",
    title: "Browse the map",
    body: "See approximate pins, filters, and rent ranges for free — no account required to explore.",
  },
  {
    step: "2",
    title: "Pick a unit",
    body: "Open a building to view available units and pricing before you commit.",
  },
  {
    step: "3",
    title: "Unlock once",
    body: "Pay a one-time fee to get the exact location and landlord contact.",
  },
] as const;

export function HomeHowItWorks() {
  return (
    <section aria-labelledby="how-it-works-heading">
      <h2
        id="how-it-works-heading"
        className="text-lg font-bold sm:text-xl"
      >
        How it works
      </h2>
      <ol className="mt-4 grid gap-4 sm:grid-cols-3">
        {STEPS.map((item) => (
          <li
            key={item.step}
            className="border border-border bg-surface p-4 shadow-xs"
          >
            <span className="inline-flex size-7 items-center justify-center bg-primary text-xs font-bold text-primary-foreground">
              {item.step}
            </span>
            <h3 className="mt-3 font-semibold text-primary">{item.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              {item.body}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
