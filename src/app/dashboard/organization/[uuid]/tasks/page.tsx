"use client";
import { motion } from "framer-motion";
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
         <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
         <DashboardTitle title="📝 Tareas" />
        </motion.div>
        <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
         <TasksSkeleton />
        </motion.div>

      </DashboardStructure>
    );
  }
  return (
    <DashboardStructure>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <DashboardTitle title="📝 Tareas" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <TaskTable projectId={uuid} />
      </motion.div>
    </DashboardStructure>
  );
}
