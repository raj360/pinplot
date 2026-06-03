import { contentBandInnerClass } from "@/lib/layout/shell";

export function HomeFooter() {
  return (
    <footer className="border-t border-border">
      <div
        className={`${contentBandInnerClass()} py-6 text-center text-xs text-muted`}
      >
        PlotPin · Map-first rentals · Uganda supply, global discovery
      </div>
    </footer>
  );
}
