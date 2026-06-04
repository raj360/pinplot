import Link from "next/link";
import { contentBandInnerClass } from "@/lib/layout/shell";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div
        className={`${contentBandInnerClass()} flex flex-col items-center gap-3 py-6 text-center text-xs text-muted sm:flex-row sm:justify-between sm:text-left`}
      >
        <p>PlotPin · Map-first rentals · Uganda supply, global discovery</p>
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
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
