"use client";

import { DashboardStructure } from "@/components/dashboard/DashboardStructure";
import { DashboardTitle } from "@/components/dashboard/DashboardTitle";
import { InfoTask } from "@/components/dashboard/home/InfoTask";
import MonthlyChart from "@/components/dashboard/home/MonthlyChart";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
  return (
    <DashboardStructure>
      <DashboardTitle
        title={`👋 Hola, ${toCapitalize(data?.user?.username)}.`}
      />
      <div className="grid grid-cols-1 md:grid-cols-4 mt-10 space-x-0 space-y-4 md:space-x-16 md:space-y-0">
        <InfoTask name="Tareas totales" value={40} slug="tasks" />
        <InfoTask name="Tareas completadas" value={6} slug="tasks" />
        <InfoTask name="Tareas pendientes" value={10} slug="tasks" />
        <InfoTask name="Miembros" value={8} slug="members" />
      </div>
      <MonthlyChart />
    </DashboardStructure>
  );
}
