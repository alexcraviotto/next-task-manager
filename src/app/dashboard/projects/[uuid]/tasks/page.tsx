import { DashboardStructure } from "@/components/dashboard/DashboardStructure";
import { DashboardTitle } from "@/components/dashboard/DashboardTitle";
import { TaskTable } from "@/components/dashboard/tasks/task-table";

export default function Dashboard({
  params,
}: {
  params: { projectId: string };
}) {
  const { projectId } = params;
  console.log("🚀 ~ projectId:", projectId);

  return (
    <DashboardStructure>
      <DashboardTitle title="📝 Tareas" />
      <TaskTable projectId={projectId} />
    </DashboardStructure>
  );
}
