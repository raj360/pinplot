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

type SidebarNavProps = {
  items: SidebarNavItem[];
  variant?: "sidebar" | "tabs";
  className?: string;
};

export function SidebarNav({
  items,
  variant = "sidebar",
  className,
}: SidebarNavProps) {
  const pathname = usePathname();

  if (variant === "tabs") {
    return (
      <nav className={cn("flex gap-1 overflow-x-auto", className)}>
        {items.map((item) => {
          const active = isActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className={cn("mt-4 flex flex-col gap-1 text-sm", className)}>
      {items.map((item) => {
        const active = isActive(pathname, item);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-sm py-1.5 pl-2 -ml-2 hover:bg-background hover:text-primary",
              active && "border-l-2 border-primary bg-primary/5 pl-[calc(0.5rem-2px)] font-medium text-primary",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
