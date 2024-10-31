"use client";
import { AppSidebar } from "@/components/app-sidebar";
import TopBar from "@/components/dashboard/TopBar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useParams } from "next/navigation";

export default function Layout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const projectId = params.uuid;

  return (
    <SidebarProvider>
      <AppSidebar projectId={projectId} />
      <main className="w-full">
        {/* <SidebarTrigger /> */}
        <TopBar />
        {children}
      </main>
    </SidebarProvider>
  );
}
