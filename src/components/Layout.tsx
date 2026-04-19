import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Search, ChevronRight } from "lucide-react";

const PAGE_META: Record<string, { title: string; section: string }> = {
  "/":          { title: "Dashboard",  section: "Workspace" },
  "/tasks":     { title: "Tasks",      section: "Workspace" },
  "/finance":   { title: "Finance",    section: "Workspace" },
  "/freelance": { title: "Freelance",  section: "Workspace" },
  "/health":    { title: "Health",     section: "Life" },
  "/notes":     { title: "Notes",      section: "Life" },
  "/settings":  { title: "Settings",   section: "Account" },
};

const pageVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -3 },
};

const pageTransition = {
  type: "tween" as const,
  ease: [0.22, 0.61, 0.36, 1] as [number, number, number, number],
  duration: 0.22,
};

export function Layout() {
  const location = useLocation();
  const meta = PAGE_META[location.pathname] || { title: "", section: "" };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top header — glassy, with breadcrumb + ⌘K hint */}
          <header className="h-14 flex items-center gap-3 border-b border-border/40 px-4 md:px-6 bg-background/70 backdrop-blur-xl sticky top-0 z-30">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors h-8 w-8" />

            {/* Breadcrumb */}
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="flex items-center gap-1.5 text-[12.5px]"
            >
              <span className="text-muted-foreground/70">{meta.section}</span>
              {meta.title && (
                <>
                  <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
                  <span className="font-medium text-foreground tracking-tight">{meta.title}</span>
                </>
              )}
            </motion.div>

            <div className="flex-1" />

            {/* Command-K hint (visual only for now) */}
            <button
              type="button"
              className="hidden md:inline-flex items-center gap-2 h-8 pl-2.5 pr-2 rounded-lg border border-border/60 bg-muted/30 hover:bg-muted/60 text-muted-foreground transition-colors text-[12px] min-w-[200px]"
              aria-label="Quick search"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="flex-1 text-left">Quick search…</span>
              <span className="kbd">⌘K</span>
            </button>
          </header>

          <main className="flex-1 overflow-auto">
            <div className="px-5 py-6 md:px-8 md:py-8">
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
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
