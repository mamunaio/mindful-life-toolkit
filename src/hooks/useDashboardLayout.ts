import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Layout } from "react-grid-layout";

export interface WidgetVisibility {
  [key: string]: boolean;
}

export interface DashboardLayoutData {
  layouts: Layout[];
  visibility: WidgetVisibility;
}

const DEFAULT_VISIBILITY: WidgetVisibility = {
  priorities: true,
  tasks: true,
  finance: true,
  health: true,
  notes: true,
  habits: true,
  water: true,
};

const DEFAULT_LAYOUTS: Layout[] = [
  { i: "priorities", x: 0, y: 0, w: 12, h: 4, minW: 6, minH: 3 },
  { i: "tasks", x: 0, y: 4, w: 3, h: 4, minW: 3, minH: 3 },
  { i: "finance", x: 3, y: 4, w: 3, h: 4, minW: 3, minH: 3 },
  { i: "health", x: 6, y: 4, w: 3, h: 4, minW: 3, minH: 3 },
  { i: "notes", x: 9, y: 4, w: 3, h: 4, minW: 3, minH: 3 },
  { i: "habits", x: 0, y: 8, w: 6, h: 5, minW: 4, minH: 4 },
  { i: "water", x: 6, y: 8, w: 6, h: 5, minW: 4, minH: 4 },
];

export function useDashboardLayout() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const uid = user?.id;

  const { data } = useQuery({
    queryKey: ["dashboard-layout", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("dashboard_layout")
        .eq("user_id", uid!)
        .single();
      if (error) throw error;
      const raw = data?.dashboard_layout as DashboardLayoutData | null;
      if (raw && raw.layouts && raw.layouts.length > 0) return raw;
      return null;
    },
  });

  const saveLayout = useMutation({
    mutationFn: async (layoutData: DashboardLayoutData) => {
      const { error } = await supabase
        .from("profiles")
        .update({ dashboard_layout: layoutData as any })
        .eq("user_id", uid!);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dashboard-layout"] }),
  });

  const layouts = data?.layouts ?? DEFAULT_LAYOUTS;
  const visibility = data?.visibility ?? DEFAULT_VISIBILITY;

  const updateLayouts = (newLayouts: Layout[]) => {
    saveLayout.mutate({ layouts: newLayouts, visibility });
  };

  const toggleWidget = (widgetId: string) => {
    const newVis = { ...visibility, [widgetId]: !visibility[widgetId] };
    saveLayout.mutate({ layouts, visibility: newVis });
  };

  const resetLayout = () => {
    saveLayout.mutate({ layouts: DEFAULT_LAYOUTS, visibility: DEFAULT_VISIBILITY });
  };

  return { layouts, visibility, updateLayouts, toggleWidget, resetLayout };
}
