"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { signOut, useSession } from "next-auth/react";

export default function ConfirmEmail() {
  const { data: session, status } = useSession(); // Agregamos status para verificar el estado de la sesión
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [otpFromServer, setOtpFromServer] = useState<string | null>(null);
  const router = useRouter();

  // Usar useRef para controlar si ya se esta haciendo una peticion
  const isFetchingRef = useRef(false);
  // Usar useRef para controlar si el componente está montado
  const isMountedRef = useRef(true);

  // Redirigir si no hay sesión
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Función para obtener OTP del servidor
  const fetchOtp = useCallback(async () => {
    console.log("dentro de fetchOtp");
    try {
      // Si ya hay una petición en curso o el componente esta desmontado, no hacer nada
      if (isFetchingRef.current || !isMountedRef.current) return;
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
      // Solo actualizar el estado si el componente sigue montado
      if (isMountedRef.current) {
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
      }
    } catch {
      if (isMountedRef.current) {
        setErrorMessage("Error de conexión. Inténtalo de nuevo.");
      }
    } finally {
      // Resetear el flag de fetching
      isFetchingRef.current = false;
    }
  }, [session?.user?.email, setErrorMessage, setOtpFromServer, router]);

  console.log("Antes de entrar en useEffect");
  const [isEmailSent, setIsEmailSent] = useState(false);
  console.log("sesion?.user?.email:", session?.user?.email);
  console.log("isEmailSent:", isEmailSent);
  // useEffect con cleanup
  useEffect(() => {
    // Si el status está cargando o no hay sesión, no hacer nada
    if (status === "loading" || !session) return;

    // Marcar el componente como montado
    isMountedRef.current = true;
    console.log("En en useEffect");
    let isMounted = true;
    console.log("isMounted:", isMounted);

    console.log("Entramos en initiateFetch");

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
      if (!showOTP && !otpFromServer && session?.user?.email) {
        console.log(
          "Iniciando fetchOtp, showOTP es falso y hay sesión con email.",
        );
        console.log("Llamada fetchOtp");
        fetchOtp();
      }
    };
    console.log("Fuera de initiateFetch, segundo initiateFetch");
    if (!isEmailSent) {
      initiateFetch();
      setIsEmailSent(true);
    }
    console.log("Antes de salir de useeffect");
    console.log("sesion?.user?.email:", session?.user?.email);
    console.log("isEmailSent:", isEmailSent);
    return () => {
      isMounted = false;
      isMountedRef.current = false;
    };
  }, [session, status, fetchOtp, showOTP, otpFromServer, isEmailSent, router]);

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
                email: session.user.email,
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
      setShowOTP(true);
      console.log("showOTP se establece en true, OTP visible para el usuario.");
    }
  };

  // Función para limpiar el campo OTP
  const handleClearOTP = () => {
    setOtp("");
    setErrorMessage("");
    console.log("OTP y mensaje de error limpiados.");
  };

  // Si el status está cargando, puedes mostrar un loading o null
  if (status === "loading") {
    return null;
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-white relative">
      {/* Mostrar botón solo si hay sesión */}
      {session && (
        <Button
          onClick={() => {
            // router.push('/');
            console.log("Cierra sesion y lleva al landing");
            signOut();
          }}
          className="absolute top-4 right-4 bg-gray-200 text-gray-700 hover:bg-gray-300"
        >
          <span className="text-sm">Cerrar sesión</span>
        </Button>
      )}

      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-4">
          Confirmación de email
        </h2>
        <p className="text-gray-600 text-center mb-6">
          {showOTP
            ? "Pon el código para registrarte."
            : "Confirma tu dirección de correo electrónico para acceder."}
        </p>

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
                pattern={"^[0-9]*$"}
                onChange={(e) => setOtp(e)}
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
          onClick={() => router.back()}
        >
          Volver
        </Button>
      </div>
    </div>
  );
}
