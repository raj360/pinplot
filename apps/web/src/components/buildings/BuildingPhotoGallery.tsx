"use client";

import { useState } from "react";

export function BuildingPhotoGallery({
  urls,
  alt,
  compact = false,
}: {
  urls: string[];
  alt: string;
  compact?: boolean;
}) {
  const [index, setIndex] = useState(0);

  if (urls.length === 0) return null;

  const current = urls[Math.min(index, urls.length - 1)] ?? urls[0];
  const hasMultiple = urls.length > 1;
  const imageClass = compact
    ? "max-h-44 w-full object-cover"
    : "aspect-[16/10] w-full object-cover sm:aspect-[2/1]";

  const go = (delta: number) => {
    setIndex((prev) => (prev + delta + urls.length) % urls.length);
  };

  return (
    <div className="relative bg-muted/20">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={current} alt={`${alt} — photo ${index + 1}`} className={imageClass} />

      {hasMultiple ? (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/55 px-2.5 py-2 text-sm font-medium text-white hover:bg-black/70"
            aria-label="Previous photo"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/55 px-2.5 py-2 text-sm font-medium text-white hover:bg-black/70"
            aria-label="Next photo"
          >
            ›
          </button>
          <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
            {urls.map((url, i) => (
              <button
                key={url}
                type="button"
                onClick={() => setIndex(i)}
                className={`h-1.5 w-1.5 rounded-full ${
                  i === index ? "bg-white" : "bg-white/45 hover:bg-white/70"
                }`}
                aria-label={`Show photo ${i + 1}`}
              />
            ))}
          </div>
          <p className="absolute right-3 top-3 bg-black/55 px-2 py-0.5 text-xs font-medium text-white">
            {index + 1} / {urls.length}
          </p>
        </>
      ) : null}
    </div>
  );
}
