"use client";
import { DashboardStructure } from "@/components/dashboard/DashboardStructure";
import { DashboardTitle } from "@/components/dashboard/DashboardTitle";
import { TaskTable } from "@/components/dashboard/tasks/TaskTable";
import { useEffect } from "react";

export default function Dashboard({ params }: { params: { uuid: string } }) {
  const { uuid } = params;
  console.log("🚀 ~ projectId:", uuid);

  useEffect(() => {
    console.log("🚀 ~ projectId:", uuid);
  }, [uuid]);

  return (
    <DashboardStructure>
      <DashboardTitle title="📝 Tareas" />
      <TaskTable projectId={uuid} />
    </DashboardStructure>
  );
}
