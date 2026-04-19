import { LayoutDashboard, CheckSquare, Wallet, Heart, BookOpen, Briefcase, Settings, Sun, Moon, LogOut, Sparkles } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, hint: "⌘1" },
  { title: "Tasks",     url: "/tasks", icon: CheckSquare, hint: "⌘2" },
  { title: "Finance",   url: "/finance", icon: Wallet, hint: "⌘3" },
  { title: "Freelance", url: "/freelance", icon: Briefcase, hint: "⌘4" },
];

const lifeItems = [
  { title: "Health", url: "/health", icon: Heart, hint: "⌘5" },
  { title: "Notes",  url: "/notes", icon: BookOpen, hint: "⌘6" },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { theme, toggleTheme } = useTheme();
  const { signOut, displayName, user } = useAuth();

  const initials = (displayName || user?.email || "U").slice(0, 2).toUpperCase();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border/60">
      <SidebarContent className="bg-sidebar">
        {/* Brand */}
        <div className="px-4 pt-5 pb-5">
          {!collapsed ? (
            <div className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
                <Sparkles className="h-4 w-4 text-primary-foreground" strokeWidth={2.25} />
              </div>
              <div className="flex flex-col">
                <span className="text-[15px] font-bold font-display text-foreground tracking-tight leading-none">LifeHub</span>
                <span className="text-[9.5px] text-muted-foreground/70 mt-0.5 uppercase tracking-[0.14em]">Pro</span>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center shadow-glow mx-auto">
              <Sparkles className="h-4 w-4 text-primary-foreground" strokeWidth={2.25} />
            </div>
          )}
        </div>

        {/* Workspace */}
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.14em] font-semibold text-muted-foreground/55 px-3 mb-1">
              Workspace
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-sidebar-accent/60 transition-all duration-150 rounded-lg text-sidebar-foreground group"
                      activeClassName="sidebar-active-indicator bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="mr-2.5 h-[17px] w-[17px] shrink-0" strokeWidth={1.75} />
                      {!collapsed && (
                        <>
                          <span className="text-[13px] flex-1">{item.title}</span>
                          <span className="kbd opacity-0 group-hover:opacity-100 transition-opacity">{item.hint}</span>
                        </>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Life */}
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.14em] font-semibold text-muted-foreground/55 px-3 mb-1">
              Life
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {lifeItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="hover:bg-sidebar-accent/60 transition-all duration-150 rounded-lg text-sidebar-foreground group"
                      activeClassName="sidebar-active-indicator bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="mr-2.5 h-[17px] w-[17px] shrink-0" strokeWidth={1.75} />
                      {!collapsed && (
                        <>
                          <span className="text-[13px] flex-1">{item.title}</span>
                          <span className="kbd opacity-0 group-hover:opacity-100 transition-opacity">{item.hint}</span>
                        </>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="pb-4 bg-sidebar">
        <SidebarSeparator className="opacity-50" />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink
                to="/settings"
                className="hover:bg-sidebar-accent/60 transition-all duration-150 rounded-lg text-sidebar-foreground"
                activeClassName="sidebar-active-indicator bg-sidebar-accent text-sidebar-accent-foreground font-medium"
              >
                <Settings className="mr-2.5 h-[17px] w-[17px]" strokeWidth={1.75} />
                {!collapsed && <span className="text-[13px]">Settings</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={toggleTheme} className="text-sidebar-foreground hover:bg-sidebar-accent/60">
              {theme === "dark" ? <Sun className="h-[17px] w-[17px] mr-2.5" strokeWidth={1.75} /> : <Moon className="h-[17px] w-[17px] mr-2.5" strokeWidth={1.75} />}
              {!collapsed && <span className="text-[13px]">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {!collapsed && (
          <div className="mx-2 mt-2 p-2.5 rounded-xl bg-muted/40 border border-border/40 flex items-center gap-2.5 hover-lift">
            <Avatar className="h-9 w-9 border border-border/40">
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-xs font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">{displayName || "User"}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
            </div>
            <button onClick={signOut} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive" title="Sign out">
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        {collapsed && (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={signOut} className="text-sidebar-foreground hover:bg-sidebar-accent/60">
                <LogOut className="h-[17px] w-[17px] mr-2.5" strokeWidth={1.75} />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
