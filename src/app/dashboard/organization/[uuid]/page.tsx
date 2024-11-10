"use client";

import { DashboardStructure } from "@/components/dashboard/DashboardStructure";
import { DashboardTitle } from "@/components/dashboard/DashboardTitle";
import { InfoTask } from "@/components/dashboard/home/InfoTask";
import MonthlyChart from "@/components/dashboard/home/MonthlyChart";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTasks } from "@/hooks/useTasks";
import { useMembers } from "@/hooks/use-members";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import { motion } from "framer-motion";

export default function Dashboard({ params }: { params: { uuid: string } }) {
  const router = useRouter();
  const { data } = useSession();
  const [loading, setLoading] = useState(true);
  const { tasks, isLoading: tasksLoading } = useTasks(params.uuid);
  const { members, isLoading: membersLoading } = useMembers(params.uuid);

  // Calculate task statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.progress === 100).length;
  const pendingTasks = tasks.filter((task) => task.progress < 100).length;
  const totalMembers = members.length;

  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        const response = await fetch(`/api/organizations?id=${params.uuid}`);
        if (!response.ok) {
          router.push("/dashboard/organization");
          return;
        }
      } catch (error) {
        console.error("Error fetching organization:", error);
        router.push("/dashboard/organization");
      } finally {
        setLoading(false);
      }
    };

    if (params.uuid) {
      fetchOrganization();
    }
  }, [params.uuid, router]);

 

  const toCapitalize = (name: string | undefined) =>
    name ? name[0].toUpperCase() + name.slice(1) : "NoName";

  // Variantes para la animación de entrada
  const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };
  

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
  };
   if (loading || tasksLoading || membersLoading) {
      return (
        <motion.div initial="hidden" animate="visible" variants={containerVariants}>
          <DashboardStructure>
            <DashboardSkeleton />
          </DashboardStructure>
        </motion.div>

      );
    }
  return (
   <motion.div initial="hidden" animate="visible" variants={containerVariants}>
    <DashboardStructure>
      <DashboardTitle
        title={`👋 Hola, ${toCapitalize(data?.user?.username)}.`}
      />
      <motion.div
        className="grid grid-cols-1 md:grid-cols-4 mt-10 space-x-0 space-y-4 md:space-x-16 md:space-y-0"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {[
          { name: "Tareas totales", value: totalTasks, slug: "tasks" },
          { name: "Tareas completadas", value: completedTasks, slug: "tasks" },
          { name: "Tareas pendientes", value: pendingTasks, slug: "tasks" },
          { name: "Miembros", value: totalMembers, slug: "members" },
        ].map((info, index) => (
          <motion.div key={index} variants={itemVariants}>
            <InfoTask name={info.name} value={info.value} slug={info.slug} />
          </motion.div>
        ))}
      </motion.div>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="mt-10"
      >
        <MonthlyChart />
      </motion.div>
    </DashboardStructure>
  </motion.div>

  );
}
