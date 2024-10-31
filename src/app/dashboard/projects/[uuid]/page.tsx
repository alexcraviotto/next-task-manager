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
    <div className="mt-4">
      <h1 className="text-4xl font-normal text-[#272727] text-opacity-[0.86]">
        👋 Hola, {toCapitalize(session?.user?.username)}.
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-4 ml-4 mt-10 space-x-0 space-y-4 md:space-x-16 md:space-y-0">
        <InfoTask name="Tareas totales" value={40} />
        <InfoTask name="Tareas completadas" value={6} />
        <InfoTask name="Tareas pendientes" value={10} />
        <InfoTask name="Miembros" value={8} />
      </div>
      <MonthlyChart />
    </div>
  );
}
