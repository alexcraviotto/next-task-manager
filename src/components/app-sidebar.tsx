"use client";

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
import { useEffect, useState } from "react";
import { sidebarItems, slugsToName } from "@/lib/types";
import { ChevronDown, Settings, Plus } from "lucide-react";
import CreateOrganization from "./dashboard/organization/createOrganization";
import { useToast } from "@/hooks/use-toast";

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
  const pathname = usePathname() || ""; // Evitar undefined
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const { toast } = useToast();

  const handleProjectChange = (id: string) => {
    router.push(`/dashboard/organization/${id}`);
  };

  const buildUrl = (slug: string) => {
    // Construye la URL usando el projectId y el slug
    return `/dashboard/organization/${projectId}/${slug}`;
  };
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
              <DropdownMenuContent className="w-[--radix-popper-anchor-width] p-2">
                {availableProjects.map((project) => (
                  <DropdownMenuItem
                    key={project.id}
                    onClick={() => handleProjectChange(project.id)}
                  >
                    <span>{project.title}</span>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem className="h-px bg-muted my-2" />
                <DropdownMenuItem
                  onClick={() => setShowCreateOrg(true)}
                  className="cursor-pointer flex items-center gap-2 text-primary"
                >
                  <Plus size={16} />
                  <span>Nueva organización</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="m-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-4">
              {sidebarItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <button onClick={() => router.push(buildUrl(item.slug))}>
                      <item.icon />
                      <span
                        className={`text-lg tracking-tight ${
                          pathname.split("/").pop() === item.slug ||
                          (item.title === "Inicio" &&
                            !Object.keys(slugsToName).includes(
                              pathname.split("/").pop() ?? "",
                            ))
                            ? "font-bold"
                            : "opacity-60"
                        }`}
                      >
                        {item.title}
                      </span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="m-4">
        <SidebarMenuButton
          asChild
          className="mb-8 cursor-pointer"
          onClick={() => router.push(buildUrl("settings"))}
        >
          <div className="flex items-center">
            <Settings />
            <span
              className={`text-lg tracking-tight ${
                pathname.includes("settings") ? "font-semibold" : "opacity-70"
              }`}
            >
              {"Ajustes"}
            </span>
          </div>
        </SidebarMenuButton>
      </SidebarFooter>
      {showCreateOrg && (
        <CreateOrganization
          isOpen={showCreateOrg}
          onClose={() => setShowCreateOrg(false)}
          onSuccess={(newOrg) => {
            console.log(newOrg);
            // Aquí puedes manejar la actualización de la lista de organizaciones
            setShowCreateOrg(false);
            // Opcional: Actualizar la lista de organizaciones o redirigir
            toast({ description: "Organización creada correctamente" });
          }}
        />
      )}
    </Sidebar>
  );
}
