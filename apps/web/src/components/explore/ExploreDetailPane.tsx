import { BuildingDetailExperience } from "@/components/buildings/BuildingDetailExperience";
import { BuildingPreviewSkeleton } from "@/components/explore/BuildingPreviewSkeleton";
import type { BuildingDetail } from "@/lib/api/buildings";

type ExploreDetailPaneProps = {
  loading: boolean;
  detail: BuildingDetail | null;
  variant: "compact" | "full";
  onUnlockSuccess?: () => void;
  onExpandToFull?: () => void;
};

export function ExploreDetailPane({
  loading,
  detail,
  variant,
  onUnlockSuccess,
  onExpandToFull,
}: ExploreDetailPaneProps) {
  if (loading || !detail) {
    return (
      <BuildingPreviewSkeleton mode={variant === "compact" ? "summary" : "full"} />
    );
  }

  return (
    <BuildingDetailExperience
      building={detail}
      variant={variant}
      layout="stack"
      hideHeader
      onUnlockSuccess={onUnlockSuccess}
      onExpandToFull={onExpandToFull}
    />
  );
}
