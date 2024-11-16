"use client";
import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    console.log("Estado de la sesión actualizado:", session);
    console.log(
      "Estado de verificación del usuario:",
      session?.user?.isVerified,
    );

    if (session && session.user?.isVerified) {
      console.log("Usuario verificado, redirigiendo a dashboard");
      router.replace("/dashboard/organization");
    } else if (session && session.user?.isVerified == false) {
      console.log(
        "Usuario no verificado, redirigiendo a confirmación de email",
      );
      router.replace("/auth/confirm-email");
    }
  }, [session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Iniciando proceso de login");
    console.log("Datos del formulario:", { email, password: "****" });

    // Validaciones básicas
    if (!email && !password) {
      console.log("Error: Email y contraseña vacíos");
      setError("El email y la contraseña son requeridos");
      return;
    }

    if (!email) {
      console.log("Error: Email vacío");
      setError("El email es requerido");
      return;
    }

    if (!password) {
      console.log("Error: Contraseña vacía");
      setError("La contraseña es requerida");
      return;
    }

    // Validación simple de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log("Error: Formato de email inválido");
      setError("Por favor, introduce un email válido");
      return;
    }

    try {
      console.log("Intentando iniciar sesión con credenciales");
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });
      console.log("Resultado del inicio de sesión:", result);
      if (result?.ok) {
        console.log("Inicio de sesión exitoso, redirigiendo según estado");
        // La redirección ahora depende únicamente de la lógica del useEffect
      } else {
        console.log("Error en inicio de sesión:", result?.error);
        // Manejo de diferentes tipos de errores
        switch (result?.error) {
          case "AccessDenied":
            setError("No tienes permiso para acceder");
            break;
          default:
            setError("Error al iniciar sesión. Por favor, inténtalo de nuevo");
        }
      }
      /* Evitar mandar correo desde inicio
      if (result?.ok) {
        console.log("Inicio de sesión exitoso, verificando estado del email");
        // Comprobar si el email verificado
        const res = await fetch("/api/users/verify-email");
        const data = await res.json();
        console.log("Respuesta de verificación de email:", data);

        if (data?.verified) {
          console.log("Email verificado, redirigiendo a dashboard");
          router.replace("/dashboard/organization");
        } else {
          console.log("Email no verificado, redirigiendo a confirmación");
          router.replace("/auth/confirm-email");
        }
      } else {
        console.log("Error en inicio de sesión:", result?.error);
        // Manejo de diferentes tipos de errores
        switch (result?.error) {
          case "AccessDenied":
            setError("No tienes permiso para acceder");
            break;
          default:
            setError("Error al iniciar sesión. Por favor, inténtalo de nuevo");
        }
      }*/
    } catch (err: Error | unknown) {
      console.error("Error durante el proceso de login:", err);
      if (err instanceof Error) {
        console.error("Error de conexión:", err);
        setError(`Error de conexión: ${err.message}`);
      } else {
        setError(
          "Error de conexión. Por favor, verifica tu conexión a internet",
        );
      }
    }
  };

  const handleClick = () => {
    console.log("Redirigiendo a registro");
    router.push("/auth/register");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg"
    >
      <h2 className="text-2xl font-bold mb-6 text-center">Iniciar sesión</h2>

      {/* Mostrar mensaje de error si existe */}
      {error && (
        <div className="mb-4 p-3 text-sm text-red-500 bg-red-50 rounded-lg">
          {error}
        </div>
      )}

      <input
        type="text"
        value={email}
        onChange={(e) => {
          console.log("Email actualizado:", e.target.value);
          setEmail(e.target.value);
          setError(""); // Limpiar error cuando el usuario empiece a escribir
        }}
        placeholder="Email"
        className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => {
          console.log("Contraseña actualizada");
          setPassword(e.target.value);
          setError(""); // Limpiar error cuando el usuario empiece a escribir
        }}
        placeholder="Contraseña"
        className="w-full p-3 mb-6 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
      />
      <Button
        type="submit"
        className="w-full p-3 mb-4 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
      >
        Continuar
      </Button>
      <Button
        type="button"
        onClick={handleClick}
        className="w-full p-3 bg-white text-black rounded-lg font-semibold border-2 border-black hover:bg-gray-50 transition-colors"
      >
        ¿No tienes cuenta?
      </Button>
    </form>
  );
}
