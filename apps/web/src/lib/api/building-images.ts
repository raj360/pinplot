import { apiFetch } from "./client";

export type BuildingImage = {
  id: string;
  storagePath: string;
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
) {
  return apiFetch<BuildingImage>(`/buildings/${buildingId}/images`, {
    method: "POST",
    body: JSON.stringify({ storagePath, isPrimary }),
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
) {
  return apiFetch<BuildingImage>(`/admin/buildings/${buildingId}/images`, {
    method: "POST",
    body: JSON.stringify({ storagePath, isPrimary }),
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
  ) => Promise<BuildingImage>,
  upload: (buildingId: string, file: File) => Promise<string>,
) {
  const results: BuildingImage[] = [];
  for (let index = 0; index < files.length; index += 1) {
    const publicUrl = await upload(buildingId, files[index]);
    results.push(
      await register(buildingId, publicUrl, index === primaryIndex),
    );
  }
  return results;
}
