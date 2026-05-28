import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import {
  contentBandInnerClass,
  pageMainClass,
  type LayoutWidth,
} from "@/lib/layout/shell";

type PageMainProps = {
  children: ReactNode;
  width?: LayoutWidth;
  className?: string;
};

export function PageMain({ children, width = "default", className }: PageMainProps) {
  return <main className={pageMainClass(width, className)}>{children}</main>;
}

type ContentBandProps = {
  children: ReactNode;
  width?: LayoutWidth;
  className?: string;
  innerClassName?: string;
};

/** Full-width surface strip with content aligned to the page grid. */
export function ContentBand({
  children,
  width = "default",
  className,
  innerClassName,
}: ContentBandProps) {
  return (
    <div className={cn("border-b border-border bg-surface", className)}>
      <div className={cn(contentBandInnerClass(width), innerClassName)}>
        {children}
      </div>
    </div>
  );
}
