import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import Image from "next/image";
const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap", // Añadir display swap para mejor manejo de fuentes
});

export const metadata: Metadata = {
  title: "Proceso de registro",
  description: "Registro del usuario",
};

function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden md:block md:w-1/2 relative">
        <Image
          src="/background-grey.png"
          alt="Background"
          fill
          priority
          className="object-cover"
        />
      </div>
      <div className="w-full md:w-1/2 flex items-center justify-center bg-white p-4">
        {children}
      </div>
    </div>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={beVietnamPro.className}>
        <AuthLayout>{children}</AuthLayout>
      </body>
    </html>
  );
}
