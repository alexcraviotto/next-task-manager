import type { Metadata } from "next";
import "../../globals.css";
import { Be_Vietnam_Pro } from "next/font/google";
import Providers from "../../Providers";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Proceso de registro",
  description: "Registro del usuario",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${beVietnamPro.className} antialiased`}>
        <Providers>
          <div className="flex min-h-screen">
            {/* Sección de la imagen de fondo */}
            <div className="w-1/2 bg-cover bg-center bg-[url('/background-grey.png')]"></div>
            {/* Sección del contenido */}
            <div className="w-1/2 flex items-center justify-center bg-white">
              {children}
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
