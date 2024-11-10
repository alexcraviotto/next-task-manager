"use client";
import { DashboardStructure } from "@/components/dashboard/DashboardStructure";
import { DashboardTitle } from "@/components/dashboard/DashboardTitle";
import { TasksSkeleton } from "@/components/dashboard/tasks/TasksSkeleton";
import { TaskTable } from "@/components/dashboard/tasks/TaskTable";
import { useTasks } from "@/hooks/useTasks";

export default function Dashboard({ params }: { params: { uuid: string } }) {
  const { uuid } = params;
  const { isLoading } = useTasks(uuid);

  if (isLoading) {
    return (
      <DashboardStructure>
        <DashboardTitle title="📝 Tareas" />
        <TasksSkeleton />
      </DashboardStructure>
    );
  }
  return (
    <DashboardStructure>
      <DashboardTitle title="📝 Tareas" />
      <TaskTable projectId={uuid} />
    </DashboardStructure>
  );
}
