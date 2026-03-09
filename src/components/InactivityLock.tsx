import { useState, useEffect, useCallback, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export function InactivityLock({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [locked, setLocked] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const resetTimer = useCallback(() => {
    if (!user || locked) return;
    const key = "lifehub-last-activity";
    localStorage.setItem(key, Date.now().toString());
  }, [user, locked]);

  // Set up activity listeners
  useEffect(() => {
    if (!user) return;

    const events = ["mousedown", "keydown", "scroll", "touchstart", "mousemove"];
    events.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer(); // initialize

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, [user, resetTimer]);

  // Check for inactivity
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      const last = parseInt(localStorage.getItem("lifehub-last-activity") || "0", 10);
      if (Date.now() - last > INACTIVITY_TIMEOUT) {
        setLocked(true);
      }
    }, 15_000); // check every 15s

    return () => clearInterval(interval);
  }, [user]);

  // Don't lock if not authenticated
  if (!user) return <>{children}</>;

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    });
    setLoading(false);

    if (error) {
      toast.error("Incorrect password. Please try again.");
    } else {
      setPassword("");
      setLocked(false);
      resetTimer();
      toast.success("Session unlocked");
    }
  };

  return (
    <>
      {children}
      <AnimatePresence>
        {locked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/95 backdrop-blur-2xl"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="w-full max-w-sm mx-4"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-glow mx-auto mb-4">
                  <Lock className="h-7 w-7 text-primary-foreground" strokeWidth={1.75} />
                </div>
                <h2 className="text-xl font-bold font-display text-foreground">Session Locked</h2>
                <p className="text-sm text-muted-foreground mt-1.5">
                  Your session was locked due to inactivity.
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {user.email}
                </p>
              </div>

              <form onSubmit={handleUnlock} className="space-y-4">
                <div className="relative">
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoFocus
                    className="h-11 pr-10"
                  />
                  <ShieldCheck className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                <Button type="submit" className="w-full h-10" disabled={loading}>
                  {loading ? "Verifying..." : "Unlock Session"}
                </Button>
              </form>

              <p className="text-center text-[11px] text-muted-foreground mt-6">
                Protected by enterprise-grade security
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
