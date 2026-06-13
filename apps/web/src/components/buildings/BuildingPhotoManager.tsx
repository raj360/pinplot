"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type BuildingImage,
  deleteAdminBuildingImage,
  deleteBuildingImage,
  fetchAdminBuildingImages,
  fetchBuildingImages,
  registerAdminBuildingImage,
  registerBuildingImage,
  setAdminBuildingCoverImage,
  setBuildingCoverImage,
  uploadAndRegisterBuildingImages,
} from "@/lib/api/building-images";
import { MAX_BUILDING_PHOTOS } from "@plotpin/shared-types";
import { uploadBuildingImage } from "@/lib/supabase/storage";
import { Button } from "@/components/ui/button";
import { validateBuildingCoverFile } from "@/components/ui/image-upload";
import {
  BUILDING_PHOTO_GRID_CLASS,
  BuildingPhotoTile,
} from "@/components/buildings/BuildingPhotoTile";
import type { DraftPhoto } from "@/components/buildings/BuildingGalleryUpload";
import { cn } from "@/lib/utils/cn";

type BuildingPhotoManagerProps = {
  buildingId: string;
  variant?: "landlord" | "admin";
  readOnly?: boolean;
};

function createDraftPhoto(file: File): DraftPhoto {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    file,
  };
}

export function BuildingPhotoManager({
  buildingId,
  variant = "landlord",
  readOnly = false,
}: BuildingPhotoManagerProps) {
  const isAdmin = variant === "admin";
  const inputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<BuildingImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [draftPhotos, setDraftPhotos] = useState<DraftPhoto[]>([]);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    try {
      const data = isAdmin
        ? await fetchAdminBuildingImages(buildingId)
        : await fetchBuildingImages(buildingId);
      if (!mountedRef.current) return;
      setImages(data);
      setError(null);
    } catch {
      if (!mountedRef.current) return;
      setError("Could not load photos.");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [buildingId, isAdmin]);

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => {
      mountedRef.current = false;
    };
  }, [load]);

  const draftPreviewUrls = useMemo(() => {
    const map = new Map<string, string>();
    for (const photo of draftPhotos) {
      map.set(photo.id, URL.createObjectURL(photo.file));
    }
    return map;
  }, [draftPhotos]);

  useEffect(() => {
    return () => {
      for (const url of draftPreviewUrls.values()) {
        URL.revokeObjectURL(url);
      }
    };
  }, [draftPreviewUrls]);

  const remainingSlots = Math.max(
    0,
    MAX_BUILDING_PHOTOS - images.length - draftPhotos.length,
  );
  const atPhotoLimit = remainingSlots === 0;
  const totalCount = images.length + draftPhotos.length;

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const nextDrafts = [...draftPhotos];

      for (const file of Array.from(files)) {
        if (images.length + nextDrafts.length >= MAX_BUILDING_PHOTOS) {
          setDraftError(
            `Maximum ${MAX_BUILDING_PHOTOS} photos (cover included). Remove one to add another.`,
          );
          break;
        }

        const validationError = validateBuildingCoverFile(file);
        if (validationError) {
          setDraftError(validationError);
          continue;
        }

        nextDrafts.push(createDraftPhoto(file));
      }

      setDraftError(null);
      setDraftPhotos(nextDrafts);
      if (inputRef.current) inputRef.current.value = "";
    },
    [draftPhotos, images.length],
  );

  async function handleSetCover(imageId: string) {
    setBusyId(imageId);
    setError(null);
    try {
      const updated = isAdmin
        ? await setAdminBuildingCoverImage(buildingId, imageId)
        : await setBuildingCoverImage(buildingId, imageId);
      await load();
      if (updated) {
        setImages((prev) =>
          prev.map((image) => ({
            ...image,
            isPrimary: image.id === updated.id,
          })),
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update cover.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(imageId: string) {
    setBusyId(imageId);
    setError(null);
    try {
      if (isAdmin) {
        await deleteAdminBuildingImage(buildingId, imageId);
      } else {
        await deleteBuildingImage(buildingId, imageId);
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove photo.");
    } finally {
      setBusyId(null);
    }
  }

  function removeDraft(id: string) {
    setDraftPhotos((prev) => prev.filter((photo) => photo.id !== id));
    setDraftError(null);
  }

  async function handleUploadDrafts() {
    if (draftPhotos.length === 0) return;

    if (images.length + draftPhotos.length > MAX_BUILDING_PHOTOS) {
      setError(
        `Maximum ${MAX_BUILDING_PHOTOS} photos per building (cover included).`,
      );
      return;
    }

    setUploading(true);
    setError(null);
    setDraftError(null);

    try {
      const register = isAdmin
        ? registerAdminBuildingImage
        : registerBuildingImage;
      const hadNoPhotos = images.length === 0;

      await uploadAndRegisterBuildingImages(
        buildingId,
        draftPhotos.map((photo) => photo.file),
        hadNoPhotos ? 0 : -1,
        register,
        uploadBuildingImage,
      );

      setDraftPhotos([]);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload photos.");
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted">Loading photos…</p>;
  }

  return (
    <div className="space-y-4">
      {totalCount > 0 || !readOnly ? (
        <ul className={BUILDING_PHOTO_GRID_CLASS}>
          {images.map((image) => (
            <BuildingPhotoTile
              key={image.id}
              src={image.thumbStoragePath ?? image.storagePath}
              isCover={image.isPrimary}
              readOnly={readOnly}
              busy={busyId === image.id}
              onSetCover={() => handleSetCover(image.id)}
              onRemove={() => handleDelete(image.id)}
            />
          ))}

          {draftPhotos.map((photo) => {
            const previewUrl = draftPreviewUrls.get(photo.id);
            if (!previewUrl) return null;
            return (
              <BuildingPhotoTile
                key={photo.id}
                src={previewUrl}
                isCover={false}
                pending
                busy={uploading}
                onRemove={() => removeDraft(photo.id)}
              />
            );
          })}

          {!readOnly && !atPhotoLimit ? (
            <li className="min-w-0 list-none">
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
                  "flex aspect-[4/3] w-full flex-col items-center justify-center gap-1 border border-dashed px-2 py-4 text-center text-xs transition-colors",
                  dragOver
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border bg-surface text-muted hover:border-primary/40",
                )}
              >
                <span className="font-medium text-foreground">Add photo</span>
                <span>
                  {totalCount}/{MAX_BUILDING_PHOTOS}
                </span>
              </button>
            </li>
          ) : null}
        </ul>
      ) : (
        <p className="text-sm text-muted">No photos yet.</p>
      )}

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

      {!readOnly && draftPhotos.length > 0 ? (
        <Button
          type="button"
          loading={uploading}
          loadingLabel="Uploading photos"
          onClick={handleUploadDrafts}
        >
          Upload {draftPhotos.length} pending photo
          {draftPhotos.length === 1 ? "" : "s"}
        </Button>
      ) : null}

      {atPhotoLimit && !readOnly ? (
        <p className="text-xs text-muted">
          Maximum {MAX_BUILDING_PHOTOS} photos (cover included). Remove one to add
          another.
        </p>
      ) : null}

      {draftError ? <p className="text-sm text-red-600">{draftError}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
