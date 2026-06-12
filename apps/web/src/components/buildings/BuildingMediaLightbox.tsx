"use client";

import { useCallback, useEffect, useState } from "react";
import { YouTubeEmbed } from "@/components/buildings/YouTubeEmbed";

export type MediaSlide =
  | { type: "photo"; url: string }
  | { type: "video"; url: string; title: string };

export function BuildingMediaLightbox({
  slides,
  initialIndex = 0,
  open,
  onClose,
  alt,
}: {
  slides: MediaSlide[];
  initialIndex?: number;
  open: boolean;
  onClose: () => void;
  alt: string;
}) {
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    if (open) setIndex(initialIndex);
  }, [open, initialIndex]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") {
        setIndex((prev) => (prev - 1 + slides.length) % slides.length);
      }
      if (event.key === "ArrowRight") {
        setIndex((prev) => (prev + 1) % slides.length);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose, slides.length]);

  const go = useCallback(
    (delta: number) => {
      setIndex((prev) => (prev + delta + slides.length) % slides.length);
    },
    [slides.length],
  );

  if (!open || slides.length === 0) return null;

  const slide = slides[Math.min(index, slides.length - 1)] ?? slides[0];
  const hasMultiple = slides.length > 1;

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-black/95"
      role="dialog"
      aria-modal="true"
      aria-label={`${alt} media gallery`}
    >
      <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 text-white">
        <p className="text-sm font-medium">
          {index + 1} / {slides.length}
          {slide.type === "video" ? " · Building tour" : ""}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 text-sm text-white/80 hover:text-white"
        >
          Close
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-4">
        {slide.type === "photo" ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={slide.url}
            alt={`${alt}, photo ${index + 1}`}
            className="max-h-[75vh] max-w-full object-contain"
          />
        ) : (
          <div className="w-full max-w-4xl">
            <YouTubeEmbed url={slide.url} title={slide.title} />
          </div>
        )}

        {hasMultiple ? (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/15 px-3 py-3 text-2xl text-white hover:bg-white/25 sm:left-4"
              aria-label="Previous"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/15 px-3 py-3 text-2xl text-white hover:bg-white/25 sm:right-4"
              aria-label="Next"
            >
              ›
            </button>
          </>
        ) : null}
      </div>

      {hasMultiple ? (
        <div className="flex shrink-0 justify-center gap-2 overflow-x-auto px-4 pb-4">
          {slides.map((item, i) => (
            <button
              key={`${item.type}-${i}`}
              type="button"
              onClick={() => setIndex(i)}
              className={`h-14 w-20 shrink-0 overflow-hidden border-2 ${
                i === index ? "border-white" : "border-white/30 hover:border-white/60"
              }`}
              aria-label={
                item.type === "video"
                  ? "Show building tour video"
                  : `Show photo ${i + 1}`
              }
            >
              {item.type === "photo" ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={item.url} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-black text-xs text-white">
                  ▶ Tour
                </span>
              )}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
