import { DashboardStructure } from "@/components/dashboard/DashboardStructure";
import { DashboardTitle } from "@/components/dashboard/DashboardTitle";
import { InfoTask } from "@/components/dashboard/Inicio/InfoTask";
import MonthlyChart from "@/components/dashboard/Inicio/MonthlyChart";
import { authOptions } from "@/lib/authOptions";
import { getServerSession } from "next-auth/next";

export default async function Dashboard({
  params,
}: {
  params: { projectId: string };
}) {
  const { projectId } = params;

  // Obtén la sesión usando getServerSession
  const session = await getServerSession(authOptions);
  console.log("🚀 ~ session:", JSON.stringify(session));
  console.log("🚀 ~ projectId:", projectId);
  const toCapitalize = (name: string | undefined) =>
    name ? name[0].toUpperCase() + name.slice(1) : "NoName";
  return (
    <DashboardStructure>
      <DashboardTitle
        title={`👋 Hola, ${toCapitalize(session?.user?.username)}.`}
      />
      <div className="grid grid-cols-1 md:grid-cols-4 ml-4 mt-10 space-x-0 space-y-4 md:space-x-16 md:space-y-0">
        <InfoTask name="Tareas totales" value={40} slug="tasks" />
        <InfoTask name="Tareas completadas" value={6} slug="tasks" />
        <InfoTask name="Tareas pendientes" value={10} slug="tasks" />
        <InfoTask name="Miembros" value={8} slug="members" />
      </div>
      <MonthlyChart />
    </DashboardStructure>
  );
}
