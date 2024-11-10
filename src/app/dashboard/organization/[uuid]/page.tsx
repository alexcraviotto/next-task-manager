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

  if (loading || tasksLoading || membersLoading) {
    return (
      <DashboardStructure>
        <DashboardSkeleton />
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
        <InfoTask name="Tareas totales" value={totalTasks} slug="tasks" />
        <InfoTask
          name="Tareas completadas"
          value={completedTasks}
          slug="tasks"
        />
        <InfoTask name="Tareas pendientes" value={pendingTasks} slug="tasks" />
        <InfoTask name="Miembros" value={totalMembers} slug="members" />
      </div>
      <MonthlyChart />
    </DashboardStructure>
  );
}
