"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useSession } from "next-auth/react"; // Importar hook para la sesión

export default function ConfirmEmail() {
  const { data: session } = useSession(); // Usar el hook useSession para obtener la sesión
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [otpFromServer, setOtpFromServer] = useState<string | null>(null);
  const router = useRouter();

  // Función para obtener OTP del servidor
  const fetchOtp = useCallback(async () => {
    try {
      if (session?.user?.isVerified) {
        // Si el usuario ya está verificado, redirigir al dashboard
        router.replace("/dashboard/organization");
        return;
      }
      if (!session?.user?.email) {
        setErrorMessage("No se encontró el correo en la sesión.");
        console.log("Error: No se encontró el correo en la sesión.");
        return;
      }

      console.log("Intentando obtener OTP para el correo:", session.user.email);

      const response = await fetch("/api/users/verify-email", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      console.log("Respuesta del servidor al obtener OTP:", data);

      if (response.ok) {
        setOtpFromServer(data.otp); // Guardar OTP recibido
        console.log("OTP recibido del servidor:", data.otp);
      } else {
        setErrorMessage(data.message || "Error al obtener el OTP");
        console.log(
          "Error al obtener OTP:",
          data.message || "Error desconocido",
        );
      }
    } catch (error) {
      setErrorMessage("Error de conexión. Inténtalo de nuevo.");
      console.log("Error de conexión al obtener OTP:", error);
    }
  }, [session?.user?.email, setErrorMessage, setOtpFromServer]); // Incluir todas las dependencias

  // useEffect con cleanup
  useEffect(() => {
    let isMounted = true;
    console.log("isMounted:", isMounted);

    const initiateFetch = async () => {
      console.log("Iniciando fetchOtp.");
      console.log(
        "🚀 ~ initiateFetch ~ session?.user?.email:",
        session?.user?.email,
      );
      console.log(
        "🚀 ~ initiateFetch ~ session?.user?.isVerified:",
        session?.user?.isVerified,
      );

      if (session?.user?.isVerified) {
        // Si el usuario ya está verificado, redirigir al dashboard
        router.push("/dashboard/organization");
        return;
      }
      console.log("🚀 ~ initiateFetch ~ showOTP:", showOTP);
      if (!showOTP && session?.user?.email) {
        console.log(
          "Iniciando fetchOtp, showOTP es falso y hay sesión con email.",
        );
        await fetchOtp();
      }
    };

    initiateFetch();

    return () => {
      isMounted = false;
    };
  }, [showOTP, session?.user?.email, fetchOtp]);

  const handleContinueClick = async () => {
    console.log("Botón 'Continuar' presionado, estado showOTP:", showOTP);
    if (showOTP) {
      console.log(
        "Comparando OTP ingresado:",
        otp,
        "con OTP del servidor:",
        otpFromServer,
      );
      if (otp === otpFromServer) {
        // Verificación exitosa del OTP, se llama a la API para actualizar el estado del usuario
        if (session?.user?.email) {
          // Verificación de que session y session.user no sean null
          try {
            const response = await fetch("/api/users/verify-email", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                email: session.user.email, // Aquí ya podemos usarlo sin error
                otpCode: otp,
              }),
            });

            const data = await response.json();
            console.log("Respuesta de verificación de email:", data);

            if (response.ok) {
              window.location.href = "/dashboard/organization";
              session.user.isVerified = true;
            } else {
              setErrorMessage(data.message || "Error al verificar el email.");
              console.log(
                "Error al verificar email:",
                data.message || "Error desconocido",
              );
            }
          } catch (error) {
            setErrorMessage("Error de conexión. Inténtalo de nuevo.");
            console.log("Error de conexión al verificar el email:", error);
          }
        } else {
          setErrorMessage("No se encontró el correo en la sesión.");
          console.log("No se encontró el correo en la sesión.");
        }
      } else {
        setErrorMessage("El código introducido no es válido.");
        console.log("El código introducido no es válido.");
      }
    } else {
      setShowOTP(true); // Muestra el OTP si no se ha mostrado aún
      console.log("showOTP se establece en true, OTP visible para el usuario.");
    }
  };

  // Función para limpiar el campo OTP
  const handleClearOTP = () => {
    setOtp(""); // Limpia el estado del OTP
    setErrorMessage("");
    console.log("OTP y mensaje de error limpiados.");
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-white">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-4">
          Confirmación de email
        </h2>
        <p className="text-gray-600 text-center mb-6">
          {showOTP
            ? "Pon el código para registrarte."
            : "Confirma tu dirección de correo electrónico para acceder."}
        </p>

        {/* Condicional para mostrar la imagen o el componente OTP */}
        <div className="flex justify-center mb-6">
          {!showOTP ? (
            <Image
              src="/email-confirmation.png"
              alt="Confirmación de email"
              width={300}
              height={300}
              quality={100}
              className="object-contain"
            />
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <InputOTP
                value={otp}
                maxLength={6}
                pattern={"^[0-9]*$"} // Acepta solo números
                onChange={(e) => {
                  setOtp(e);
                  console.log("OTP ingresado:", e);
                }} // Cambia aquí
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
              {errorMessage && (
                <p className="text-red-500 text-sm">{errorMessage}</p>
              )}
              <Button
                className="w-full bg-gray-200 text-gray-700 hover:bg-gray-300"
                onClick={handleClearOTP}
              >
                Borrar código
              </Button>
            </div>
          )}
        </div>

        <Button
          className="w-full mb-4 bg-black text-white hover:bg-gray-800"
          onClick={handleContinueClick}
        >
          Continuar
        </Button>
        <Button
          className="w-full bg-white text-black border border-gray-300 hover:bg-gray-100"
          onClick={() => router.back()} // Acción para volver a la página anterior
        >
          Volver
        </Button>
      </div>
    </div>
  );
}
