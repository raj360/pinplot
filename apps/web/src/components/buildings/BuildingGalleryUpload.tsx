"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MAX_BUILDING_PHOTOS } from "@plotpin/shared-types";
import { cn } from "@/lib/utils/cn";
import { validateBuildingCoverFile } from "@/components/ui/image-upload";
import { BUILDING_PHOTO_UPLOAD_HINT } from "@/lib/images/constants";

export { MAX_BUILDING_PHOTOS };

export type DraftPhoto = {
  id: string;
  file: File;
};

type BuildingGalleryUploadProps = {
  photos: DraftPhoto[];
  primaryId: string | null;
  onChange: (photos: DraftPhoto[], primaryId: string | null) => void;
  /** Remaining slots (defaults to full listing limit). */
  maxPhotos?: number;
  error?: string | null;
  onValidationError?: (message: string | null) => void;
  showHeading?: boolean;
};

function createDraftPhoto(file: File): DraftPhoto {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    file,
  };
}

export function BuildingGalleryUpload({
  photos,
  primaryId,
  onChange,
  maxPhotos = MAX_BUILDING_PHOTOS,
  error,
  onValidationError,
  showHeading = true,
}: BuildingGalleryUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const previewUrls = useMemo(() => {
    const map = new Map<string, string>();
    for (const photo of photos) {
      map.set(photo.id, URL.createObjectURL(photo.file));
    }
    return map;
  }, [photos]);

  useEffect(() => {
    return () => {
      for (const url of previewUrls.values()) {
        URL.revokeObjectURL(url);
      }
    };
  }, [previewUrls]);

  const displayError = error ?? localError;
  const limitLabel = `Up to ${MAX_BUILDING_PHOTOS} photos total (cover included).`;

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const nextPhotos = [...photos];
      let nextPrimaryId = primaryId;

      for (const file of Array.from(files)) {
        if (nextPhotos.length >= maxPhotos) {
          const message =
            maxPhotos < MAX_BUILDING_PHOTOS
              ? `You can add ${maxPhotos} more photo${maxPhotos === 1 ? "" : "s"} (${MAX_BUILDING_PHOTOS} max including cover).`
              : `You can add up to ${MAX_BUILDING_PHOTOS} photos (cover included).`;
          setLocalError(message);
          onValidationError?.(message);
          break;
        }

        const validationError = validateBuildingCoverFile(file);
        if (validationError) {
          setLocalError(validationError);
          onValidationError?.(validationError);
          continue;
        }

        const draft = createDraftPhoto(file);
        nextPhotos.push(draft);
        if (!nextPrimaryId) {
          nextPrimaryId = draft.id;
        }
      }

      setLocalError(null);
      onValidationError?.(null);
      onChange(nextPhotos, nextPrimaryId);
      if (inputRef.current) inputRef.current.value = "";
    },
    [maxPhotos, onChange, onValidationError, photos, primaryId],
  );

  function removePhoto(id: string) {
    const nextPhotos = photos.filter((photo) => photo.id !== id);
    let nextPrimaryId = primaryId;
    if (primaryId === id) {
      nextPrimaryId = nextPhotos[0]?.id ?? null;
    }
    onChange(nextPhotos, nextPrimaryId);
  }

  if (maxPhotos <= 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {showHeading ? (
        <div>
          <span className="block text-sm font-medium">
            Building photos
            <span className="text-red-600"> *</span>
          </span>
          <p className="mt-1 text-sm text-muted">
            {limitLabel} {BUILDING_PHOTO_UPLOAD_HINT} Mark one as cover; tenants
            see the rest after unlock.
          </p>
        </div>
      ) : null}

      {photos.length > 0 ? (
        <ul className="grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-4">
          {photos.map((photo) => {
            const isCover = photo.id === primaryId;
            const previewUrl = previewUrls.get(photo.id);

            return (
              <li
                key={photo.id}
                className={cn(
                  "relative overflow-hidden border bg-background",
                  isCover ? "border-primary ring-1 ring-primary" : "border-border",
                )}
              >
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt=""
                    className="aspect-[4/3] w-full object-cover"
                  />
                ) : null}
                <div className="space-y-1 border-t border-border p-2">
                  {isCover ? (
                    <span className="block text-xs font-medium text-primary">
                      Cover
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="text-xs text-primary hover:underline"
                      onClick={() => onChange(photos, photo.id)}
                    >
                      Set as cover
                    </button>
                  )}
                  <button
                    type="button"
                    className="block text-xs text-muted hover:text-red-600"
                    onClick={() => removePhoto(photo.id)}
                  >
                    Remove
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      {photos.length < maxPhotos ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            if (event.dataTransfer.files?.length) {
              addFiles(event.dataTransfer.files);
            }
          }}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 border border-dashed px-4 py-8 text-center text-sm transition-colors",
            dragOver
              ? "border-primary bg-primary/5 text-primary"
              : "border-border bg-surface text-muted hover:border-primary/40",
          )}
        >
          <span className="font-medium text-foreground">
            {photos.length === 0 ? "Drop photos here" : "Add more photos"}
          </span>
          <span>
            {photos.length === 0
              ? "At least one cover photo required"
              : `${photos.length} / ${maxPhotos} selected`}
          </span>
        </button>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        multiple
        className="sr-only"
        onChange={(event) => {
          if (event.target.files?.length) {
            addFiles(event.target.files);
          }
        }}
      />

      {displayError ? (
        <p className="text-xs text-red-600" role="alert">
          {displayError}
        </p>
      ) : null}
    </div>
  );
}

export function draftPhotosToPreviewUrls(photos: DraftPhoto[]) {
  return photos.map((photo) => URL.createObjectURL(photo.file));
}
