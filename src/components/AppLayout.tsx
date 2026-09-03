import { Outlet } from "react-router-dom";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/presentation/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

export function AppLayout() {
  return (
    <SidebarProvider>
      {/* Contenedor principal flex: obliga a los elementos a estar lado a lado */}
      <div className="flex h-screen w-full bg-background overflow-hidden">
        
        {/* 1. Menú lateral */}
        <AppSidebar />
        
        {/* 2. Contenido de la derecha */}
        <SidebarInset className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 shrink-0 items-center gap-4  px-4 bg-background">
            <SidebarTrigger />
          </header>
          
          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto p-4 md:p-6">
            <Outlet />
          </div>
        </SidebarInset>

      </div>
    </SidebarProvider>
  );
}