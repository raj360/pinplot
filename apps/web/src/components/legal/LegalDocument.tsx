import Link from "next/link";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageMain } from "@/components/layout/PageShell";
import { SiteFooter } from "@/components/layout/SiteFooter";

export function LegalDocument({
  title,
  draftNotice,
  sections,
  updated = "June 2026",
}: {
  title: string;
  draftNotice: string;
  sections: { title: string; paragraphs: string[] }[];
  updated?: string;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      <PageMain className="flex-1 py-10 sm:py-12">
        <article className="mx-auto max-w-3xl">
          <p className="text-xs font-medium uppercase tracking-wide text-primary">
            Legal · Draft
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-muted">Last updated: {updated}</p>
          <p className="mt-4 border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            {draftNotice}
          </p>
          <div className="prose-legal mt-8 space-y-8">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-lg font-semibold text-foreground">
                  {section.title}
                </h2>
                {section.paragraphs.map((paragraph) => (
                  <p
                    key={paragraph.slice(0, 40)}
                    className="mt-3 text-sm leading-relaxed text-muted"
                  >
                    {paragraph}
                  </p>
                ))}
              </section>
            ))}
          </div>
          <p className="mt-10 text-sm text-muted">
            See also{" "}
            <Link href="/terms" className="text-primary hover:underline">
              Terms
            </Link>{" "}
            ·{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy
            </Link>
          </p>
        </article>
      </PageMain>
      <SiteFooter />
    </div>
  );
}
