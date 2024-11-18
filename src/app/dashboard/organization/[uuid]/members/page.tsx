"use client";

import { DashboardStructure } from "@/components/dashboard/DashboardStructure";
import { DashboardTitle } from "@/components/dashboard/DashboardTitle";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { MembersTable } from "@/components/dashboard/members/MembersTable";
import { MembersSkeleton } from "@/components/dashboard/members/MembersSkeleton";
import { useMembers } from "@/hooks/use-members";

export default function Dashboard({ params }: { params: { uuid: string } }) {
  const organizationId = params?.uuid as string;
  const { members, isLoading, addMember, updateMember, deleteMember } =
    useMembers(organizationId);
  const { data: session } = useSession();
  if (!organizationId || isLoading) {
    return (
      <DashboardStructure>
        <DashboardTitle title="🧑🏼‍ Miembros" />
        <MembersSkeleton />
      </DashboardStructure>
    );
  }

  if (!session?.user?.isAdmin) {
    return null;
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
        <MembersTable
          organizationId={organizationId}
          members={members}
          onUpdateMember={updateMember}
          onDeleteMember={deleteMember}
          onAddMember={addMember}
        />
      </motion.div>
    </DashboardStructure>
  );
}
