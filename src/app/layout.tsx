import type { Metadata } from "next";
import "./globals.css";
import { Be_Vietnam_Pro } from "next/font/google";
import Providers from "./Providers";
import { Toaster } from "@/components/ui/toaster";
import Transition from "@/components/Transition";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin"],
  weight: ["700"],
});

export const metadata: Metadata = {
  title: "Next Release Project",
  description: "Una aplicación para el manejo de proyectos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${beVietnamPro.className} antialiased`}>
        <Providers>
          <Transition>{children}</Transition>
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
