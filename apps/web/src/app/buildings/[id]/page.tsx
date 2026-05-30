import { redirect } from "next/navigation";
import { exploreBuildingUrl } from "@/lib/explore/urls";

type Props = { params: Promise<{ id: string }> };

/** Deep links open Explore with the building selected and map hidden. */
export default async function BuildingPage({ params }: Props) {
  const { id } = await params;
  redirect(exploreBuildingUrl(id, { hideMap: true }));
}
