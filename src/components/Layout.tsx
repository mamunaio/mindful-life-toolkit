import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet, useLocation } from "react-router-dom";

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/tasks": "Tasks",
  "/finance": "Finance",
  "/freelance": "Freelance",
  "/health": "Health",
  "/notes": "Notes",
  "/settings": "Settings",
};

export function Layout() {
  const location = useLocation();
  const pageTitle = PAGE_TITLES[location.pathname] || "";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center gap-3 border-b border-border/40 px-4 bg-card/50 backdrop-blur-sm sticky top-0 z-30">
            <SidebarTrigger />
            <span className="text-sm font-medium text-muted-foreground">{pageTitle}</span>
          </header>
          <main className="flex-1 overflow-auto p-5 md:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
