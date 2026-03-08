import { useState, useEffect } from "react";

export interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  description?: string;
  date: string;
}

function load(): Transaction[] {
  try {
    return JSON.parse(localStorage.getItem("lifehub-transactions") || "[]");
  } catch {
    return [];
  }
}

function save(t: Transaction[]) {
  localStorage.setItem("lifehub-transactions", JSON.stringify(t));
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>(load);

  useEffect(() => { save(transactions); }, [transactions]);

  const addTransaction = (t: Omit<Transaction, "id">) => {
    setTransactions((prev) => [{ ...t, id: crypto.randomUUID() }, ...prev]);
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  return { transactions, addTransaction, deleteTransaction };
}
