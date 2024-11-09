import { DashboardStructure } from "@/components/dashboard/DashboardStructure";
import { DashboardTitle } from "@/components/dashboard/DashboardTitle";
import VersionsBoard from "@/components/dashboard/versions/VersionsBoard";

export default function Dashboard({ params }: { params: { uuid: string } }) {
  const { uuid } = params;
  console.log("🚀 ~ projectId:", uuid);

  return (
    <DashboardStructure>
      <DashboardTitle title="⚡️ Versiones" />
      <VersionsBoard organizationId={uuid} />
    </DashboardStructure>
  );
}
