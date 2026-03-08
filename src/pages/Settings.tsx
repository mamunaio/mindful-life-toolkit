import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Camera, Loader2, Bell, CheckSquare, Heart, Wallet, Briefcase, BarChart3, Shield, User, Mail } from "lucide-react";

export default function Settings() {
  const { user, displayName } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(displayName ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [email, setEmail] = useState(user?.email ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [notifications, setNotifications] = useState({
    task_reminders: true,
    health_checkins: true,
    payment_alerts: true,
    freelance_deadlines: true,
    weekly_summary: true,
  });
  const [savingNotifications, setSavingNotifications] = useState(false);

  useEffect(() => {
    setName(displayName ?? "");
    setEmail(user?.email ?? "");
  }, [displayName, user]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("avatar_url, notification_preferences")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.avatar_url) setAvatarUrl(data.avatar_url);
        if (data?.notification_preferences) {
          setNotifications(data.notification_preferences as typeof notifications);
        }
      });
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Image must be under 2MB"); return; }
    setUploadingAvatar(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (uploadError) { toast.error(uploadError.message); setUploadingAvatar(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = `${publicUrl}?t=${Date.now()}`;
    await supabase.from("profiles").update({ avatar_url: url }).eq("user_id", user.id);
    setAvatarUrl(url);
    setUploadingAvatar(false);
    toast.success("Avatar updated!");
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    const trimmed = name.trim();
    if (!trimmed) { toast.error("Display name cannot be empty"); return; }
    if (trimmed.length > 100) { toast.error("Display name must be under 100 characters"); return; }
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ display_name: trimmed }).eq("user_id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profile updated!");
  };

  const handleUpdateEmail = async () => {
    if (!user) return;
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) { toast.error("Please enter a valid email"); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ email: trimmed });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Check your new email for a confirmation link!");
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords do not match"); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("Password updated!"); setNewPassword(""); setConfirmPassword(""); }
  };

  const handleToggleNotification = async (key: keyof typeof notifications) => {
    if (!user) return;
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);
    setSavingNotifications(true);
    const { error } = await supabase.from("profiles").update({ notification_preferences: updated } as any).eq("user_id", user.id);
    setSavingNotifications(false);
    if (error) { setNotifications(notifications); toast.error(error.message); }
  };

  const notificationItems = [
    { key: "task_reminders" as const, label: "Task Reminders", desc: "Get reminded about upcoming and overdue tasks", icon: CheckSquare },
    { key: "health_checkins" as const, label: "Health Check-ins", desc: "Daily reminders to log mood, water, and habits", icon: Heart },
    { key: "payment_alerts" as const, label: "Payment Alerts", desc: "Notifications for pending and overdue payments", icon: Wallet },
    { key: "freelance_deadlines" as const, label: "Freelance Deadlines", desc: "Alerts when project deadlines are approaching", icon: Briefcase },
    { key: "weekly_summary" as const, label: "Weekly Summary", desc: "A weekly overview of your productivity and finances", icon: BarChart3 },
  ];

  const initials = (name || user?.email || "U").slice(0, 2).toUpperCase();

  return (
    <div className="page-container space-y-8 animate-in fade-in duration-500">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your profile and account preferences</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Profile */}
        <Card className="card-elevated">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Profile</CardTitle>
            </div>
            <CardDescription>Your public identity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-5">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <Avatar className="h-20 w-20 border-2 border-border/60">
                  {avatarUrl ? <AvatarImage src={avatarUrl} alt="Avatar" /> : (
                    <AvatarFallback className="bg-primary/8 text-primary text-lg font-semibold">{initials}</AvatarFallback>
                  )}
                </Avatar>
                <div className="absolute inset-0 rounded-full bg-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  {uploadingAvatar ? <Loader2 className="h-5 w-5 text-background animate-spin" /> : <Camera className="h-5 w-5 text-background" />}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </div>
              <div className="flex-1 space-y-2">
                <Label className="text-xs font-medium">Display Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" maxLength={100} />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleUpdateProfile} disabled={saving} size="sm">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Save Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Email */}
        <Card className="card-elevated">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Email</CardTitle>
            </div>
            <CardDescription>Update your email address</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Email Address</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" maxLength={255} />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleUpdateEmail} disabled={saving} size="sm">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Update Email
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Password */}
        <Card className="card-elevated">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Password</CardTitle>
            </div>
            <CardDescription>Change your account password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium">New Password</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" minLength={6} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">Confirm New Password</Label>
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" minLength={6} />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleChangePassword} disabled={saving} size="sm">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Change Password
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="card-elevated">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Notifications</CardTitle>
            </div>
            <CardDescription>Choose which notifications you'd like to receive</CardDescription>
          </CardHeader>
          <CardContent className="space-y-0.5">
            {notificationItems.map((item, i) => (
              <div key={item.key}>
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                      <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                  <Switch checked={notifications[item.key]} onCheckedChange={() => handleToggleNotification(item.key)} disabled={savingNotifications} />
                </div>
                {i < notificationItems.length - 1 && <Separator className="opacity-50" />}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
