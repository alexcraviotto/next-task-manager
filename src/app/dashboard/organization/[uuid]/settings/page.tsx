"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { DashboardStructure } from "@/components/dashboard/DashboardStructure";
import { DashboardTitle } from "@/components/dashboard/DashboardTitle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .optional(),
  email: z.string().email("Please enter a valid email").optional(),
  password: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;
interface User {
  username: string;
  email: string;
  password: string;
  id: string;
}
export default function Settings({
  params,
}: {
  params: { projectId: string };
}) {
  console.log(JSON.stringify(params));
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });
  const [user, setUser] = useState<User | null>(null);

  // Esto es lo añadido
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/users/me");
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to fetch user");
        }
        console.log(
          "🚀 ~ fetchUser ~ result.user:",
          JSON.stringify(result.user),
        );

        setUser(result.user);
        form.reset(result.user);
      } catch (error) {
        console.error("🚀 ~ fetchUser ~ error:", error);
        toast({
          description:
            error instanceof Error ? error.message : "Failed to fetch user",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [form, toast]);

  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);

      // Llamada al endpoint
      const response = await fetch(
        `/api/dashboard/proyects/${user?.id}/settings/update-profile`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        // Si hay errores de validación del servidor
        if (response.status === 400 && result.errors) {
          // Mostrar el primer error de validación
          toast({
            description: result.errors[0],
            variant: "destructive",
          });
          return;
        }

        throw new Error(result.error || "Failed to update profile");
      }

      // Mostrar mensaje de éxito
      toast({
        description: result.message || "Profile updated successfully",
      });
    } catch (error) {
      console.error("🚀 ~ onSubmit ~ error:", error);
      toast({
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/dashboard/proyects/${user?.id}/settings/delete-profile`,
        {
          method: "DELETE",
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete account");
      }

      // Mostrar mensaje de éxito
      toast({
        description: result.message || "Account deleted successfully",
      });

      // Redirigir al usuario al login
      window.location.href = "/auth/login";
    } catch (error) {
      console.error("Account deletion error:", error);
      toast({
        description:
          error instanceof Error ? error.message : "Failed to delete account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardStructure>
      <DashboardTitle title="⚙️ Settings" />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Usuario</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Introduce tu usuario"
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    placeholder="Introduce tu correo electrónico"
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nueva Contraseña</FormLabel>
                <FormControl>
                  <Input {...field} type="password" disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-between space-x-4">
            <Button
              type="submit"
              className="w-full bg-black hover:bg-black/90"
              disabled={isLoading}
            >
              {isLoading ? "Actualizando..." : "Actualizar perfil"}
            </Button>

            <Button
              type="button"
              variant="destructive"
              className="w-full"
              onClick={handleDeleteAccount}
              disabled={isLoading}
            >
              {isLoading ? "Eliminando..." : "Eliminar cuenta"}
            </Button>
          </div>
        </form>
      </Form>
    </DashboardStructure>
  );
}
