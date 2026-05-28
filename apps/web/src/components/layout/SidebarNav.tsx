"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

export type SidebarNavItem = {
  href: string;
  label: string;
  /** Match only the exact path (default: prefix match for nested routes). */
  exact?: boolean;
};

function isActive(pathname: string, item: SidebarNavItem) {
  if (item.exact) {
    return pathname === item.href;
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function SidebarNav({ items }: { items: SidebarNavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="mt-4 flex flex-col gap-1 text-sm">
      {items.map((item) => {
        const active = isActive(pathname, item);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "py-1.5 hover:text-primary",
              active && "font-medium text-primary",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
