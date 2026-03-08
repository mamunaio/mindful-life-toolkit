import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export default function Auth() {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast.error(error.message);
    else navigate("/");
  };

  const handleSignup = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { display_name: displayName }, emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Check your email to confirm your account!");
  };

  const handleForgot = async () => {
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Check your email for a reset link!");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "login") handleLogin();
    else if (mode === "signup") handleSignup();
    else handleForgot();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-glow mx-auto">
            <span className="text-primary-foreground font-bold text-xl font-display">L</span>
          </div>
          <h1 className="text-2xl font-bold font-display text-foreground">
            {mode === "login" ? "Welcome back" : mode === "signup" ? "Create account" : "Reset password"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {mode === "login" ? "Sign in to your LifeHub account" : mode === "signup" ? "Start organizing your life" : "We'll send you a reset link"}
          </p>
        </div>

        <Card className="card-elevated">
          <CardContent className="p-6 space-y-4">
            {mode !== "forgot" && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2 h-11"
                  onClick={async () => {
                    const { error } = await lovable.auth.signInWithOAuth("google", {
                      redirect_uri: window.location.origin,
                    });
                    if (error) toast.error(error.message);
                  }}
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </Button>
                <div className="flex items-center gap-3">
                  <Separator className="flex-1" />
                  <span className="text-xs text-muted-foreground">or</span>
                  <Separator className="flex-1" />
                </div>
              </>
            )}
            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === "signup" && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Display Name</Label>
                  <Input placeholder="Your name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required className="h-10" />
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Email</Label>
                <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-10" />
              </div>
              {mode !== "forgot" && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Password</Label>
                  <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="h-10" />
                </div>
              )}
              <Button type="submit" className="w-full h-10" disabled={loading}>
                {loading ? "Please wait..." : mode === "login" ? "Sign In" : mode === "signup" ? "Create Account" : "Send Reset Link"}
              </Button>
            </form>

            <div className="text-center text-sm space-y-1.5 pt-1">
              {mode === "login" && (
                <>
                  <button onClick={() => setMode("forgot")} className="text-primary hover:underline block w-full text-xs">Forgot password?</button>
                  <p className="text-muted-foreground text-xs">
                    Don't have an account?{" "}
                    <button onClick={() => setMode("signup")} className="text-primary hover:underline font-medium">Sign up</button>
                  </p>
                </>
              )}
              {mode === "signup" && (
                <p className="text-muted-foreground text-xs">
                  Already have an account?{" "}
                  <button onClick={() => setMode("login")} className="text-primary hover:underline font-medium">Sign in</button>
                </p>
              )}
              {mode === "forgot" && (
                <button onClick={() => setMode("login")} className="text-primary hover:underline text-xs">Back to sign in</button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
