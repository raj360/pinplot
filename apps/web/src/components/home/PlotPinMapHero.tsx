"use client";

import { useEffect, useRef, useState } from "react";
import { EXPLORE_MAP_PIN_COLORS } from "@/lib/maps/config";
import { HERO_MAP_URL } from "@/components/home/hero-map-scenes";

type PlotPinMapHeroProps = {
  className?: string;
};

export function PlotPinMapHero({ className }: PlotPinMapHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const destroyRef = useRef<(() => void) | null>(null);
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [pinCount, setPinCount] = useState(() =>
    typeof window !== "undefined" && window.innerWidth < 640 ? 5 : 7,
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry?.isIntersecting ?? false),
      { rootMargin: "80px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const updatePinCount = () => {
      setPinCount(window.innerWidth < 640 ? 5 : 7);
    };
    window.addEventListener("resize", updatePinCount);
    return () => window.removeEventListener("resize", updatePinCount);
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    const container = containerRef.current;
    if (!svg || !container || !visible) return;

    let cancelled = false;

    void (async () => {
      destroyRef.current?.();
      destroyRef.current = null;

      const { width, height } = container.getBoundingClientRect();
      if (width < 1 || height < 1) return;
      if (document.hidden) return;

      const { renderPlotPinMapHero } = await import("./plotpin-map-hero");
      if (cancelled) return;

      const renderer = renderPlotPinMapHero(svg, {
        width,
        height,
        reducedMotion,
        pinCount,
        mapBackground: true,
        showLegend: true,
        colors: {
          surface: "#eef2f8",
          block: "#dde5ef",
          road: "#ffffff",
          pinAvailable: EXPLORE_MAP_PIN_COLORS.available,
          pinAvailableText: EXPLORE_MAP_PIN_COLORS.availableText,
          pinActive: EXPLORE_MAP_PIN_COLORS.active,
          pinUnlocked: EXPLORE_MAP_PIN_COLORS.unlocked,
          ring: EXPLORE_MAP_PIN_COLORS.highlightRing,
          ringUnlocked: EXPLORE_MAP_PIN_COLORS.highlightRingUnlocked,
        },
      });

      if (cancelled) {
        renderer.destroy();
        return;
      }
      destroyRef.current = renderer.destroy;
    })();

    return () => {
      cancelled = true;
      destroyRef.current?.();
      destroyRef.current = null;
    };
  }, [visible, reducedMotion, pinCount]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        destroyRef.current?.();
        destroyRef.current = null;
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return (
    <div ref={containerRef} className={className} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={HERO_MAP_URL}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />
      <svg
        ref={svgRef}
        className="absolute inset-0 h-full w-full"
        role="presentation"
        focusable="false"
      />
    </div>
  );
}
