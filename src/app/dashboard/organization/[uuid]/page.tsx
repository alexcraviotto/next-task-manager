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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";

export default function Dashboard({ params }: { params: { uuid: string } }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [organizationData, setOrganizationData] =
    useState<OrganizationData | null>(null);

  interface OrganizationData {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    users: { username: string }[];
    tasks: {
      name: string;
      progress: number;
      startDate: string;
      endDate: string;
      createdBy: { username: string };
    }[];
    totalProgress: number;
  }

  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        const response = await fetch(`/api/organizations?id=${params.uuid}`);
        if (!response.ok) {
          router.push("/dashboard/organization");
          return;
        }
        const data = await response.json();
        setOrganizationData(data);
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
  }, [params.uuid, router, session]);

  if (!session?.user?.isAdmin) {
    return (
      <DashboardStructure>
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardStructure>
    );
  }
  if (loading) {
    return (
      <DashboardStructure>
        <DashboardSkeleton />
      </DashboardStructure>
    );
  }

  const toCapitalize = (name: string | undefined) =>
    name ? name[0].toUpperCase() + name.slice(1) : "NoName";

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut", staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <DashboardStructure>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-6 m-5"
      >
        <motion.div
          variants={itemVariants}
          className="flex justify-between items-center"
        >
          <DashboardTitle
            title={`👋 Bienvenido, ${toCapitalize(session?.user?.username)}`}
          />
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <InfoTask
            name="Tareas totales"
            value={organizationData?.totalTasks || 0}
            slug="tasks"
          />
          <InfoTask
            name="Tareas completadas"
            value={organizationData?.completedTasks || 0}
            slug="tasks"
          />
          <InfoTask
            name="Tareas pendientes"
            value={organizationData?.pendingTasks || 0}
            slug="tasks"
          />
          <InfoTask
            name="Miembros"
            value={organizationData?.users?.length || 0}
            slug="members"
          />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div variants={itemVariants} className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Progreso mensual</CardTitle>
                <CardDescription>
                  Visualización de tareas completadas por mes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MonthlyChart tasks={organizationData?.tasks} />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Actividad reciente</CardTitle>
                <CardDescription>
                  Últimas actualizaciones del equipo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] pr-4">
                  {organizationData?.tasks?.slice(-5).map((task, index) => (
                    <div key={index} className="flex items-center mb-4">
                      <div>
                        <p className="text-sm font-medium">
                          {task.createdBy.username}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {task.progress === 100
                            ? "Completó"
                            : {
                                0: "Creó",
                                25: "Inició",
                                50: "Avanzó",
                                75: "Casi completó",
                              }[task.progress] || "Actualizó"}{" "}
                          {task.progress === 100 ? "la tarea" : "la tarea"}{" "}
                          {task.name}
                          <Badge variant="outline" className="ml-2">
                            {task.progress}% completado
                          </Badge>
                          <div></div>
                        </p>
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Progreso del proyecto</CardTitle>
              <CardDescription>Estado actual del proyecto</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 m-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Progreso total</span>
                    <span className="text-sm font-medium">
                      {organizationData?.totalProgress || 0}%
                    </span>
                  </div>
                  <Progress
                    value={organizationData?.totalProgress || 0}
                    className="h-3"
                  />
                </div>
                {organizationData !== null && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {organizationData?.totalProgress < 25 &&
                      "El proyecto está en sus etapas iniciales."}
                    {organizationData?.totalProgress >= 25 &&
                      organizationData?.totalProgress < 50 &&
                      "El proyecto está avanzando constantemente."}
                    {organizationData?.totalProgress >= 50 &&
                      organizationData?.totalProgress < 75 &&
                      "El proyecto está en pleno desarrollo."}
                    {organizationData?.totalProgress >= 75 &&
                      organizationData?.totalProgress < 100 &&
                      "El proyecto está cerca de completarse."}
                    {organizationData?.totalProgress === 100 &&
                      "¡El proyecto ha sido completado!"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </DashboardStructure>
  );
}
