"use client";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { slugsToName } from "@/lib/types";
import { LayoutDashboardIcon } from "lucide-react";
import { signOut } from "next-auth/react";

export default function TopBar() {
  const pathname = usePathname();
  const slug = Object.keys(slugsToName).includes(
    pathname.split("/").slice(-1)[0],
  )
    ? pathname.split("/").slice(-1)[0]
    : "";
  return (
    <div className="flex h-14 items-center justify-between bg-white px-4 shadow-sm">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <LayoutDashboardIcon className="h-5 w-5" />
        </div>
        <div className="h-6 w-px bg-gray-300" />
        <div className="text-lg">{slugsToName[slug].name}</div>
      </div>
      <Button
        variant="secondary"
        className="bg-black text-white hover:bg-gray-800"
        onClick={async () => await signOut()}
      >
        Cerrar sesión
      </Button>
    </div>
  );
}
