"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type { AppNavItem, NavSection } from "@/lib/navigation/app-nav";
import { cn } from "@/lib/utils/cn";

function isActive(pathname: string, item: AppNavItem) {
  if (item.exact) {
    return pathname === item.href;
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

type MobileNavDrawerProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string | null;
  sections: NavSection[];
  footer?: React.ReactNode;
};

export function MobileNavDrawer({
  open,
  onClose,
  title,
  subtitle,
  sections,
  footer,
}: MobileNavDrawerProps) {
  const pathname = usePathname();
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[80] md:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close menu"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="absolute inset-y-0 right-0 flex w-[min(100vw-2.5rem,320px)] flex-col border-l border-border bg-surface shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-4">
          <div className="min-w-0">
            <p id={titleId} className="text-sm font-semibold text-foreground">
              {title}
            </p>
            {subtitle ? (
              <p className="mt-0.5 truncate text-xs text-muted">{subtitle}</p>
            ) : null}
          </div>
          <button
            ref={closeRef}
            type="button"
            className="inline-flex size-9 shrink-0 items-center justify-center border border-border text-muted hover:bg-background hover:text-foreground"
            aria-label="Close menu"
            onClick={onClose}
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto overscroll-contain px-2 py-3">
          {sections.map((section, index) => (
            <div
              key={section.id}
              className={cn(index > 0 && "mt-4 border-t border-border pt-4")}
            >
              <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-widest text-muted">
                {section.title}
              </p>
              <ul className="flex flex-col gap-0.5">
                {section.items.map((item) => {
                  const active = isActive(pathname, item);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "block rounded-sm px-3 py-2.5 text-sm font-medium transition-colors",
                          active
                            ? "bg-primary/10 text-primary"
                            : "text-foreground hover:bg-background",
                        )}
                        onClick={onClose}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {footer ? (
          <div className="border-t border-border px-4 py-3">{footer}</div>
        ) : null}
      </aside>
    </div>,
    document.body,
  );
}
