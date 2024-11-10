"use client";

import { DashboardStructure } from "@/components/dashboard/DashboardStructure";
import { DashboardTitle } from "@/components/dashboard/DashboardTitle";
import { InfoTask } from "@/components/dashboard/home/InfoTask";
import MonthlyChart from "@/components/dashboard/home/MonthlyChart";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function Dashboard({ params }: { params: { uuid: string } }) {
  const router = useRouter();
  const { data } = useSession();
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <DashboardStructure>
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardStructure>
    );
  }

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

  return (
    <DashboardStructure>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
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
            { name: "Tareas totales", value: 40, slug: "tasks" },
            { name: "Tareas completadas", value: 6, slug: "tasks" },
            { name: "Tareas pendientes", value: 10, slug: "tasks" },
            { name: "Miembros", value: 8, slug: "members" },
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
      </motion.div>
    </DashboardStructure>
  );
}
