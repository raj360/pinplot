"use client";

import {
  useCallback,
  useEffect,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";

type UseAnchoredPanelPositionOptions = {
  minWidth?: number;
  align?: "left" | "right";
  offset?: number;
};

/** Fixed coordinates for a dropdown panel portaled to `document.body`. */
export function useAnchoredPanelPosition(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>,
  options: UseAnchoredPanelPositionOptions = {},
) {
  const { minWidth = 280, align = "left", offset = 4 } = options;
  const [style, setStyle] = useState<CSSProperties>({ visibility: "hidden" });

  const update = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const width = Math.max(rect.width, minWidth);
    let left = align === "right" ? rect.right - width : rect.left;
    left = Math.max(8, Math.min(left, window.innerWidth - width - 8));

    setStyle({
      position: "fixed",
      top: rect.bottom + offset,
      left,
      width,
      zIndex: 200,
      visibility: "visible",
    });
  }, [align, anchorRef, minWidth, offset]);

  useEffect(() => {
    if (!open) return;
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, update]);

  return style;
}
