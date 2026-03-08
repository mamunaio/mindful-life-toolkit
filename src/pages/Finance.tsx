import { Wallet } from "lucide-react";

export default function Finance() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold font-display tracking-tight">Finance</h1>
        <p className="text-muted-foreground mt-1">Track your income and expenses</p>
      </div>
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Wallet className="h-12 w-12 mb-4 opacity-30" />
        <p className="font-display font-medium">Coming soon</p>
        <p className="text-sm">Expense tracking and budgets will appear here</p>
      </div>
    </div>
  );
}
