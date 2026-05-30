"use client";

import { useMemo, useState } from "react";
import {
  BuildingMediaLightbox,
  type MediaSlide,
} from "@/components/buildings/BuildingMediaLightbox";
import { resolveImageUrls } from "@/lib/buildings/media";
import { youTubeThumbnailUrl } from "@/lib/youtube/embed";

export function BuildingMediaPreview({
  name,
  location,
  imageUrls,
  coverImageUrl,
  videoUrl,
  compact = false,
}: {
  name: string;
  location?: string;
  imageUrls?: string[];
  coverImageUrl?: string;
  videoUrl?: string;
  compact?: boolean;
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [initialSlide, setInitialSlide] = useState(0);

  const photos = resolveImageUrls({ imageUrls, coverImageUrl });
  const slides = useMemo<MediaSlide[]>(() => {
    const items: MediaSlide[] = photos.map((url) => ({ type: "photo", url }));
    if (videoUrl) {
      items.push({ type: "video", url: videoUrl, title: `${name} building tour` });
    }
    return items;
  }, [photos, videoUrl, name]);

  const openAt = (index: number) => {
    setInitialSlide(index);
    setLightboxOpen(true);
  };

  if (slides.length === 0) {
    if (compact) return null;
    return (
      <header className="border border-lime-600/30 bg-lime-50/50 px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-lime-700">
          Unlocked building
        </p>
        <h1 className="mt-1 text-xl font-bold text-lime-950">{name}</h1>
        {location ? <p className="mt-1 text-sm text-muted">{location}</p> : null}
      </header>
    );
  }

  const primary = slides[0];
  const secondary = slides.slice(1, 3);
  const extraCount = Math.max(0, slides.length - 3);
  const previewHeight = compact ? "h-32" : "h-40 sm:h-44";

  return (
    <>
      <section
        className={
          compact
            ? "overflow-hidden border border-lime-600/35 bg-surface"
            : "overflow-hidden border border-lime-600/35 bg-surface"
        }
      >
        {!compact ? (
          <header className="border-b border-lime-600/20 bg-lime-50/60 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-lime-700">
              Unlocked · full access
            </p>
            <h1 className="mt-0.5 text-xl font-bold">{name}</h1>
            {location ? <p className="mt-0.5 text-sm text-muted">{location}</p> : null}
          </header>
        ) : null}

        <div className={`flex gap-1 bg-muted/15 p-1 ${previewHeight}`}>
          <button
            type="button"
            onClick={() => openAt(0)}
            className={`relative min-w-0 flex-[1.6] overflow-hidden bg-black/5 ${
              secondary.length === 0 ? "flex-1" : ""
            }`}
            aria-label="Open media gallery"
          >
            {primary.type === "photo" ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={primary.url}
                alt={`${name} cover`}
                className="h-full w-full object-cover"
              />
            ) : (
              <VideoThumb url={primary.url} title={primary.title} />
            )}
            <span className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent px-2 pb-2 pt-6 text-left text-xs font-medium text-white">
              View gallery
            </span>
          </button>

          {secondary.length > 0 ? (
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              {secondary.map((slide, offset) => {
                const slideIndex = offset + 1;
                return (
                  <button
                    key={`${slide.type}-${slideIndex}`}
                    type="button"
                    onClick={() => openAt(slideIndex)}
                    className="relative min-h-0 flex-1 overflow-hidden bg-black/5"
                    aria-label={
                      slide.type === "video"
                        ? "Open building tour"
                        : `Open photo ${slideIndex + 1}`
                    }
                  >
                    {slide.type === "photo" ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={slide.url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <VideoThumb url={slide.url} title={slide.title} />
                    )}
                  </button>
                );
              })}
              {extraCount > 0 ? (
                <button
                  type="button"
                  onClick={() => openAt(0)}
                  className="flex flex-1 items-center justify-center bg-black/70 text-xs font-medium text-white"
                >
                  +{extraCount} more
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        <p className="border-t border-border px-3 py-2 text-xs text-muted">
          {photos.length > 0
            ? `${photos.length} photo${photos.length === 1 ? "" : "s"}`
            : null}
          {photos.length > 0 && videoUrl ? " · " : null}
          {videoUrl ? "building tour video" : null}
          {" · "}
          <button
            type="button"
            onClick={() => openAt(0)}
            className="font-medium text-primary hover:underline"
          >
            Open full view
          </button>
        </p>
      </section>

      <BuildingMediaLightbox
        slides={slides}
        initialIndex={initialSlide}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        alt={name}
      />
    </>
  );
}

function VideoThumb({ url, title }: { url: string; title: string }) {
  const thumb = youTubeThumbnailUrl(url);

  return (
    <span className="relative block h-full w-full">
      {thumb ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={thumb} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center bg-muted text-xs text-muted">
          Video
        </span>
      )}
      <span className="absolute inset-0 flex items-center justify-center bg-black/35">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-sm text-white">
          ▶
        </span>
      </span>
      <span className="sr-only">{title}</span>
    </span>
  );
}
