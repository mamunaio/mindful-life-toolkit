import { useState, useRef, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Camera, Loader2, Bell, CheckSquare, Heart, Wallet, Briefcase, BarChart3,
  Shield, User, Mail, Settings2, Palette, Globe, Clock, DollarSign,
  Calendar, MessageSquare, Link2, Download, FileText, Database, Zap,
} from "lucide-react";

// ─── Side‑tab config ───
const TABS = [
  { id: "account", label: "Account", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "preferences", label: "Preferences", icon: Palette },
  { id: "integrations", label: "Integrations", icon: Link2 },
  { id: "data", label: "Data Management", icon: Database },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ─── Timezone list (common) ───
const TIMEZONES = [
  "UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "Europe/London", "Europe/Berlin", "Europe/Paris", "Asia/Tokyo", "Asia/Shanghai",
  "Asia/Kolkata", "Asia/Dhaka", "Asia/Dubai", "Australia/Sydney", "Pacific/Auckland",
];

const DATE_FORMATS = [
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
];

const CURRENCIES = [
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "GBP", label: "GBP (£)" },
  { value: "BDT", label: "BDT (৳)" },
  { value: "INR", label: "INR (₹)" },
  { value: "JPY", label: "JPY (¥)" },
  { value: "AUD", label: "AUD (A$)" },
  { value: "CAD", label: "CAD (C$)" },
];

export default function Settings() {
  const { user, displayName } = useAuth();
  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<TabId>("account");

  // Account state
  const [name, setName] = useState(displayName ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [email, setEmail] = useState(user?.email ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState({
    task_reminders: true,
    health_checkins: true,
    payment_alerts: true,
    freelance_deadlines: true,
    weekly_summary: true,
    email_notifications: true,
    push_notifications: false,
    hourly_task_digest: false,
  });
  const [savingNotifications, setSavingNotifications] = useState(false);

  // Preferences state
  const [timezone, setTimezone] = useState("UTC");
  const [dateFormat, setDateFormat] = useState("YYYY-MM-DD");
  const [currency, setCurrency] = useState("USD");

  // Data export state
  const [exporting, setExporting] = useState<string | null>(null);

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
          setNotifications((prev) => ({ ...prev, ...(data.notification_preferences as Record<string, boolean>) }));
        }
      });
  }, [user]);

  // ─── Handlers ───
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

  const handleExportCSV = async (table: string, label: string) => {
    if (!user) return;
    setExporting(table);
    try {
      const { data, error } = await supabase.from(table as any).select("*");
      if (error) throw error;
      const rows = data as unknown as Record<string, unknown>[];
      if (!rows || rows.length === 0) { toast.info(`No ${label} data to export`); setExporting(null); return; }
      const headers = Object.keys(rows[0]);
      const csv = [
        headers.join(","),
        ...rows.map((row) =>
          headers.map((h) => {
            const val = row[h];
            const str = val === null ? "" : String(val);
            return str.includes(",") || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
          }).join(",")
        ),
      ].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lifehub-${table}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${label} exported!`);
    } catch (err: any) {
      toast.error(err.message || "Export failed");
    }
    setExporting(null);
  };

  const notificationItems = [
    { key: "email_notifications" as const, label: "Email Notifications", desc: "Receive important updates via email", icon: Mail },
    { key: "push_notifications" as const, label: "Push Notifications", desc: "Browser push notifications for real-time alerts", icon: Zap },
    { key: "hourly_task_digest" as const, label: "Hourly Task Digest", desc: "Receive an hourly report of completed vs pending tasks", icon: Clock },
    { key: "task_reminders" as const, label: "Task Reminders", desc: "Get reminded about upcoming and overdue tasks", icon: CheckSquare },
    { key: "health_checkins" as const, label: "Health Check-ins", desc: "Daily reminders to log mood, water, and habits", icon: Heart },
    { key: "payment_alerts" as const, label: "Payment Alerts", desc: "Notifications for pending and overdue payments", icon: Wallet },
    { key: "freelance_deadlines" as const, label: "Freelance Deadlines", desc: "Alerts when project deadlines are approaching", icon: Briefcase },
    { key: "weekly_summary" as const, label: "Weekly Summary", desc: "A weekly overview of your productivity and finances", icon: BarChart3 },
  ];

  const integrations = [
    { id: "google_calendar", name: "Google Calendar", desc: "Sync schedule events with Google Calendar", icon: Calendar, status: "available" as const },
    { id: "email_resend", name: "Email (Resend/SMTP)", desc: "Configure outgoing email for notifications & digests", icon: Mail, status: "available" as const },
    { id: "slack", name: "Slack", desc: "Get LifeHub notifications in your Slack workspace", icon: MessageSquare, status: "available" as const },
  ];

  const exportables = [
    { table: "tasks", label: "Tasks", icon: CheckSquare },
    { table: "transactions", label: "Transactions", icon: Wallet },
    { table: "health_days", label: "Health Data", icon: Heart },
    { table: "notes", label: "Notes", icon: FileText },
    { table: "clients", label: "Clients", icon: Briefcase },
    { table: "payments", label: "Payments", icon: DollarSign },
  ];

  const initials = (name || user?.email || "U").slice(0, 2).toUpperCase();

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your account, preferences, and integrations</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Side tabs */}
        <nav className="md:w-56 shrink-0">
          <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 whitespace-nowrap ${
                    active
                      ? "bg-primary/10 text-primary sidebar-active-indicator"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <tab.icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 max-w-2xl space-y-6">
          {/* ═══════ ACCOUNT ═══════ */}
          {activeTab === "account" && (
            <>
              {/* Profile */}
              <Card className="card-elevated">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-base">Profile</CardTitle>
                  </div>
                  <CardDescription>Your public identity and avatar</CardDescription>
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
                    <Button onClick={handleUpdateEmail} disabled={saving} size="sm">Update Email</Button>
                  </div>
                </CardContent>
              </Card>

              {/* Security */}
              <Card className="card-elevated">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-base">Security</CardTitle>
                  </div>
                  <CardDescription>Password and two-factor authentication</CardDescription>
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
                    <Button onClick={handleChangePassword} disabled={saving} size="sm">Change Password</Button>
                  </div>
                  <Separator className="opacity-40" />
                  <div className="flex items-center justify-between py-1">
                    <div>
                      <p className="text-sm font-medium text-foreground">Two-Factor Authentication</p>
                      <p className="text-xs text-muted-foreground">Add an extra layer of security to your account</p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">Coming Soon</Badge>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* ═══════ NOTIFICATIONS ═══════ */}
          {activeTab === "notifications" && (
            <Card className="card-elevated">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-base">Notification Preferences</CardTitle>
                </div>
                <CardDescription>Control which notifications you receive and how</CardDescription>
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
                      <Switch
                        checked={notifications[item.key]}
                        onCheckedChange={() => handleToggleNotification(item.key)}
                        disabled={savingNotifications}
                      />
                    </div>
                    {i < notificationItems.length - 1 && <Separator className="opacity-30" />}
                  </div>
                ))}
                {notifications.hourly_task_digest && (
                  <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Hourly Task Digest</span> — When active, you'll receive an email every hour summarizing completed vs. pending tasks. Requires an email provider to be connected in the Integrations tab.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ═══════ PREFERENCES ═══════ */}
          {activeTab === "preferences" && (
            <Card className="card-elevated">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-base">Preferences</CardTitle>
                </div>
                <CardDescription>Personalize your LifeHub experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Theme */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium flex items-center gap-1.5">
                    <Palette className="h-3.5 w-3.5" /> Theme
                  </Label>
                  <Select value={theme} onValueChange={(v) => setTheme(v as "light" | "dark")}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator className="opacity-30" />

                {/* Timezone */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5" /> Timezone
                  </Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz} value={tz}>{tz.replace(/_/g, " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator className="opacity-30" />

                {/* Date format */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" /> Date Format
                  </Label>
                  <Select value={dateFormat} onValueChange={setDateFormat}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DATE_FORMATS.map((f) => (
                        <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator className="opacity-30" />

                {/* Currency */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5" /> Default Currency
                  </Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ═══════ INTEGRATIONS ═══════ */}
          {activeTab === "integrations" && (
            <div className="space-y-4">
              <div className="mb-2">
                <h2 className="text-sm font-semibold text-foreground">Connected Services</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Connect external apps to enhance your workflow</p>
              </div>
              {integrations.map((int) => (
                <Card key={int.id} className="card-elevated">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
                          <int.icon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{int.name}</p>
                          <p className="text-xs text-muted-foreground">{int.desc}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="text-xs">
                        Connect
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* ═══════ DATA MANAGEMENT ═══════ */}
          {activeTab === "data" && (
            <Card className="card-elevated">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-base">Data Management</CardTitle>
                </div>
                <CardDescription>Export your data for backup or analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1">
                {exportables.map((item, i) => (
                  <div key={item.table}>
                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                          <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{item.label}</p>
                          <p className="text-xs text-muted-foreground">Export all {item.label.toLowerCase()} as CSV</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs gap-1.5"
                        disabled={exporting === item.table}
                        onClick={() => handleExportCSV(item.table, item.label)}
                      >
                        {exporting === item.table ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                        Export
                      </Button>
                    </div>
                    {i < exportables.length - 1 && <Separator className="opacity-30" />}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
