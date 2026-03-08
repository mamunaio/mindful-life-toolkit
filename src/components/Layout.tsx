import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/tasks": "Tasks",
  "/finance": "Finance",
  "/freelance": "Freelance",
  "/health": "Health",
  "/notes": "Notes",
  "/settings": "Settings",
};

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const pageTransition = {
  type: "tween",
  ease: [0.25, 0.46, 0.45, 0.94],
  duration: 0.3,
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
            <motion.span
              key={pageTitle}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="text-sm font-medium text-muted-foreground"
            >
              {pageTitle}
            </motion.span>
          </header>
          <main className="flex-1 overflow-auto p-5 md:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={pageTransition}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
