"use client";

import { DashboardStructure } from "@/components/dashboard/DashboardStructure";
import { DashboardTitle } from "@/components/dashboard/DashboardTitle";
import Gantt from "@/components/Gantt";
import { Link, Task } from "dhtmlx-gantt";
import { useTasks } from "@/hooks/useTasks";
import { GanttSkeleton } from "@/components/dashboard/gantt/GanttSkeleton";
import { motion } from "framer-motion";

export default function Dashboard({ params }: { params: { uuid: string } }) {
  const { uuid } = params;
  const { tasks, isLoading, error, updateTask } = useTasks(uuid);

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
      weight: task.weight,
    })),
    links: [],
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
  };

  if (isLoading) {
    return (
      <DashboardStructure>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <DashboardTitle title="📊 Diagrama de Gantt" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-8"
        >
          <GanttSkeleton />
        </motion.div>
      </DashboardStructure>
    );
  }

  if (error) {
    return (
      <DashboardStructure>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full p-4 text-center text-red-500"
        >
          Error: {error}
        </motion.div>
      </DashboardStructure>
    );
  }

  return (
    <DashboardStructure>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <DashboardTitle title="📊 Diagrama de Gantt" />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="mt-8"
      >
        <Gantt
          tasks={ganttTasks}
          onTaskChange={handleTaskChange}
          onLinkChange={handleLinkChange}
        />
      </motion.div>
    </DashboardStructure>
  );
}
