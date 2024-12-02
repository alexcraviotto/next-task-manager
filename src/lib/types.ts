import {
  ChartBar,
  Home,
  SquareCheck,
  UsersRound,
  History as HistoryIcon,
  LucideProps,
  Settings,
} from "lucide-react";
import { ForwardRefExoticComponent, RefAttributes } from "react";

interface SidebarItem {
  title: string;
  slug: string;
  icon: React.ComponentType;
}

export const sidebarItems: SidebarItem[] = [
  {
    title: "Inicio",
    slug: "", // Ruta base para el proyecto
    icon: Home,
  },
  {
    title: "Diagrama de Gantt",
    slug: "gantt",
    icon: ChartBar,
  },
  {
    title: "Tareas",
    slug: "tasks",
    icon: SquareCheck,
  },
  {
    title: "Miembros",
    slug: "members",
    icon: UsersRound,
  },
  {
    title: "Versiones",
    slug: "versions",
    icon: HistoryIcon,
  },
];

interface SlugToName {
  [key: string]: {
    name: string;
    icon: ForwardRefExoticComponent<
      Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
    >;
  };
}

export const slugsToName: SlugToName = {
  gantt: { name: "Diagrama de Gantt", icon: ChartBar },
  tasks: { name: "Tareas", icon: SquareCheck },
  members: { name: "Miembros", icon: UsersRound },
  versions: { name: "Versiones", icon: HistoryIcon },
  settings: { name: "Ajustes", icon: Settings },
  "": { name: "Inicio", icon: Home },
};
export interface Task {
  id: number;
  name: string;
  description: string;
  type: string;
  startDate: string;
  endDate: string;
  progress: number;
  dependencies: number;
  weight: number;
  organizationId: string;
  createdAt: string;
  effort: number;
  deselected?: boolean;
  createdBy?: number;
}
export interface Member {
  id: number;
  username: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
  weight: number;
}

export interface ClientRating {
  id: number;
  username: string;
  organizationWeight: number; // peso del cliente en la organización
  satisfaction: number; // satisfacción calculada para el requisito
  valoracion: number; // valoración del cliente con respecto al requisito
}

export interface TaskRating {
  userId: number;
  username: string;
  email: string;
  organizationWeight: number;
  rating: {
    clientWeight: number;
    clientSatisfaction: number;
  };
}

export interface OrganizationMember {
  id: number;
  username: string;
  weight: number; // peso del miembro en la organización
}

export interface TaskRatingResponse {
  totalSatisfaction: number;
  ratings: TaskRating[];
  taskId: number;
}
