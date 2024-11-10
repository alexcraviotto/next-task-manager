"use client";

import { DashboardStructure } from "@/components/dashboard/DashboardStructure";
import { DashboardTitle } from "@/components/dashboard/DashboardTitle";
import { MembersTable } from "@/components/dashboard/members/MembersTable";
import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";

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
      <DashboardTitle title="🧑🏼‍ Miembros" />
      <MembersTable organizationId={organizationId} />
    </DashboardStructure>
  );
}
