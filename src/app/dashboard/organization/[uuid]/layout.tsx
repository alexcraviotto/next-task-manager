"use client";

import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import TopBar from "@/components/dashboard/TopBar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useParams } from "next/navigation";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const params = useParams();
  const projectId = params.uuid as string;

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <SidebarProvider>
      <AppSidebar projectId={projectId} />
      <main className="w-full m-4">
        <TopBar />
        {children}
      </main>
    </SidebarProvider>
  );
}
