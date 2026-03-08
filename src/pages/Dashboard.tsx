import { Plus, CheckSquare, Wallet, Heart, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 6) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const quickLinks = [
  { title: "Tasks", desc: "3 items pending", icon: CheckSquare, color: "gradient-primary", to: "/tasks" },
  { title: "Finance", desc: "Track spending", icon: Wallet, color: "gradient-warm", to: "/finance" },
  { title: "Health", desc: "Log your day", icon: Heart, color: "gradient-cool", to: "/health" },
];

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Hero Greeting */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
          <Sparkles className="h-4 w-4 text-accent" />
          <span>{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold font-display tracking-tight text-foreground">
          {getGreeting()} <span className="text-primary">👋</span>
        </h1>
        <p className="text-lg text-muted-foreground">
          Here's your life at a glance. What would you like to focus on today?
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickLinks.map((link) => (
          <Card
            key={link.title}
            className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/50"
            onClick={() => navigate(link.to)}
          >
            <CardContent className="p-6">
              <div className={`w-10 h-10 rounded-xl ${link.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <link.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="font-semibold font-display text-card-foreground">{link.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{link.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Add */}
      <Card className="border-dashed border-2 border-border hover:border-primary/50 transition-colors">
        <CardContent className="p-6 flex items-center justify-center">
          <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-primary">
            <Plus className="h-5 w-5" />
            Quick add a task, note, or expense
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
