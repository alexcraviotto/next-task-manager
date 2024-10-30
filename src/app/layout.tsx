import type { Metadata } from "next";
import "./globals.css";
import { Be_Vietnam_Pro } from "next/font/google";
import Providers from "./Providers";

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
    <html lang="es">
      <body className={`${beVietnamPro.className} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
