"use client";
import {
  UsersRound,
  Home,
  ChartBar,
  SquareCheck,
  Settings,
  History,
  ChevronDown,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useRouter, usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect } from "react";

const items = [
  {
    title: "Inicio",
    url: "/dashboard/projects/",
    icon: Home,
    slug: null,
  },
  {
    title: "Diagrama de Gantt",
    url: "#",
    icon: ChartBar,
    slug: "gantt",
  },
  {
    title: "Tareas",
    url: "#",
    icon: SquareCheck,
    slug: "tasks",
  },
  {
    title: "Miembros",
    url: "#",
    icon: UsersRound,
    slug: "members",
  },
  {
    title: "Versiones",
    url: "#",
    icon: History,
    slug: "versions",
  },
];

// Es un mockup de ejemplo, cuando tengamos la API de proyectos, esto se cambiará.
const availableProjects = [
  {
    id: "b5afb04a-dc30-4443-b9e6-0ba3f3fe4412",
    title: "Meta Inc.",
  },
  {
    id: "4e1daa8a-7a1f-45fc-ae75-ea50cc5a7497",
    title: "Tesla Inc.",
  },
];

export function AppSidebar({
  projectId,
}: {
  projectId: string | string[] | undefined;
}) {
  const router = useRouter();
  const pathname = usePathname();
  console.log(projectId);

  useEffect(() => {
    // Aqui comprobaremos si el uuid del parametro existe y pertenece al usuario
  }, []);

  return (
    <Sidebar>
      <SidebarHeader className="m-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="text-md h-full">
                  {availableProjects.find((project) => project.id === projectId)
                    ?.title || "Proyectos"}
                  <ChevronDown className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[--radix-popper-anchor-width]">
                {availableProjects.map((project) => (
                  <DropdownMenuItem
                    key={project.id}
                    onClick={() =>
                      router.push("/dashboard/projects/" + project.id)
                    }
                  >
                    <span>{project.title}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="m-4">
        <SidebarGroup>
          {/* <SidebarGroupLabel className="font-bold text-md tracking-tight">NextTaskManager</SidebarGroupLabel> */}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-4">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span
                        className={`text-lg tracking-tight ${item.slug === null ? "font-bold" : pathname.includes(item.slug) ? "font-bold" : "opacity-60"}`}
                      >
                        {item.title}
                      </span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenuButton asChild className="m-4 mb-8">
          <a href="settings">
            <Settings />
            <span
              className={`text-lg tracking-tight ${pathname.includes("settings") ? "font-semibold" : "opacity-70"}`}
            >
              {"Ajustes"}
            </span>
          </a>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
