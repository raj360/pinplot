"use client";

import { compressBuildingImages } from "@/lib/images/compress-building-image";
import { validateBuildingCoverSourceFile } from "@/components/ui/image-upload";

export type BuildingImageUpload = {
  fullUrl: string;
  thumbUrl: string;
};

export async function uploadBuildingImage(
  buildingId: string,
  file: File,
): Promise<BuildingImageUpload> {
  const validationError = validateBuildingCoverSourceFile(file);
  if (validationError) throw new Error(validationError);

  const { createClient } = await import("@/lib/supabase/client");
  const { full, thumb } = await compressBuildingImages(file);

  const supabase = createClient();
  const stamp = Date.now();
  const fullPath = `${buildingId}/${stamp}-full.jpg`;
  const thumbPath = `${buildingId}/${stamp}-thumb.jpg`;

  const bucket = supabase.storage.from("building-images");
  const [fullUpload, thumbUpload] = await Promise.all([
    bucket.upload(fullPath, full, {
      upsert: false,
      contentType: "image/jpeg",
    }),
    bucket.upload(thumbPath, thumb, {
      upsert: false,
      contentType: "image/jpeg",
    }),
  ]);

  if (fullUpload.error) throw new Error(fullUpload.error.message);
  if (thumbUpload.error) {
    await bucket.remove([fullPath]);
    throw new Error(thumbUpload.error.message);
  }

  const { data: fullData } = bucket.getPublicUrl(fullPath);
  const { data: thumbData } = bucket.getPublicUrl(thumbPath);

  return {
    fullUrl: fullData.publicUrl,
    thumbUrl: thumbData.publicUrl,
  };
}
