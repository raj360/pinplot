import { BuildingMediaPreview } from "@/components/buildings/BuildingMediaPreview";

export function BuildingUnlockedHero({
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
  showVideo?: boolean;
}) {
  return (
    <BuildingMediaPreview
      name={name}
      location={location}
      imageUrls={imageUrls}
      coverImageUrl={coverImageUrl}
      videoUrl={videoUrl}
      compact={compact}
    />
  );
}
