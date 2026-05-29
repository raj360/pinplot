import type { TenantUnlock } from "@/lib/api/unlocks";

export type BuildingMedia = {
  coverImageUrl?: string;
  imageUrls?: string[];
  videoUrl?: string;
};

export function resolveImageUrls(media: BuildingMedia): string[] {
  if (media.imageUrls?.length) return media.imageUrls;
  if (media.coverImageUrl) return [media.coverImageUrl];
  return [];
}

export function mediaFromUnlock(unlock: TenantUnlock | undefined): BuildingMedia {
  if (!unlock) return {};
  return {
    coverImageUrl: unlock.coverImageUrl,
    imageUrls: unlock.imageUrls,
    videoUrl: unlock.videoUrl,
  };
}

export function mergeBuildingMedia(
  building?: BuildingMedia & { hasPremiumMedia?: boolean },
  unlock?: TenantUnlock,
): BuildingMedia & { hasPremiumMedia?: boolean } {
  const fromUnlock = mediaFromUnlock(unlock);
  return {
    coverImageUrl: building?.coverImageUrl ?? fromUnlock.coverImageUrl,
    imageUrls: building?.imageUrls ?? fromUnlock.imageUrls,
    videoUrl: building?.videoUrl ?? fromUnlock.videoUrl,
    hasPremiumMedia: building?.hasPremiumMedia,
  };
}
