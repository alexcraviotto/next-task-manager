"use client";

import { DashboardStructure } from "@/components/dashboard/DashboardStructure";
import { DashboardTitle } from "@/components/dashboard/DashboardTitle";
import Gantt from "@/components/Gantt";
import { Link, Task } from "dhtmlx-gantt";

const mockTasks: { data: Task[]; links: Link[] } = {
  data: [
    {
      id: 1,
      text: "GestionarTarea1",
      description: "",
      type: "task",
      start_date: new Date("2024-10-19"),
      end_date: new Date("2024-10-20"),
      progress: 0,
      parent: 0,
    },
    {
      id: 2,
      text: "NuevaTareaNueva",
      description: "",
      type: "task",
      start_date: new Date("2024-10-19"),
      end_date: new Date("2024-10-20"),
      progress: 0,
      parent: 0,
    },
  ],
  links: [{ id: 1, source: 1, target: 2, type: "0" }],
};

export default function Dashboard({
  params,
}: {
  params: { projectId: string };
}) {
  const { projectId } = params;
  console.log("🚀 ~ projectId:", projectId);

  const handleTaskChange = (task: Task) => {
    console.log("Task updated:", task);
  };

  const handleLinkChange = (link: Link) => {
    console.log("Link updated:", link);
  };

  return (
    <DashboardStructure>
      <DashboardTitle title="📊 Diagrama de Gantt" />
      <div className="mt-8">
        <Gantt
          tasks={mockTasks}
          onTaskChange={handleTaskChange}
          onLinkChange={handleLinkChange}
        />
      </div>
    </DashboardStructure>
  );
}
