"use client";

import { useState } from "react";
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
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type FormValues = z.infer<typeof formSchema>;

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

  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);

      // Llamada al endpoint
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

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
      const response = await fetch("/api/profile", {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete account");
      }

      // Mostrar mensaje de éxito
      toast({
        description: result.message || "Account deleted successfully",
      });

      // Redirigir al usuario al login
      window.location.href = "/login";
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
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Enter your username"
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
                    placeholder="Enter your email"
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
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    placeholder="********"
                    disabled={isLoading}
                  />
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
              {isLoading ? "Updating..." : "Update Profile"}
            </Button>

            <Button
              type="button"
              variant="destructive"
              className="w-full"
              onClick={handleDeleteAccount}
              disabled={isLoading}
            >
              {isLoading ? "Deleting..." : "Delete Account"}
            </Button>
          </div>
        </form>
      </Form>
    </DashboardStructure>
  );
}
