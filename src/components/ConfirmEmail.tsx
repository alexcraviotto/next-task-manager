"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

export default function ConfirmEmail() {
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [otpFromServer, setOtpFromServer] = useState<string | null>(null);
  const router = useRouter();

  // Función para obtener OTP del servidor
  const fetchOtp = async () => {
    try {
      const response = await fetch("/api/users/verify-email", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: "user@example.com" }), // Reemplaza por el email del usuario
      });

      const data = await response.json();

      if (response.ok) {
        setOtpFromServer(data.otp); // Guardar OTP recibido
      } else {
        setErrorMessage(data.message || "Error al obtener el OTP");
      }
    } catch {
      setErrorMessage("Error de conexión. Inténtalo de nuevo.");
    }
  };

  useEffect(() => {
    if (!showOTP) {
      fetchOtp(); // Solo se realiza la llamada a la API cuando se muestra OTP
    }
  }, [showOTP]);

  const handleContinueClick = () => {
    if (showOTP) {
      if (otp === otpFromServer) {
        router.push("/success"); // Redirige a la pagina de éxito
      } else {
        setErrorMessage("El código introducido no es válido.");
      }
    } else {
      setShowOTP(true); // Muestra el OTP si no se ha mostrado aún
    }
  };

  // Función para limpiar el campo OTP
  const handleClearOTP = () => {
    setOtp(""); // Limpia el estado del OTP
    setErrorMessage("");
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
                onChange={(e) => setOtp(e)} // Cambia aquí
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
