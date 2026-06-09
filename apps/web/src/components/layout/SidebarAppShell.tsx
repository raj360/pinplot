"use client";

import type { ReactNode } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import {
  SidebarNav,
  type SidebarNavItem,
} from "@/components/layout/SidebarNav";
import {
  pageMainBesideSidebarClass,
  sidebarColumnClass,
} from "@/lib/layout/shell";
import { cn } from "@/lib/utils/cn";

type SidebarAppShellProps = {
  sectionLabel: string;
  navItems: SidebarNavItem[];
  children: ReactNode;
  sidebarFooter?: ReactNode;
};

export function SidebarAppShell({
  sectionLabel,
  navItems,
  children,
  sidebarFooter,
}: SidebarAppShellProps) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <AppHeader variant="sidebar" mobileSectionTitle={sectionLabel} />

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <aside
          className={cn(
            sidebarColumnClass(
              "hidden shrink-0 flex-col border-r border-border bg-surface py-6 md:flex",
            ),
          )}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {sectionLabel}
          </p>
          <SidebarNav items={navItems} />
          {sidebarFooter ? (
            <div className="mt-auto pt-6">{sidebarFooter}</div>
          ) : null}
        </aside>

        <main
          className={cn(
            pageMainBesideSidebarClass("bg-panel py-5 md:py-8"),
            "min-h-0 flex-1 overflow-y-auto overscroll-contain",
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
