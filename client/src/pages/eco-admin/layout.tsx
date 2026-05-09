import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { EcoAdminSidebar } from "@/components/eco-admin-sidebar";

interface EcoAdminLayoutProps {
  children: React.ReactNode;
}

export function EcoAdminLayout({ children }: EcoAdminLayoutProps) {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <EcoAdminSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between p-4 border-b">
            <SidebarTrigger data-testid="button-eco-sidebar-toggle" />
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
