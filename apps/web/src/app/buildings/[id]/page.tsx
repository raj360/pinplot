import { notFound } from "next/navigation";
import { BuildingDetailPanel } from "@/components/buildings/BuildingDetailPanel";
import { UnlockPanel } from "@/components/buildings/UnlockPanel";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageMain } from "@/components/layout/PageShell";
import { fetchBuilding } from "@/lib/api/buildings";

type Props = { params: Promise<{ id: string }> };

export default async function BuildingPage({ params }: Props) {
  const { id } = await params;

  let building;
  try {
    building = await fetchBuilding(id);
  } catch {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader backHref="/explore" backLabel="← Back to map" />

      <PageMain>
        <BuildingDetailPanel building={building} />
        <UnlockPanel buildingId={building.id} units={building.units} />
      </PageMain>
    </div>
  );
}
