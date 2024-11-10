"use client";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { slugsToName } from "@/lib/types";
import { LogOutIcon } from "lucide-react";
import { signOut } from "next-auth/react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SidebarTrigger } from "../ui/sidebar";

export default function TopBar() {
  const pathname = usePathname();
  const slug = Object.keys(slugsToName).includes(
    pathname.split("/").slice(-1)[0],
  )
    ? pathname.split("/").slice(-1)[0]
    : "";

  return (
    <div className="flex flex-row items-center justify-between px-3 sm:px-6 h-12 sm:h-14">
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="flex items-center">
          <SidebarTrigger className="h-4 w-4 sm:h-5 sm:w-5"></SidebarTrigger>
        </div>
        <div className="hidden sm:block h-6 w-px bg-gray-300" />
        <div className="text-sm sm:text-base font-medium truncate max-w-[200px] sm:max-w-none">
          {slugsToName[slug].name}
        </div>
      </div>

      {/* Mobile version with icon + tooltip */}
      <div className="sm:hidden">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-gray-100 rounded-full p-1.5"
                onClick={async () => await signOut()}
              >
                <LogOutIcon className="h-4 w-4" />
                <span className="sr-only">Cerrar sesión</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Cerrar sesión</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Desktop version with text */}
      <Button
        onClick={async () => await signOut()}
        className="hidden sm:flex items-center gap-2 hover:scale-105 transition-transform duration-200"
      >
        <span className="text-sm">Cerrar sesión</span>
      </Button>
    </div>
  );
}
