import type { SidebarNavItem } from "@/components/layout/SidebarNav";

export type AppNavItem = SidebarNavItem;

export const MAIN_NAV: AppNavItem[] = [
  { href: "/", label: "Home", exact: true },
  { href: "/explore", label: "Explore" },
];

export const TENANT_NAV: AppNavItem[] = [
  { href: "/tenant/unlocks", label: "My unlocks" },
];

export const LANDLORD_NAV: AppNavItem[] = [
  { href: "/landlord/dashboard", label: "Buildings", exact: true },
  { href: "/landlord/new", label: "Add building", exact: true },
];

export const ADMIN_NAV: AppNavItem[] = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/buildings", label: "Buildings" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/featured", label: "Featured" },
  { href: "/admin/coupons", label: "Coupons" },
  { href: "/admin/users", label: "Users" },
];

export const ACCOUNT_NAV: AppNavItem[] = [
  { href: "/settings", label: "Settings" },
];

export type NavSection = {
  id: string;
  title: string;
  items: AppNavItem[];
};

export function buildAppNavSections(opts: {
  isAuthenticated: boolean;
  showLandlord: boolean;
  isAdmin: boolean;
}): NavSection[] {
  const sections: NavSection[] = [
    { id: "main", title: "PlotPin", items: [...MAIN_NAV] },
  ];

  if (opts.isAuthenticated) {
    sections.push({
      id: "tenant",
      title: "Tenant",
      items: [...TENANT_NAV],
    });
  }

  if (opts.showLandlord) {
    sections.push({
      id: "landlord",
      title: "Landlord",
      items: [...LANDLORD_NAV],
    });
  }

  if (opts.isAdmin) {
    sections.push({
      id: "admin",
      title: "Admin",
      items: [...ADMIN_NAV],
    });
  }

  if (opts.isAuthenticated) {
    sections.push({
      id: "account",
      title: "Account",
      items: [...ACCOUNT_NAV],
    });
  }

  return sections;
}
