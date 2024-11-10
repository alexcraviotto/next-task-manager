"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones básicas
    if (!email && !password) {
      setError("El email y la contraseña son requeridos");
      return;
    }

    if (!email) {
      setError("El email es requerido");
      return;
    }

    if (!password) {
      setError("La contraseña es requerida");
      return;
    }

    // Validación simple de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Por favor, introduce un email válido");
      return;
    }

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.ok) {
        window.location.href = "/organization";
      } else {
        // Manejo de diferentes tipos de errores
        switch (result?.error) {
          case "AccessDenied":
            setError("No tienes permiso para acceder");
            break;
          default:
            setError("Error al iniciar sesión. Por favor, inténtalo de nuevo");
        }
      }
    } catch (err: Error | unknown) {
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
          setPassword(e.target.value);
          setError(""); // Limpiar error cuando el usuario empiece a escribir
        }}
        placeholder="Contraseña"
        className="w-full p-3 mb-6 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
      />
      <button
        type="submit"
        className="w-full p-3 mb-4 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
      >
        Continuar
      </button>
      <button
        type="button" // Añadido type="button" para evitar que envíe el formulario
        onClick={handleClick}
        className="w-full p-3 bg-white text-black rounded-lg font-semibold border-2 border-black hover:bg-gray-50 transition-colors"
      >
        ¿No tienes cuenta?
      </button>
    </form>
  );
}
