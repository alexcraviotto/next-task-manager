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
import { ChevronDown, Settings, Plus, Loader2, Trash2 } from "lucide-react";
import CreateOrganization from "./dashboard/organization/createOrganization";
import { useToast } from "@/hooks/use-toast";
import { useOrganizations } from "@/hooks/use-organizations";
import { useSession } from "next-auth/react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

export function AppSidebar({ projectId }: { projectId: string | undefined }) {
  const router = useRouter();
  const pathname = usePathname() || ""; // Evitar undefined
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const { toast } = useToast();
  const { data } = useSession();
  const { organizations, loading, error, addOrganization, removeOrganization } =
    useOrganizations();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [organizationToDelete, setOrganizationToDelete] = useState<
    string | null
  >(null);

  const handleProjectChange = (id: string) => {
    router.push(`/dashboard/organization/${id}`);
  };

  const buildUrl = (slug: string) => {
    // Construye la URL usando el projectId y el slug
    return `/dashboard/organization/${projectId}/${slug}`;
  };

  const handleDeleteOrganization = async () => {
    if (!organizationToDelete) return;

    try {
      const response = await fetch(
        `/api/organizations/${organizationToDelete}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete organization");
      }

      removeOrganization(organizationToDelete);

      // Si la organización eliminada es la actual, redirigir al dashboard
      if (projectId === organizationToDelete) {
        router.push("/dashboard");
      }

      toast({
        description: "Organización eliminada correctamente",
      });
    } catch (error) {
      console.error("Error deleting organization:", error);
      toast({
        variant: "destructive",
        description:
          error instanceof Error
            ? error.message
            : "Error al eliminar la organización",
      });
    } finally {
      setShowDeleteDialog(false);
      setOrganizationToDelete(null);
    }
  };

  const handleOrgSelect = (orgId: string) => {
    handleProjectChange(orgId);
  };

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const response = await fetch("/api/users/me");
        if (response.ok) {
          const data = await response.json();
          setUserId(data.user.id);
        }
      } catch (error) {
        console.error("Error fetching user id:", error);
      }
    };

    if (data?.user) {
      fetchUserId();
    }
  }, [data?.user]);

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
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    organizations.find((org) => org.id === projectId)?.name ||
                    "Seleccionar organización"
                  )}
                  <ChevronDown className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[--radix-popper-anchor-width] p-2">
                {loading ? (
                  <DropdownMenuItem disabled>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Cargando...
                  </DropdownMenuItem>
                ) : error ? (
                  <DropdownMenuItem disabled className="text-destructive">
                    Error al cargar organizaciones
                  </DropdownMenuItem>
                ) : organizations.length === 0 ? (
                  <DropdownMenuItem disabled>
                    No hay organizaciones
                  </DropdownMenuItem>
                ) : (
                  organizations.map((org) => (
                    <DropdownMenuItem
                      key={org.id}
                      onClick={() => handleOrgSelect(org.id)}
                    >
                      <span className="flex-grow">{org.name}</span>
                      {org.createdById === userId && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setOrganizationToDelete(org.id);
                            setShowDeleteDialog(true);
                          }}
                          className="ml-2"
                        >
                          <Trash2
                            size={16}
                            className="text-destructive hover:text-destructive/90"
                          />
                        </button>
                      )}
                    </DropdownMenuItem>
                  ))
                )}
                {data?.user?.isAdmin && (
                  <>
                    <DropdownMenuItem className="h-px bg-muted my-2" />
                    <DropdownMenuItem
                      onClick={() => setShowCreateOrg(true)}
                      className="cursor-pointer flex items-center gap-2 text-primary"
                    >
                      <Plus size={16} />
                      <span>Nueva organización</span>
                    </DropdownMenuItem>
                  </>
                )}
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
            setShowCreateOrg(false);
            // En lugar de recargar la página, actualizamos el estado local
            addOrganization(newOrg);
            toast({
              description: "Organización creada correctamente",
            });
          }}
        />
      )}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente la organización y todos sus
              datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setOrganizationToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteOrganization}
              className="bg-destructive hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sidebar>
  );
}
