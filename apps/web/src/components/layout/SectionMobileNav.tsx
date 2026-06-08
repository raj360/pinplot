"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { MobileNavDrawer } from "@/components/layout/MobileNavDrawer";
import type { SidebarNavItem } from "@/components/layout/SidebarNav";
import { useAuth } from "@/lib/auth/use-auth";
import {
  ACCOUNT_NAV,
  ADMIN_NAV,
  LANDLORD_NAV,
  MAIN_NAV,
  TENANT_NAV,
  type NavSection,
} from "@/lib/navigation/app-nav";

type SectionMobileNavProps = {
  sectionLabel: string;
  navItems: SidebarNavItem[];
};

function isActive(pathname: string, item: SidebarNavItem) {
  if (item.exact) {
    return pathname === item.href;
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function SectionMobileNav({
  sectionLabel,
  navItems,
}: SectionMobileNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { profile, isAuthenticated } = useAuth();
  const isAdmin =
    profile?.role === "ADMIN" || profile?.role === "SUPERADMIN";
  const showLandlord = profile?.role === "LANDLORD" || isAdmin;

  const currentLabel =
    navItems.find((item) => isActive(pathname, item))?.label ?? sectionLabel;

  const sections = useMemo(() => {
    const result: NavSection[] = [
      {
        id: "section",
        title: sectionLabel,
        items: navItems,
      },
      {
        id: "main",
        title: "PlotPin",
        items: [...MAIN_NAV],
      },
    ];

    if (isAuthenticated) {
      result.push({
        id: "tenant",
        title: "Tenant",
        items: [...TENANT_NAV],
      });
    }

    if (showLandlord && sectionLabel !== "Landlord") {
      result.push({
        id: "landlord",
        title: "Landlord",
        items: [...LANDLORD_NAV],
      });
    }

    if (isAdmin && sectionLabel !== "Admin") {
      result.push({
        id: "admin",
        title: "Admin",
        items: [...ADMIN_NAV],
      });
    }

    if (isAuthenticated) {
      result.push({
        id: "account",
        title: "Account",
        items: [...ACCOUNT_NAV],
      });
    }

    return result;
  }, [isAdmin, isAuthenticated, navItems, sectionLabel, showLandlord]);

  return (
    <>
      <button
        type="button"
        className="inline-flex min-w-0 max-w-full items-center gap-2 border border-border bg-background px-3 py-2 text-sm font-medium text-foreground"
        aria-label={`${sectionLabel} menu — ${currentLabel}`}
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Menu className="size-4 shrink-0 text-muted" aria-hidden />
        <span className="truncate">{currentLabel}</span>
      </button>

      <MobileNavDrawer
        open={open}
        onClose={() => setOpen(false)}
        title={sectionLabel}
        subtitle={currentLabel}
        sections={sections}
      />
    </>
  );
}
