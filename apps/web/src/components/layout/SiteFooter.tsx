import Link from "next/link";
import { PlotPinLogo } from "@/components/brand/PlotPinLogo";
import { contentBandInnerClass } from "@/lib/layout/shell";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-panel/50">
      <div
        className={`${contentBandInnerClass()} flex flex-col items-center gap-4 py-8 text-center sm:flex-row sm:justify-between sm:text-left`}
      >
        <div className="flex flex-col items-center gap-2 sm:items-start">
          <PlotPinLogo variant="colored" height={22} href="/" />
          <p className="text-xs text-muted">
            Map-first rentals · Uganda supply, global discovery
          </p>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted">
          <Link href="/terms" className="hover:text-foreground">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          <Link href="/explore" className="hover:text-foreground">
            Explore
          </Link>
        </nav>
      </div>
    </footer>
  );
}
