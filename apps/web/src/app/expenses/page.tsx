"use client";

import * as React from "react";
import { Navigation } from "@/components/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Coins,
  Plus,
  Loader2,
  AlertCircle,
  TrendingDown,
} from "lucide-react";

interface Expense {
  id: string;
  category: string;
  amount: number;
  date: string;
  notes: string | null;
  createdAt: string;
}

const CATEGORIES = ["Fuel", "Transport", "Salary", "Electricity", "Rent", "Custom"] as const;

function formatINR(val: number) {
  return `₹${val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // New Expense Form State
  const [category, setCategory] = React.useState<(typeof CATEGORIES)[number]>("Fuel");
  const [amount, setAmount] = React.useState<number>(0);
  const [date, setDate] = React.useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = React.useState("");

  const fetchExpenses = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/expenses");
      const json = await res.json();
      setExpenses(Array.isArray(json) ? json : []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, amount, date, notes }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setAmount(0);
        setNotes("");
        fetchExpenses();
      } else {
        const json = await res.json();
        alert(json.error || "Save expense failed");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group expenses by category
  const categoryTotals = expenses.reduce((acc, exp) => {
    const cat = exp.category;
    acc[cat] = (acc[cat] || 0) + Number(exp.amount);
    return acc;
  }, {} as Record<string, number>);

  const totalExpense = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <Navigation>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
              <Coins size={28} className="text-secondary" /> Expenses Log
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Record office, fuel, transport, and salary overhead expenses
            </p>
          </div>
          <Button className="gap-1.5 cursor-pointer" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Log Expense
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Expense breakdown & stats */}
            <div className="space-y-4">
              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-1.5">
                    <TrendingDown size={16} className="text-secondary" /> Breakdown by Category
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="p-3 bg-secondary/10 border border-secondary/20 rounded-lg flex items-center justify-between">
                    <span className="font-semibold text-foreground">Total Operational Cost</span>
                    <span className="text-lg font-extrabold text-secondary">{formatINR(totalExpense)}</span>
                  </div>

                  {Object.keys(categoryTotals).length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">No records logged yet.</p>
                  ) : (
                    <div className="space-y-3 pt-2">
                      {CATEGORIES.map((cat) => {
                        const amt = categoryTotals[cat] || 0;
                        const pct = totalExpense > 0 ? Math.round((amt / totalExpense) * 100) : 0;
                        return (
                          <div key={cat} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-foreground">{cat}</span>
                              <span className="text-muted-foreground">{formatINR(amt)} ({pct}%)</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-secondary" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Expenses List */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="text-base">Ledger Entries</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {expenses.length === 0 ? (
                    <div className="text-center py-12">
                      <Coins size={40} className="mx-auto text-muted-foreground/30 mb-3" />
                      <p className="text-sm text-muted-foreground">No logged expenses found</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-border bg-muted/50">
                            <th className="px-4 py-3 text-xs font-bold uppercase text-muted-foreground">Date</th>
                            <th className="px-4 py-3 text-xs font-bold uppercase text-muted-foreground">Category</th>
                            <th className="px-4 py-3 text-xs font-bold uppercase text-muted-foreground">Note / Reference</th>
                            <th className="px-4 py-3 text-xs font-bold uppercase text-muted-foreground text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {expenses.map((exp) => (
                            <tr key={exp.id} className="border-b border-border/40 hover:bg-muted/20 transition-colors">
                              <td className="px-4 py-3 text-muted-foreground">{new Date(exp.date).toLocaleDateString("en-IN")}</td>
                              <td className="px-4 py-3">
                                <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-muted border border-border">
                                  {exp.category}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-muted-foreground truncate max-w-[200px]" title={exp.notes || ""}>
                                {exp.notes || "—"}
                              </td>
                              <td className="px-4 py-3 text-right font-semibold text-foreground">{formatINR(Number(exp.amount))}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Log Expense Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border text-foreground rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
              <h2 className="text-lg font-bold tracking-tight mb-4">Log Operational Expense</h2>
              <form onSubmit={handleSubmitExpense} className="space-y-4 text-sm">
                <div className="space-y-1.5">
                  <label className="font-semibold">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground cursor-pointer"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold">Amount</label>
                  <Input
                    type="number"
                    min="1"
                    value={amount || ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(Number(e.target.value))}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold">Date</label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold">Notes / Details</label>
                  <Input
                    placeholder="e.g. Fuel for generator, office rent"
                    value={notes}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNotes(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)} className="cursor-pointer">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="cursor-pointer">
                    {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : "Record Expense"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Navigation>
  );
}
