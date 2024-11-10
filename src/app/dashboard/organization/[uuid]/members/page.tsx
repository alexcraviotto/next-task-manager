"use client";

import { DashboardStructure } from "@/components/dashboard/DashboardStructure";
import { DashboardTitle } from "@/components/dashboard/DashboardTitle";
import { MembersTable } from "@/components/dashboard/members/MembersTable";
import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";

export default function Dashboard() {
  const params = useParams();
  const organizationId = params?.uuid as string;

  if (!organizationId) {
    return (
      <DashboardStructure>
        <div className="w-full h-48 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Cargando...</span>
        </div>
      </DashboardStructure>
    );
  }

  return (
    <DashboardStructure>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <DashboardTitle title="🧑🏼‍ Miembros" />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <MembersTable organizationId={organizationId} />
      </motion.div>
    </DashboardStructure>
  );
}
