import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface InvoiceSettings {
  id?: string;
  business_name?: string;
  business_email?: string;
  business_address?: string;
  business_phone?: string;
  logo_url?: string;
  payment_terms?: string;
  notes_template?: string;
  default_tax_rate?: number;
  default_currency?: string;
  next_invoice_number?: number;
}

export interface InvoiceRecord {
  id: string;
  invoice_number: string;
  client_id?: string | null;
  project_id?: string | null;
  payment_id?: string | null;
  client_name: string;
  client_email?: string | null;
  client_company?: string | null;
  line_items: any[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_percent: number;
  discount_amount: number;
  total: number;
  status: string;
  template: string;
  notes?: string | null;
  due_date?: string | null;
  issued_date: string;
  created_at: string;
}

export function useInvoices() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const uid = user?.id;

  // Settings
  const { data: settings } = useQuery({
    queryKey: ["invoice_settings", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data } = await supabase
        .from("invoice_settings" as any)
        .select("*")
        .eq("user_id", uid!)
        .single();
      return (data as InvoiceSettings | null) ?? {};
    },
  });

  const saveSettings = useMutation({
    mutationFn: async (s: InvoiceSettings) => {
      const existing = await supabase
        .from("invoice_settings" as any)
        .select("id")
        .eq("user_id", uid!)
        .single();

      if (existing.data) {
        const { error } = await supabase
          .from("invoice_settings" as any)
          .update({ ...s, updated_at: new Date().toISOString() } as any)
          .eq("user_id", uid!);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("invoice_settings" as any)
          .insert({ ...s, user_id: uid! } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoice_settings"] });
      toast.success("Invoice settings saved!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Invoices history
  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data } = await supabase
        .from("invoices" as any)
        .select("*")
        .eq("user_id", uid!)
        .order("created_at", { ascending: false });
      return ((data as unknown) as InvoiceRecord[] | null) ?? [];
    },
  });

  const addInvoice = useMutation({
    mutationFn: async (inv: Omit<InvoiceRecord, "id" | "created_at">) => {
      const { error } = await supabase
        .from("invoices" as any)
        .insert({ ...inv, user_id: uid! } as any);
      if (error) throw error;

      // Increment next invoice number
      if (settings?.next_invoice_number) {
        await supabase
          .from("invoice_settings" as any)
          .update({ next_invoice_number: (settings.next_invoice_number || 1) + 1 } as any)
          .eq("user_id", uid!);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["invoice_settings"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateInvoice = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<InvoiceRecord> & { id: string }) => {
      const { error } = await supabase
        .from("invoices" as any)
        .update(updates as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
    onError: (e: any) => toast.error(e.message),
  });

  const deleteInvoice = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("invoices" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return {
    settings: settings ?? {},
    saveSettings: (s: InvoiceSettings) => saveSettings.mutate(s),
    invoices,
    addInvoice: (inv: Omit<InvoiceRecord, "id" | "created_at">) => addInvoice.mutateAsync(inv),
    updateInvoice: (id: string, updates: Partial<InvoiceRecord>) => updateInvoice.mutate({ id, ...updates }),
    deleteInvoice: (id: string) => deleteInvoice.mutate(id),
  };
}
