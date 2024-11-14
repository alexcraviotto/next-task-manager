"use client";

import { useState } from "react";
import { DashboardStructure } from "@/components/dashboard/DashboardStructure";
import { DashboardTitle } from "@/components/dashboard/DashboardTitle";
import Gantt from "@/components/Gantt";
import { useTasks } from "@/hooks/useTasks";
import { GanttSkeleton } from "@/components/dashboard/gantt/GanttSkeleton";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Dashboard({ params }: { params: { uuid: string } }) {
  const { uuid } = params;
  const { tasks, isLoading } = useTasks(uuid);
  const [sortBy, setSortBy] = useState<
    | "effort"
    | "weight"
    | "progress"
    | "duration"
    | "startDate"
    | "endDate"
    | "none"
  >("none");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const handleSort = (
    type:
      | "effort"
      | "weight"
      | "progress"
      | "duration"
      | "startDate"
      | "endDate",
  ) => {
    if (sortBy === type) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(type);
      setSortOrder("desc");
    }
  };

  const getSortedTasks = () => {
    if (!sortBy || sortBy === "none") return tasks;

    return [...tasks].sort((a, b) => {
      let aValue = 0;
      let bValue = 0;

      switch (sortBy) {
        case "startDate":
          aValue = new Date(a.startDate).getTime();
          bValue = new Date(b.startDate).getTime();
          break;
        case "endDate":
          aValue = new Date(a.endDate).getTime();
          bValue = new Date(b.endDate).getTime();
          break;
        case "effort":
          aValue = a.effort || 0;
          bValue = b.effort || 0;
          break;
        case "weight":
          aValue = a.weight || 0;
          bValue = b.weight || 0;
          break;
        case "progress":
          aValue = a.progress || 0;
          bValue = b.progress || 0;
          break;
        case "duration":
          const aDuration =
            new Date(a.endDate).getTime() - new Date(a.startDate).getTime();
          const bDuration =
            new Date(b.endDate).getTime() - new Date(b.startDate).getTime();
          aValue = aDuration;
          bValue = bDuration;
          break;
      }

      return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
    });
  };

  const ganttTasks = {
    data: getSortedTasks().map((task) => ({
      id: task.id,
      text: task.name,
      description: task.description,
      type: task.type,
      start_date: new Date(task.startDate),
      end_date: new Date(task.endDate),
      progress: task.progress / 100,
      parent: 0,
      weight: task.weight,
    })),
    links: [],
  };

  if (isLoading) {
    return (
      <DashboardStructure>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <DashboardTitle title="📊 Diagrama de Gantt" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-8"
        >
          <GanttSkeleton />
        </motion.div>
      </DashboardStructure>
    );
  }

  return (
    <DashboardStructure>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <DashboardTitle title="📊 Diagrama de Gantt" />
      </motion.div>

      <div className="flex mb-4 mt-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <ArrowUpDown className="h-4 w-4" />
              Ordenar por
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setSortBy("none")}>
              Mostrar todos {sortBy === "none" && "✓"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSort("startDate")}>
              Fecha inicio{" "}
              {sortBy === "startDate" && (sortOrder === "asc" ? "↑" : "↓")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSort("endDate")}>
              Fecha fin{" "}
              {sortBy === "endDate" && (sortOrder === "asc" ? "↑" : "↓")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSort("effort")}>
              Esfuerzo{" "}
              {sortBy === "effort" && (sortOrder === "asc" ? "↑" : "↓")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSort("weight")}>
              Valoración{" "}
              {sortBy === "weight" && (sortOrder === "asc" ? "↑" : "↓")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSort("progress")}>
              Progreso{" "}
              {sortBy === "progress" && (sortOrder === "asc" ? "↑" : "↓")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSort("duration")}>
              Duración{" "}
              {sortBy === "duration" && (sortOrder === "asc" ? "↑" : "↓")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="mt-8"
      >
        <Gantt tasks={ganttTasks} />
      </motion.div>
    </DashboardStructure>
  );
}
