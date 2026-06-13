import { apiFetch } from "./client";
import type { BuildingImageUpload } from "@/lib/supabase/storage";

export type BuildingImage = {
  id: string;
  storagePath: string;
  thumbStoragePath: string;
  isPrimary: boolean;
  sortOrder: number;
  createdAt: string;
};

export async function fetchBuildingImages(buildingId: string) {
  return apiFetch<BuildingImage[]>(`/buildings/${buildingId}/images`);
}

export async function registerBuildingImage(
  buildingId: string,
  storagePath: string,
  isPrimary = false,
  thumbStoragePath?: string,
) {
  return apiFetch<BuildingImage>(`/buildings/${buildingId}/images`, {
    method: "POST",
    body: JSON.stringify({ storagePath, thumbStoragePath, isPrimary }),
  });
}

export async function deleteBuildingImage(buildingId: string, imageId: string) {
  return apiFetch<{ deleted: boolean }>(
    `/buildings/${buildingId}/images/${imageId}`,
    { method: "DELETE" },
  );
}

export async function setBuildingCoverImage(
  buildingId: string,
  imageId: string,
) {
  return apiFetch<BuildingImage>(
    `/buildings/${buildingId}/images/${imageId}/primary`,
    { method: "PATCH" },
  );
}

export async function fetchAdminBuildingImages(buildingId: string) {
  return apiFetch<BuildingImage[]>(`/admin/buildings/${buildingId}/images`);
}

export async function registerAdminBuildingImage(
  buildingId: string,
  storagePath: string,
  isPrimary = false,
  thumbStoragePath?: string,
) {
  return apiFetch<BuildingImage>(`/admin/buildings/${buildingId}/images`, {
    method: "POST",
    body: JSON.stringify({ storagePath, thumbStoragePath, isPrimary }),
  });
}

export async function deleteAdminBuildingImage(
  buildingId: string,
  imageId: string,
) {
  return apiFetch<{ deleted: boolean }>(
    `/admin/buildings/${buildingId}/images/${imageId}`,
    { method: "DELETE" },
  );
}

export async function setAdminBuildingCoverImage(
  buildingId: string,
  imageId: string,
) {
  return apiFetch<BuildingImage>(
    `/admin/buildings/${buildingId}/images/${imageId}/primary`,
    { method: "PATCH" },
  );
}

export async function uploadAndRegisterBuildingImages(
  buildingId: string,
  files: File[],
  primaryIndex: number,
  register: (
    buildingId: string,
    storagePath: string,
    isPrimary: boolean,
    thumbStoragePath?: string,
  ) => Promise<BuildingImage>,
  upload: (buildingId: string, file: File) => Promise<BuildingImageUpload>,
) {
  const results: BuildingImage[] = [];
  for (let index = 0; index < files.length; index += 1) {
    const { fullUrl, thumbUrl } = await upload(buildingId, files[index]);
    results.push(
      await register(
        buildingId,
        fullUrl,
        primaryIndex >= 0 && index === primaryIndex,
        thumbUrl,
      ),
    );
  }
  return results;
}
