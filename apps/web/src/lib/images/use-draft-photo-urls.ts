"use client";

import { useCallback, useEffect, useRef } from "react";
import type { DraftPhoto } from "@/components/buildings/BuildingGalleryUpload";

/**
 * Stable blob URLs for draft listing photos. Survives step navigation in
 * multi-step forms — unlike per-component useMemo + cleanup, which revokes URLs
 * when the upload step unmounts and breaks thumbnails on return.
 */
export function useDraftPhotoUrls(photos: DraftPhoto[]) {
  const cacheRef = useRef<Map<string, string>>(new Map());

  const getUrl = useCallback((photo: DraftPhoto) => {
    const cached = cacheRef.current.get(photo.id);
    if (cached) return cached;
    const url = URL.createObjectURL(photo.file);
    cacheRef.current.set(photo.id, url);
    return url;
  }, []);

  useEffect(() => {
    const activeIds = new Set(photos.map((photo) => photo.id));
    for (const [id, url] of cacheRef.current) {
      if (!activeIds.has(id)) {
        URL.revokeObjectURL(url);
        cacheRef.current.delete(id);
      }
    }
  }, [photos]);

  useEffect(() => {
    const cache = cacheRef.current;
    return () => {
      for (const url of cache.values()) {
        URL.revokeObjectURL(url);
      }
      cache.clear();
    };
  }, []);

  return { getUrl };
}
