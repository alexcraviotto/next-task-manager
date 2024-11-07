/**
 * Layout para la página de inicio de sesión.
 * Este componente define la estructura base y el diseño visual de la página de login.
 *
 * Características:
 * - Diseño de dos columnas (imagen de fondo | contenido)
 * - Fuente personalizada (Be Vietnam Pro)
 * - Responsive design
 * - Soporte para metadatos SEO
 * - Providers contextuales
 *
 * Ruta: src/app/auth/login/layout.tsx
 */

import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import Providers from "@/app/Providers";
import "../../globals.css";

// Metadatos de la página para SEO
export const metadata: Metadata = {
  title: "Iniciar Sesión",
  description: "Accede a tu cuenta para continuar",
};

// Establece que layout.tsx se aplicará sobre todos los nodos hijos dentro de la carpeta login
interface LayoutProps {
  children: React.ReactNode;
}

// Configuración de la fuente Be Vietnam Pro
const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin"],
  weight: ["400"],
});

/* 
  export default: 
    
    1. Indica que este es el componente principal del archivo. 
    2. Permite importarlo sin llaves: import LoginLayout from './layout';
    3. Solo puede haber un export default por archivo 
  
  children: Contenido que se renderizará dentro del layout.
  
  Readonly<LayoutProps>: Garantiza inmutabilidad dentro de la interfaz LayoutProps
*/

export default function DashboardOrganizationLayout({
  children,
}: Readonly<LayoutProps>) {
  return (
    <html lang="es">
      <body className={`${beVietnamPro.className} antialiased`}>
        <Providers>
          {/* Contenedor principal con altura mínima de pantalla completa */}
          <div className="flex min-h-screen">
            {/* Columna izquierda: Imagen de fondo */}
            <div
              className="hidden md:block md:w-1/2 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: 'url("/background-inicio_sesion.png")',
                backgroundColor: "#f3f4f6", // Fallback color
              }}
              aria-hidden="true"
            />

            {/* Columna derecha: Contenido del login */}
            <div className="w-full md:w-1/2 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 bg-white">
              {/* Contenedor del formulario */}
              <div className="w-full max-w-md space-y-8">{children}</div>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
