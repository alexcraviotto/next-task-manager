"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

export default function ConfirmEmailPage() {
  const [showOTP, setShowOTP] = useState(false);
  const [otp] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  // Define el OTP correcto para fines de prueba
  const correctOTP = "123456";

  const handleContinueClick = () => {
    if (showOTP) {
      if (otp === correctOTP) {
        router.push("/success"); // Redirige a la página de éxito
      } else {
        setErrorMessage("El código introducido no es válido.");
      }
    } else {
      setShowOTP(true); // Muestra el OTP si no se ha mostrado aún
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-white">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-4">
          Confirmación de email
        </h2>
        <p className="text-gray-600 text-center mb-6">
          Confirma tu dirección de correo electrónico para acceder.
        </p>
        <div className="flex justify-center mb-6">
          <Image
            src="/email-confirmation.png"
            alt="Confirmación de email"
            width={128} // Ancho en pixeles
            height={128} // Altura en pixeles
            className="object-contain"
          />
        </div>
        <Button
          className="w-full mb-4 bg-black text-white hover:bg-gray-800"
          onClick={handleContinueClick}
        >
          Continuar
        </Button>
        <Button className="w-full border border-gray-300 text-gray-700 hover:bg-gray-100">
          Volver
        </Button>

        {showOTP && (
          <div className="mt-6 flex flex-col items-center space-y-4">
            <InputOTP maxLength={6} pattern={"^[a-zA-Z0-9]*$"}>
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
          </div>
        )}
      </div>
    </div>
  );
}
