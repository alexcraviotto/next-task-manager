import { DashboardStructure } from "@/components/dashboard/DashboardStructure";
import { DashboardTitle } from "@/components/dashboard/DashboardTitle";
import { MembersTable } from "@/components/dashboard/members/MembersTable";

export default function Dashboard({
  params,
}: {
  params: { projectId: string };
}) {
  const { projectId } = params;
  console.log("🚀 ~ projectId:", projectId);

  return (
    <DashboardStructure>
      <DashboardTitle title="🧑🏼‍ Miembros" />
      <MembersTable organizationId={projectId} />
    </DashboardStructure>
  );
}
