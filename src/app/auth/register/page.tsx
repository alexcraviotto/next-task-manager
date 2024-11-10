"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { signIn } from "next-auth/react";

// Schema de validacion
const registerSchema = z.object({
  username: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(50, "El nombre no puede tener más de 50 caracteres"),
  surname: z
    .string()
    .min(2, "Los apellidos deben tener al menos 2 caracteres")
    .max(50, "Los apellidos no pueden tener más de 50 caracteres"),
  email: z.string().email("Por favor, introduce un email válido"),
  password: z.string().min(1, "La contraseña debe tener al menos 1 caracter"),
});

export default function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validar datos con Zod
      const formData = { username, surname, email, password };
      const validatedData = registerSchema.parse(formData);

      // 1. Registrar usuario
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validatedData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al registrarse");
      }

      // 2. Iniciar sesion automaticamente despues del registro
      const result = await signIn("credentials", {
        redirect: false,
        email: validatedData.email,
        password: validatedData.password,
      });

      if (result?.error) {
        throw new Error("Error al iniciar sesión automáticamente");
      }

      toast({
        title: "¡Bienvenido!",
        description:
          "Tu cuenta ha sido creada y has iniciado sesión correctamente",
      });

      // Redirigir a la pagina de confirmacion de correo electronico (ConfirmEmail)
      await router.replace("/auth/confirm-email"); // Cambiamos la ruta
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "Error de validación",
          description: error.errors[0].message,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Error en el proceso de registro",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginClick = (e: React.MouseEvent) => {
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
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Nombre"
        className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
      />
      <input
        type="text"
        value={surname}
        onChange={(e) => setSurname(e.target.value)}
        placeholder="Apellidos"
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
