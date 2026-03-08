import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContext {
  session: Session | null;
  user: User | null;
  displayName: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContext>({
  session: null, user: null, displayName: null, loading: true, signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        // Defer profile fetch to avoid deadlock
        setTimeout(() => fetchDisplayName(session.user.id), 0);
      } else {
        setDisplayName(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) fetchDisplayName(session.user.id);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchDisplayName = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", userId)
      .single();
    setDisplayName(data?.display_name || null);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, displayName, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
