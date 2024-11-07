import { DashboardStructure } from "@/components/dashboard/DashboardStructure";
import { DashboardTitle } from "@/components/dashboard/DashboardTitle";
import VersionsBoard from "@/components/dashboard/versions/VersionsBoard";

export default function Dashboard({
  params,
}: {
  params: { projectId: string };
}) {
  const { projectId } = params;
  console.log("🚀 ~ projectId:", projectId);

  return (
    <DashboardStructure>
      <DashboardTitle title="⚡️ Versiones" />
      <VersionsBoard projectId={projectId} />
    </DashboardStructure>
  );
}
