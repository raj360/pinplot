export const BUILDING_IMAGES_BUCKET = "building-images";

/** Extract object key from a Supabase public URL. */
export function publicUrlToStoragePath(
  publicUrl: string,
  bucket = BUILDING_IMAGES_BUCKET,
): string | null {
  const marker = `/object/public/${bucket}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(publicUrl.slice(idx + marker.length));
}

export function collectStoragePaths(
  ...urls: Array<string | null | undefined>
): string[] {
  const paths = new Set<string>();
  for (const url of urls) {
    if (!url) continue;
    const path = publicUrlToStoragePath(url);
    if (path) paths.add(path);
  }
  return [...paths];
}
