import { DashboardStructure } from "@/components/dashboard/DashboardStructure";
import { DashboardTitle } from "@/components/dashboard/DashboardTitle";
import { TaskTable } from "@/components/dashboard/tasks/TaskTable";

export default function Dashboard({ params }: { params: { uuid: string } }) {
  const { uuid } = params;

  return (
    <DashboardStructure>
      <DashboardTitle title="📝 Tareas" />
      <TaskTable projectId={uuid} />
    </DashboardStructure>
  );
}
