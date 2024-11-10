"use client";

import { DashboardStructure } from "@/components/dashboard/DashboardStructure";
import { DashboardTitle } from "@/components/dashboard/DashboardTitle";
import Gantt from "@/components/Gantt";
import { Link, Task } from "dhtmlx-gantt";
import { useTasks } from "@/hooks/useTasks";
import { Loader2 } from "lucide-react";

export default function Dashboard({ params }: { params: { uuid: string } }) {
  const { uuid } = params;
  const { tasks, isLoading, error, updateTask } = useTasks(uuid);

  // Convert tasks to Gantt format
  const ganttTasks = {
    data: tasks.map((task) => ({
      id: task.id,
      text: task.name,
      description: task.description,
      type: task.type,
      start_date: new Date(task.startDate),
      end_date: new Date(task.endDate),
      progress: task.progress / 100,
      parent: 0,
      weight: task.weight, // Preserve weight in Gantt data
    })),
    links: [], // You can add links if needed
  };

  const handleTaskChange = async (task: Task) => {
    try {
      await updateTask(Number(task.id), {
        id: Number(task.id),
        name: task.text,
        description: task.description || "",
        type: task.type,
        startDate: task.start_date
          ? task.start_date.toISOString()
          : new Date().toISOString(),
        endDate: task.end_date
          ? task.end_date.toISOString()
          : new Date().toISOString(),
        progress:
          task.progress !== undefined ? Math.round(task.progress * 100) : 0,
        organizationId: uuid,
      });
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleLinkChange = (link: Link) => {
    console.log("Link updated:", link);
    // Implement link updates if needed
  };

  if (isLoading) {
    return (
      <DashboardStructure>
        <div className="w-full h-48 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardStructure>
    );
  }

  if (error) {
    return (
      <DashboardStructure>
        <div className="w-full p-4 text-center text-red-500">
          Error: {error}
        </div>
      </DashboardStructure>
    );
  }

  return (
    <DashboardStructure>
      <DashboardTitle title="📊 Diagrama de Gantt" />
      <div className="mt-8">
        <Gantt
          tasks={ganttTasks}
          onTaskChange={handleTaskChange}
          onLinkChange={handleLinkChange}
        />
      </div>
    </DashboardStructure>
  );
}
