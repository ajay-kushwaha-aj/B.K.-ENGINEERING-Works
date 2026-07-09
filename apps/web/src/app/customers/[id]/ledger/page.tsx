"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  ArrowLeft,
  Loader2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Printer,
} from "lucide-react";

interface LedgerEntry {
  date: string;
  type: "INVOICE" | "PAYMENT";
  description: string;
  debit: number;
  credit: number;
  balance: number;
  reference?: string;
}

interface LedgerData {
  customer: any;
  entries: LedgerEntry[];
  summary: {
    totalDebit: number;
    totalCredit: number;
    closingBalance: number;
  };
}

function formatINR(val: number) {
  return `₹${val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function CustomerLedgerPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;
  const [data, setData] = React.useState<LedgerData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!customerId) return;
    setIsLoading(true);
    fetch(`/api/customers/${customerId}/ledger`)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) throw new Error(json.error);
        setData(json);
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [customerId]);

  return (
    <Navigation>
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Button variant="ghost" size="sm" onClick={() => router.push("/customers")} className="mb-2 -ml-2 cursor-pointer">
              <ArrowLeft size={16} className="mr-1" /> Back to Customers
            </Button>
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
              <BookOpen size={28} className="text-secondary" /> Customer Ledger
            </h1>
          </div>
          {data && (
            <Button variant="outline" onClick={() => window.print()} className="gap-1.5 cursor-pointer print:hidden">
              <Printer size={14} /> Print
            </Button>
          )}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 p-6 text-center">
            <AlertCircle className="mx-auto mb-2 text-red-500" size={28} />
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {data && !isLoading && (
          <>
            {/* Customer Info */}
            <Card className="border-border/60">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Customer</p>
                    <p className="font-bold text-foreground text-lg">{data.customer.name}</p>
                    {data.customer.companyName && (
                      <p className="text-sm text-muted-foreground">{data.customer.companyName}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">GSTIN</p>
                    <p className="font-mono text-sm">{data.customer.gstin || "Unregistered"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Outstanding Balance</p>
                    <p className={`text-xl font-extrabold ${data.summary.closingBalance > 0 ? "text-red-500" : "text-green-500"}`}>
                      {formatINR(data.summary.closingBalance)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-border/60 bg-card p-4 text-center">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Invoiced</p>
                <p className="text-lg font-extrabold text-foreground">{formatINR(data.summary.totalDebit)}</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-card p-4 text-center">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Received</p>
                <p className="text-lg font-extrabold text-green-600">{formatINR(data.summary.totalCredit)}</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-card p-4 text-center">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Closing Balance</p>
                <p className={`text-lg font-extrabold ${data.summary.closingBalance > 0 ? "text-red-500" : "text-green-500"}`}>
                  {formatINR(data.summary.closingBalance)}
                </p>
              </div>
            </div>

            {/* Ledger Table */}
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Transaction Ledger</CardTitle>
              </CardHeader>
              <CardContent>
                {data.entries.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen size={40} className="mx-auto text-muted-foreground/40 mb-3" />
                    <p className="text-sm text-muted-foreground">No transactions found for this customer</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/50">
                          <th className="px-3 py-2 text-xs font-bold uppercase text-muted-foreground">Date</th>
                          <th className="px-3 py-2 text-xs font-bold uppercase text-muted-foreground">Description</th>
                          <th className="px-3 py-2 text-xs font-bold uppercase text-muted-foreground text-right">Debit (₹)</th>
                          <th className="px-3 py-2 text-xs font-bold uppercase text-muted-foreground text-right">Credit (₹)</th>
                          <th className="px-3 py-2 text-xs font-bold uppercase text-muted-foreground text-right">Balance (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.entries.map((entry, idx) => (
                          <tr key={idx} className="border-b border-border/40 hover:bg-muted/20">
                            <td className="px-3 py-2 text-muted-foreground">
                              {new Date(entry.date).toLocaleDateString("en-IN")}
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-1.5">
                                {entry.type === "INVOICE" ? (
                                  <ArrowUpRight size={14} className="text-red-500 shrink-0" />
                                ) : (
                                  <ArrowDownLeft size={14} className="text-green-500 shrink-0" />
                                )}
                                <span>{entry.description}</span>
                              </div>
                              {entry.reference && (
                                <span className="text-[10px] text-muted-foreground ml-5">Ref: {entry.reference}</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {entry.debit > 0 ? (
                                <span className="text-red-600 font-semibold">{formatINR(entry.debit)}</span>
                              ) : "—"}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {entry.credit > 0 ? (
                                <span className="text-green-600 font-semibold">{formatINR(entry.credit)}</span>
                              ) : "—"}
                            </td>
                            <td className={`px-3 py-2 text-right font-bold ${entry.balance > 0 ? "text-red-600" : "text-green-600"}`}>
                              {formatINR(entry.balance)}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-muted/60 font-bold border-t-2 border-border">
                          <td className="px-3 py-2" colSpan={2}>CLOSING BALANCE</td>
                          <td className="px-3 py-2 text-right text-red-600">{formatINR(data.summary.totalDebit)}</td>
                          <td className="px-3 py-2 text-right text-green-600">{formatINR(data.summary.totalCredit)}</td>
                          <td className={`px-3 py-2 text-right font-extrabold ${data.summary.closingBalance > 0 ? "text-red-600" : "text-green-600"}`}>
                            {formatINR(data.summary.closingBalance)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Navigation>
  );
}
