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
import Image from "next/image";
import type { Metadata } from "next";
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

/* 
  export default: 
    
    1. Indica que este es el componente principal del archivo. 
    2. Permite importarlo sin llaves: import LoginLayout from './layout';
    3. Solo puede haber un export default por archivo 
  
  children: Contenido que se renderizará dentro del layout.
  
  Readonly<LayoutProps>: Garantiza inmutabilidad dentro de la interfaz LayoutProps
*/

export default function LoginLayout({ children }: Readonly<LayoutProps>) {
  return (
    <div className="flex min-h-screen">
      {/* Columna izquierda: Imagen de fondo */}
      <div className="hidden md:block md:w-1/2 relative">
        <Image
          src="/background-inicio_sesion.png"
          alt="Background"
          fill
          priority
          className="object-cover"
          quality={100}
        />
      </div>

      {/* Columna derecha: Contenido del login */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 bg-white">
        {/* Contenedor del formulario */}
        <div className="w-full max-w-md space-y-8">{children}</div>
      </div>
    </div>
  );
}
