"use client";

import { DashboardStructure } from "@/components/dashboard/DashboardStructure";
import { DashboardTitle } from "@/components/dashboard/DashboardTitle";
import Gantt from "@/components/Gantt";
import { useTasks } from "@/hooks/useTasks";
import { GanttSkeleton } from "@/components/dashboard/gantt/GanttSkeleton";
import { motion } from "framer-motion";

export default function Dashboard({ params }: { params: { uuid: string } }) {
  const { uuid } = params;
  const { tasks, isLoading } = useTasks(uuid);

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
        <Gantt tasks={ganttTasks} />
      </motion.div>
    </DashboardStructure>
  );
}
