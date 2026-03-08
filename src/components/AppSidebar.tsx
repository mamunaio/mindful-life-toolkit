import { LayoutDashboard, CheckSquare, Wallet, Heart, BookOpen, Briefcase, Settings, Sun, Moon, LogOut, ChevronRight } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
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
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Tasks", url: "/tasks", icon: CheckSquare },
  { title: "Finance", url: "/finance", icon: Wallet },
  { title: "Freelance", url: "/freelance", icon: Briefcase },
];

const lifeItems = [
  { title: "Health", url: "/health", icon: Heart },
  { title: "Notes", url: "/notes", icon: BookOpen },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { theme, toggleTheme } = useTheme();
  const { signOut, displayName, user } = useAuth();

  const initials = (displayName || user?.email || "U").slice(0, 2).toUpperCase();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="px-4 pt-5 pb-3">
          {!collapsed ? (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shadow-glow">
                <span className="text-primary-foreground font-bold text-sm font-display">L</span>
              </div>
              <span className="text-lg font-bold font-display text-foreground tracking-tight">LifeHub</span>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shadow-glow mx-auto">
              <span className="text-primary-foreground font-bold text-sm font-display">L</span>
            </div>
          )}
        </div>

        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/60 px-3 mb-1">Workspace</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-sidebar-accent/50 transition-all duration-150 rounded-lg"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm"
                    >
                      <item.icon className="mr-2.5 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/60 px-3 mb-1">Life</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {lifeItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="hover:bg-sidebar-accent/50 transition-all duration-150 rounded-lg"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm"
                    >
                      <item.icon className="mr-2.5 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="pb-4">
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink
                to="/settings"
                className="hover:bg-sidebar-accent/50 transition-all duration-150 rounded-lg"
                activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
              >
                <Settings className="mr-2.5 h-4 w-4" />
                {!collapsed && <span>Settings</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={toggleTheme}>
              {theme === "dark" ? <Sun className="h-4 w-4 mr-2.5" /> : <Moon className="h-4 w-4 mr-2.5" />}
              {!collapsed && <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {!collapsed && (
          <div className="mx-2 mt-2 p-2.5 rounded-lg bg-muted/40 flex items-center gap-2.5">
            <Avatar className="h-8 w-8 border border-border/50">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{displayName || "User"}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
            </div>
            <button onClick={signOut} className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Sign out">
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        {collapsed && (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2.5" />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
