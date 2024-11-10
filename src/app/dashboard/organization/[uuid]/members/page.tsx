"use client";

import { DashboardStructure } from "@/components/dashboard/DashboardStructure";
import { DashboardTitle } from "@/components/dashboard/DashboardTitle";
import { MembersSkeleton } from "@/components/dashboard/members/MembersSkeleton";
import { MembersTable } from "@/components/dashboard/members/MembersTable";
import { useMembers } from "@/hooks/use-members";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";

export default function Dashboard() {
  const params = useParams();
  const organizationId = params?.uuid as string;

  const { isLoading } = useMembers(organizationId);

  if (!organizationId || isLoading) {
    return (
      <DashboardStructure>
        <DashboardTitle title="🧑🏼‍ Miembros" />
        <MembersSkeleton />
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
