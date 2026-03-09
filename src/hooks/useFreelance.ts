import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Client {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  notes: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  client_id: string | null;
  name: string;
  description: string | null;
  status: string;
  budget: number | null;
  deadline: string | null;
  completion_percent: number;
  completion_notes: string | null;
  priority: string;
  project_links: { label: string; url: string }[];
  estimated_hours: number | null;
  time_spent: number;
  created_at: string;
}

export interface Payment {
  id: string;
  project_id: string | null;
  client_id: string | null;
  amount: number;
  description: string | null;
  status: string;
  date: string;
}

export interface Withdrawal {
  id: string;
  amount: number;
  method: string;
  description: string | null;
  date: string;
}

export interface FreelanceExpense {
  id: string;
  amount: number;
  category: string;
  description: string | null;
  date: string;
}

export interface ProjectNote {
  id: string;
  project_id: string;
  content: string;
  created_at: string;
}

export function useFreelance() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const uid = user?.id;

  // Clients
  const { data: clients = [] } = useQuery({
    queryKey: ["clients", uid], enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("*").order("name");
      if (error) throw error;
      return data as Client[];
    },
  });

  const addClient = useMutation({
    mutationFn: async (c: Omit<Client, "id" | "created_at">) => {
      const { error } = await supabase.from("clients").insert({ ...c, user_id: uid! });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });

  const deleteClient = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });

  // Projects
  const { data: projects = [] } = useQuery({
    queryKey: ["projects", uid], enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as Project[]).map(p => ({
        ...p,
        project_links: Array.isArray(p.project_links) ? p.project_links : [],
      }));
    },
  });

  const addProject = useMutation({
    mutationFn: async (p: Omit<Project, "id" | "created_at">) => {
      const { error } = await supabase.from("projects").insert({ ...p, user_id: uid! });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });

  const updateProject = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; status?: string; name?: string; description?: string | null; budget?: number | null; deadline?: string | null; client_id?: string | null; completion_percent?: number; completion_notes?: string | null; priority?: string; project_links?: any; estimated_hours?: number | null; time_spent?: number }) => {
      const { error } = await supabase.from("projects").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });

  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });

  // Project Notes
  const { data: projectNotes = [] } = useQuery({
    queryKey: ["project-notes", uid], enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase.from("project_notes").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as ProjectNote[];
    },
  });

  const addProjectNote = useMutation({
    mutationFn: async (n: { project_id: string; content: string }) => {
      const { error } = await supabase.from("project_notes").insert({ ...n, user_id: uid! });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["project-notes"] }),
  });

  const deleteProjectNote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("project_notes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["project-notes"] }),
  });

  // Payments
  const { data: payments = [] } = useQuery({
    queryKey: ["payments", uid], enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase.from("payments").select("*").order("date", { ascending: false });
      if (error) throw error;
      return data as Payment[];
    },
  });

  const addPayment = useMutation({
    mutationFn: async (p: Omit<Payment, "id">) => {
      const { error } = await supabase.from("payments").insert({ ...p, user_id: uid! });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payments"] }),
  });

  const updatePayment = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; status?: string }) => {
      const { error } = await supabase.from("payments").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payments"] }),
  });

  const deletePayment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payments"] }),
  });

  // Withdrawals
  const { data: withdrawals = [] } = useQuery({
    queryKey: ["withdrawals", uid], enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase.from("withdrawals").select("*").order("date", { ascending: false });
      if (error) throw error;
      return data as Withdrawal[];
    },
  });

  const addWithdrawal = useMutation({
    mutationFn: async (w: Omit<Withdrawal, "id">) => {
      const { error } = await supabase.from("withdrawals").insert({ ...w, user_id: uid! });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["withdrawals"] }),
  });

  const deleteWithdrawal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("withdrawals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["withdrawals"] }),
  });

  // Freelance Expenses
  const { data: expenses = [] } = useQuery({
    queryKey: ["freelance-expenses", uid], enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase.from("freelance_expenses").select("*").order("date", { ascending: false });
      if (error) throw error;
      return data as FreelanceExpense[];
    },
  });

  const addExpense = useMutation({
    mutationFn: async (e: Omit<FreelanceExpense, "id">) => {
      const { error } = await supabase.from("freelance_expenses").insert({ ...e, user_id: uid! });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["freelance-expenses"] }),
  });

  const deleteExpense = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("freelance_expenses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["freelance-expenses"] }),
  });

  return {
    clients, addClient: (c: Omit<Client, "id" | "created_at">) => addClient.mutate(c), deleteClient: (id: string) => deleteClient.mutate(id),
    projects, addProject: (p: Omit<Project, "id" | "created_at">) => addProject.mutate(p),
    updateProject: (id: string, u: { status?: string; name?: string; description?: string | null; budget?: number | null; deadline?: string | null; client_id?: string | null; completion_percent?: number; completion_notes?: string | null; priority?: string; project_links?: any; estimated_hours?: number | null; time_spent?: number }) => updateProject.mutate({ id, ...u }),
    deleteProject: (id: string) => deleteProject.mutate(id),
    projectNotes, addProjectNote: (n: { project_id: string; content: string }) => addProjectNote.mutate(n), deleteProjectNote: (id: string) => deleteProjectNote.mutate(id),
    payments, addPayment: (p: Omit<Payment, "id">) => addPayment.mutate(p), updatePayment: (id: string, u: { status?: string }) => updatePayment.mutate({ id, ...u }), deletePayment: (id: string) => deletePayment.mutate(id),
    withdrawals, addWithdrawal: (w: Omit<Withdrawal, "id">) => addWithdrawal.mutate(w), deleteWithdrawal: (id: string) => deleteWithdrawal.mutate(id),
    expenses, addExpense: (e: Omit<FreelanceExpense, "id">) => addExpense.mutate(e), deleteExpense: (id: string) => deleteExpense.mutate(id),
  };
}
