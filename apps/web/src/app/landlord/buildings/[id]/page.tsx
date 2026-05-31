import ManageBuildingClient from "./ManageBuildingClient";

export default async function ManageBuildingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ManageBuildingClient buildingId={id} />;
}
