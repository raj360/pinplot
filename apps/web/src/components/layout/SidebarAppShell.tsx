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

      <div className="flex flex-1">
        <aside
          className={sidebarColumnClass(
            "flex flex-col border-r border-border bg-surface py-6",
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

        <div className={pageMainBesideSidebarClass()}>{children}</div>
      </div>
    </div>
  );
}
