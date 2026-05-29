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
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader variant="sidebar" />

      <div className="border-b border-border bg-surface px-4 md:hidden">
        <SidebarNav items={navItems} variant="tabs" />
      </div>

      <div className="flex flex-1 flex-col md:flex-row">
        <aside
          className={cn(
            sidebarColumnClass(
              "hidden flex-col border-r border-border bg-surface py-6 md:flex",
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

        <div className={pageMainBesideSidebarClass("py-5 md:py-8")}>
          {children}
        </div>
      </div>
    </div>
  );
}
