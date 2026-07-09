"use client";

import * as React from "react";
import Link from "next/link";
import { Navigation } from "@/components/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ClipboardList,
  Plus,
  Search,
  Loader2,
  FileText,
  ArrowRight,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

interface Quotation {
  id: string;
  quotationNumber: string;
  customerId: string;
  date: string;
  items: any;
  grandTotal: number;
  status: "DRAFT" | "SENT" | "APPROVED" | "REJECTED" | "CONVERTED";
  createdAt: string;
  customer?: any;
}

const STATUS_BADGE: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  SENT: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  APPROVED: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  CONVERTED: "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
};

function formatINR(val: number) {
  return `₹${val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function QuotationsPage() {
  const [quotations, setQuotations] = React.useState<Quotation[]>([]);
  const [search, setSearch] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  const fetchQuotations = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/quotations");
      const json = await res.json();
      setQuotations(Array.isArray(json) ? json : []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  const updateStatus = async (id: string, status: string) => {
    setActionLoading(id);
    try {
      await fetch(`/api/quotations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      fetchQuotations();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const convertToInvoice = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/quotations/${id}/convert`, { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        alert(`Invoice ${json.invoiceNumber} created successfully!`);
        fetchQuotations();
      } else {
        alert(json.error || "Conversion failed");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = quotations.filter((q) => {
    const term = search.toLowerCase();
    return (
      q.quotationNumber.toLowerCase().includes(term) ||
      q.customer?.name?.toLowerCase()?.includes(term) ||
      q.customer?.companyName?.toLowerCase()?.includes(term)
    );
  });

  const statusFlow: Record<string, string | null> = {
    DRAFT: "SENT",
    SENT: "APPROVED",
    APPROVED: null,
    REJECTED: null,
    CONVERTED: null,
  };

  return (
    <Navigation>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
              <ClipboardList size={28} className="text-secondary" /> Quotations
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Create quotations and convert approved ones to invoices
            </p>
          </div>
          <Link href="/quotations/create">
            <Button className="gap-1.5 cursor-pointer">
              <Plus size={16} /> New Quotation
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by number or customer..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <FileText size={48} className="mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-lg font-semibold text-muted-foreground">No quotations yet</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Create your first quotation to get started</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <div className="overflow-x-auto rounded-xl border border-border/60">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-xs font-bold uppercase text-muted-foreground">Quotation #</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase text-muted-foreground">Customer</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase text-muted-foreground">Date</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase text-muted-foreground text-right">Amount</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase text-muted-foreground text-center">Status</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase text-muted-foreground text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((q) => (
                      <tr key={q.id} className="border-b border-border/40 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-semibold text-foreground">{q.quotationNumber}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium">{q.customer?.companyName || q.customer?.name || "—"}</p>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{new Date(q.date).toLocaleDateString("en-IN")}</td>
                        <td className="px-4 py-3 text-right font-bold">{formatINR(q.grandTotal)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${STATUS_BADGE[q.status]}`}>
                            {q.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {statusFlow[q.status] && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-7 cursor-pointer"
                                disabled={actionLoading === q.id}
                                onClick={() => updateStatus(q.id, statusFlow[q.status]!)}
                              >
                                {actionLoading === q.id ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <>
                                    <ArrowRight size={12} className="mr-1" /> {statusFlow[q.status]}
                                  </>
                                )}
                              </Button>
                            )}
                            {q.status === "SENT" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-7 text-red-600 cursor-pointer"
                                disabled={actionLoading === q.id}
                                onClick={() => updateStatus(q.id, "REJECTED")}
                              >
                                Reject
                              </Button>
                            )}
                            {q.status === "APPROVED" && (
                              <Button
                                size="sm"
                                className="text-xs h-7 bg-green-600 hover:bg-green-700 cursor-pointer"
                                disabled={actionLoading === q.id}
                                onClick={() => convertToInvoice(q.id)}
                              >
                                {actionLoading === q.id ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <>
                                    <RefreshCw size={12} className="mr-1" /> Convert to Invoice
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {filtered.map((q) => (
                <Card key={q.id} className="border-border/60">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-foreground">{q.quotationNumber}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${STATUS_BADGE[q.status]}`}>
                        {q.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{q.customer?.companyName || q.customer?.name || "—"}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{new Date(q.date).toLocaleDateString("en-IN")}</span>
                      <span className="font-bold text-foreground">{formatINR(q.grandTotal)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {statusFlow[q.status] && (
                        <Button size="sm" variant="outline" className="text-xs h-7 flex-1 cursor-pointer" disabled={actionLoading === q.id} onClick={() => updateStatus(q.id, statusFlow[q.status]!)}>
                          <ArrowRight size={12} className="mr-1" /> Mark {statusFlow[q.status]}
                        </Button>
                      )}
                      {q.status === "APPROVED" && (
                        <Button size="sm" className="text-xs h-7 flex-1 bg-green-600 hover:bg-green-700 cursor-pointer" disabled={actionLoading === q.id} onClick={() => convertToInvoice(q.id)}>
                          <RefreshCw size={12} className="mr-1" /> Convert
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </Navigation>
  );
}
