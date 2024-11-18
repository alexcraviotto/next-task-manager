"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { signIn, useSession } from "next-auth/react";

const registerSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(50, "El nombre no puede tener más de 50 caracteres"),
  email: z.string().email("Por favor, introduce un email válido"),
  username: z
    .string()
    .min(2, "El username debe tener al menos 2 caracteres")
    .max(50, "El username no puede tener más de 50 caracteres"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracter"),
});

export default function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { data: session } = useSession();

  useEffect(() => {
    console.log("Session state changed:", session);
    console.log("User verification status:", session?.user?.isVerified);

    if (session && session.user?.isVerified) {
      console.log("Usuario verificado, redirigiendo a /dashboard/organization");
      router.replace("/dashboard/organization");
    } else if (session && session.user?.isVerified == false) {
      console.log("Usuario no verificado, redirigiendo a /auth/confirm-email");
      router.replace("/auth/confirm-email");
    }
  }, [session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Iniciando proceso de registro");
    setIsLoading(true);

    try {
      // Validar datos con Zod
      const formData = { name, email, username, password };
      console.log("Validando datos del formulario:", {
        ...formData,
        password: "*****",
      });
      const validatedData = registerSchema.parse(formData);
      console.log("Datos validados correctamente");

      // 1. Registrar usuario
      console.log("Enviando solicitud de registro");
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validatedData),
      });

      const data = await response.json();
      console.log("Respuesta del registro:", data);

      if (!response.ok) {
        throw new Error(data.message || "Error al registrarse");
      }

      // 2. Iniciar sesion automaticamente
      console.log("Intentando inicio de sesión automático");
      const result = await signIn("credentials", {
        redirect: false,
        email: validatedData.email,
        password: validatedData.password,
      });

      console.log("Resultado del inicio de sesión:", result);

      if (result?.error) {
        throw new Error("Error al iniciar sesión automáticamente");
      }
      if (result?.ok) {
        console.log("Inicio de sesión exitoso, redirigiendo a confirm-email");
        router.replace("/auth/confirm-email");
      }

      toast({
        title: "¡Bienvenido!",
        description:
          "Tu cuenta ha sido creada y has iniciado sesión correctamente",
      });
    } catch (error) {
      console.error("Error durante el proceso de registro:", error);

      if (error instanceof z.ZodError) {
        console.log("Error de validación Zod:", error.errors);
        toast({
          variant: "destructive",
          title: "Error de validación",
          description: error.errors[0].message,
        });
      } else {
        console.log("Error general:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description:
            error instanceof Error ? error.message : "Error al registrarse",
        });
      }
    } finally {
      console.log("Finalizando proceso de registro");
      setIsLoading(false);
    }
  };

  const handleLoginClick = (e: React.MouseEvent) => {
    console.log("Click en botón de login, redirigiendo");
    e.preventDefault();
    router.replace("/auth/login");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg"
    >
      <h2 className="text-2xl font-bold mb-6 text-center">Registrarse</h2>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
        className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
      />
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
        className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Contraseña"
        className="w-full p-3 mb-6 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
      />
      <Button
        type="submit"
        className="w-full bg-black text-white font-semibold hover:bg-gray-800 transition-colors"
        disabled={isLoading}
      >
        {isLoading ? "Procesando..." : "Continuar"}
      </Button>
      <p className="mt-4 text-center">
        ¿Ya tienes cuenta?{" "}
        <Button
          variant="link"
          className="text-black underline p-0"
          onClick={handleLoginClick}
        >
          Iniciar sesión
        </Button>
      </p>
    </form>
  );
}
