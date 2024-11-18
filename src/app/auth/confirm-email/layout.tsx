import type { Metadata } from "next";
import Image from "next/image";
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
  return <AuthLayout>{children}</AuthLayout>;
}
