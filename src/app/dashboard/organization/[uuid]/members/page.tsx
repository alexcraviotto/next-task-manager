"use client";

import { DashboardStructure } from "@/components/dashboard/DashboardStructure";
import { DashboardTitle } from "@/components/dashboard/DashboardTitle";
import { MembersSkeleton } from "@/components/dashboard/members/MembersSkeleton";
import { MembersTable } from "@/components/dashboard/members/MembersTable";
import { useMembers } from "@/hooks/use-members";
import { useParams } from "next/navigation";

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
      <DashboardTitle title="🧑🏼‍ Miembros" />
      <MembersTable organizationId={organizationId} />
    </DashboardStructure>
  );
}
