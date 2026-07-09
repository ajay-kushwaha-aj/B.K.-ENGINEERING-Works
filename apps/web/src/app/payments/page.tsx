"use client";

import * as React from "react";
import Link from "next/link";
import { Navigation } from "@/components/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  Plus,
  Search,
  Clock,
  AlertCircle,
  Loader2,
  ExternalLink,
  CheckCircle,
  X,
  IndianRupee,
  Calendar,
  Hash,
} from "lucide-react";

interface PaymentRecord {
  id: string;
  invoiceId: string;
  amount: number;
  mode: string;
  transactionId: string | null;
  paymentDate: string;
  createdAt: string;
  invoice?: any;
}

interface OutstandingInvoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  invoiceDate: string;
  grandTotal: number;
  paymentStatus: string;
  customer?: any;
  totalPaid: number;
  balanceDue: number;
  ageDays: number;
}

const PAYMENT_MODES = [
  { value: "CASH", label: "Cash", emoji: "💵" },
  { value: "UPI", label: "UPI", emoji: "📱" },
  { value: "BANK_TRANSFER", label: "Bank Transfer", emoji: "🏦" },
  { value: "CHEQUE", label: "Cheque", emoji: "📝" },
  { value: "ONLINE", label: "Online", emoji: "💻" },
];

function formatINR(val: number) {
  return `₹${val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function PaymentsPage() {
  const [outstanding, setOutstanding] = React.useState<OutstandingInvoice[]>([]);
  const [recentPayments, setRecentPayments] = React.useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");

  // Modal state
  const [showModal, setShowModal] = React.useState(false);
  const [modalInvoiceId, setModalInvoiceId] = React.useState("");
  const [modalAmount, setModalAmount] = React.useState("");
  const [modalMode, setModalMode] = React.useState("CASH");
  const [modalDate, setModalDate] = React.useState(new Date().toISOString().split("T")[0]);
  const [modalTxnId, setModalTxnId] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = React.useState(false);

  // Tab state
  const [activeTab, setActiveTab] = React.useState<"outstanding" | "history">("outstanding");

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [invRes, payRes] = await Promise.all([
        fetch("/api/invoices"),
        fetch("/api/payments"),
      ]);
      const invoices = await invRes.json();
      const payments = await payRes.json();

      if (!invRes.ok) throw new Error("Failed to fetch invoices");
      if (!payRes.ok) throw new Error("Failed to fetch payments");

      setRecentPayments(payments);

      // Calculate outstanding
      const outstandingList: OutstandingInvoice[] = invoices
        .filter((inv: any) => inv.status !== "CANCELLED" && (inv.paymentStatus === "UNPAID" || inv.paymentStatus === "PARTIAL"))
        .map((inv: any) => {
          const invPayments = payments.filter((p: any) => p.invoiceId === inv.id);
          const totalPaid = invPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
          const balanceDue = Number(inv.grandTotal) - totalPaid;
          const ageDays = Math.floor(
            (new Date().getTime() - new Date(inv.invoiceDate).getTime()) / (1000 * 60 * 60 * 24)
          );
          return {
            id: inv.id,
            invoiceNumber: inv.invoiceNumber,
            customerId: inv.customerId,
            invoiceDate: inv.invoiceDate,
            grandTotal: Number(inv.grandTotal),
            paymentStatus: inv.paymentStatus,
            customer: inv.customer,
            totalPaid,
            balanceDue,
            ageDays,
          };
        })
        .sort((a: OutstandingInvoice, b: OutstandingInvoice) => b.ageDays - a.ageDays);

      setOutstanding(outstandingList);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openPaymentModal = (invoiceId: string, balance: number) => {
    setModalInvoiceId(invoiceId);
    setModalAmount(String(balance));
    setModalMode("CASH");
    setModalDate(new Date().toISOString().split("T")[0]);
    setModalTxnId("");
    setSaveError(null);
    setSaveSuccess(false);
    setShowModal(true);
  };

  const handleSavePayment = async () => {
    if (!modalInvoiceId || !modalAmount || Number(modalAmount) <= 0) {
      setSaveError("Please enter a valid payment amount");
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: modalInvoiceId,
          amount: Number(modalAmount),
          mode: modalMode,
          paymentDate: modalDate,
          transactionId: modalTxnId || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to record payment");

      setSaveSuccess(true);
      setTimeout(() => {
        setShowModal(false);
        fetchData();
      }, 1200);
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const getWhatsAppLink = (inv: OutstandingInvoice) => {
    const phone = inv.customer?.phone?.replace(/[^0-9]/g, "") || "";
    const name = inv.customer?.name || inv.customer?.companyName || "Customer";
    const text = `Dear ${name}, this is a friendly reminder that Invoice ${inv.invoiceNumber} for ₹${inv.balanceDue.toLocaleString("en-IN", { minimumFractionDigits: 2 })} is pending since ${new Date(inv.invoiceDate).toLocaleDateString("en-IN")}. Kindly arrange payment at the earliest. — B.K. Engineering Works`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  };

  const filteredOutstanding = outstanding.filter((inv) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      inv.invoiceNumber.toLowerCase().includes(s) ||
      (inv.customer?.name || "").toLowerCase().includes(s) ||
      (inv.customer?.companyName || "").toLowerCase().includes(s)
    );
  });

  const filteredPayments = recentPayments.filter((p) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      p.invoice?.invoiceNumber?.toLowerCase().includes(s) ||
      p.invoice?.customer?.name?.toLowerCase().includes(s) ||
      p.mode.toLowerCase().includes(s)
    );
  });

  const totalOutstanding = outstanding.reduce((sum, inv) => sum + inv.balanceDue, 0);

  return (
    <Navigation>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
              <Wallet size={28} className="text-secondary" /> Payments
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Record payments, track outstanding balances, and send reminders
            </p>
          </div>
          <Button
            onClick={() => {
              if (outstanding.length > 0) {
                openPaymentModal(outstanding[0].id, outstanding[0].balanceDue);
              } else {
                setShowModal(true);
                setModalInvoiceId("");
                setModalAmount("");
                setSaveError(null);
                setSaveSuccess(false);
              }
            }}
            className="gap-2 cursor-pointer"
          >
            <Plus size={16} /> Record Payment
          </Button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-950/30 p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Total Outstanding</p>
            <p className="text-lg font-extrabold text-red-600 dark:text-red-400">{formatINR(totalOutstanding)}</p>
          </div>
          <div className="rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/30 p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Pending Invoices</p>
            <p className="text-lg font-extrabold text-amber-600 dark:text-amber-400">{outstanding.length}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/30 p-4 col-span-2 md:col-span-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Payments Recorded</p>
            <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">{recentPayments.length}</p>
          </div>
        </div>

        {/* Tab Toggle + Search */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="flex rounded-lg border border-border overflow-hidden flex-shrink-0">
            <button
              onClick={() => setActiveTab("outstanding")}
              className={`px-4 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === "outstanding"
                  ? "bg-secondary text-slate-900"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <Clock size={14} className="inline mr-1.5 -mt-0.5" /> Outstanding ({outstanding.length})
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-4 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === "history"
                  ? "bg-secondary text-slate-900"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <CheckCircle size={14} className="inline mr-1.5 -mt-0.5" /> Payment History ({recentPayments.length})
            </button>
          </div>

          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search invoices, customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-secondary/50"
            />
          </div>
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

        {/* Outstanding Tab */}
        {!isLoading && activeTab === "outstanding" && (
          <>
            {filteredOutstanding.length === 0 ? (
              <Card className="border-border/60">
                <CardContent className="py-16 text-center">
                  <CheckCircle size={48} className="mx-auto text-emerald-400 mb-4" />
                  <h3 className="text-lg font-bold text-foreground mb-1">All Caught Up!</h3>
                  <p className="text-sm text-muted-foreground">No outstanding payments at the moment.</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto rounded-xl border border-border/60">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Invoice</th>
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Customer</th>
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Date</th>
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Total</th>
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Paid</th>
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Balance</th>
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">Age</th>
                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOutstanding.map((inv) => (
                        <tr key={inv.id} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 text-sm font-semibold text-foreground">{inv.invoiceNumber}</td>
                          <td className="px-4 py-3 text-sm text-foreground">
                            {inv.customer?.companyName || inv.customer?.name || "—"}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {new Date(inv.invoiceDate).toLocaleDateString("en-IN")}
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-foreground text-right">
                            {formatINR(inv.grandTotal)}
                          </td>
                          <td className="px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400 text-right">
                            {formatINR(inv.totalPaid)}
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-red-600 dark:text-red-400 text-right">
                            {formatINR(inv.balanceDue)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
                                inv.ageDays > 30
                                  ? "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400"
                                  : inv.ageDays > 7
                                  ? "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
                                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                              }`}
                            >
                              {inv.ageDays}d
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-1.5">
                              <Button
                                size="sm"
                                onClick={() => openPaymentModal(inv.id, inv.balanceDue)}
                                className="h-8 px-3 text-xs gap-1 cursor-pointer"
                              >
                                <IndianRupee size={12} /> Pay
                              </Button>
                              <Link
                                href={getWhatsAppLink(inv)}
                                target="_blank"
                                className="h-8 px-2.5 inline-flex items-center text-xs border border-border rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-600 font-semibold transition-colors"
                              >
                                <ExternalLink size={12} className="mr-1" /> Remind
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {filteredOutstanding.map((inv) => (
                    <div key={inv.id} className="rounded-xl border border-border/60 p-4 space-y-3 bg-card">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-sm text-foreground">{inv.invoiceNumber}</p>
                          <p className="text-xs text-muted-foreground">{inv.customer?.companyName || inv.customer?.name}</p>
                        </div>
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.ageDays > 30
                              ? "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
                          }`}
                        >
                          {inv.ageDays} days old
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-[10px] uppercase text-muted-foreground">Total</p>
                          <p className="text-xs font-bold">{formatINR(inv.grandTotal)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-muted-foreground">Paid</p>
                          <p className="text-xs font-bold text-emerald-600">{formatINR(inv.totalPaid)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-muted-foreground">Due</p>
                          <p className="text-xs font-bold text-red-600">{formatINR(inv.balanceDue)}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => openPaymentModal(inv.id, inv.balanceDue)}
                          className="flex-1 h-9 text-xs gap-1 cursor-pointer"
                        >
                          <IndianRupee size={12} /> Record Payment
                        </Button>
                        <Link
                          href={getWhatsAppLink(inv)}
                          target="_blank"
                          className="h-9 px-3 inline-flex items-center text-xs border border-border rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-600 font-semibold transition-colors"
                        >
                          <ExternalLink size={12} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* Payment History Tab */}
        {!isLoading && activeTab === "history" && (
          <>
            {filteredPayments.length === 0 ? (
              <Card className="border-border/60">
                <CardContent className="py-16 text-center">
                  <Wallet size={48} className="mx-auto text-muted-foreground/40 mb-4" />
                  <h3 className="text-lg font-bold text-foreground mb-1">No Payments Yet</h3>
                  <p className="text-sm text-muted-foreground">Record your first payment to see the history here.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {filteredPayments.map((p) => (
                  <div key={p.id} className="rounded-xl border border-border/60 p-4 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors bg-card">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center flex-shrink-0">
                        <CheckCircle size={18} className="text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {p.invoice?.invoiceNumber || "—"} · {p.invoice?.customer?.name || "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(p.paymentDate).toLocaleDateString("en-IN")} ·{" "}
                          {PAYMENT_MODES.find((m) => m.value === p.mode)?.label || p.mode}
                          {p.transactionId && ` · Ref: ${p.transactionId}`}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                      +{formatINR(Number(p.amount))}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Record Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Wallet size={20} className="text-secondary" /> Record Payment
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {saveSuccess ? (
                <div className="text-center py-8">
                  <CheckCircle size={48} className="mx-auto text-emerald-500 mb-3" />
                  <h3 className="text-lg font-bold text-foreground">Payment Recorded!</h3>
                  <p className="text-sm text-muted-foreground mt-1">Invoice status has been updated.</p>
                </div>
              ) : (
                <>
                  {/* Invoice Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                      Invoice
                    </label>
                    <select
                      value={modalInvoiceId}
                      onChange={(e) => {
                        setModalInvoiceId(e.target.value);
                        const inv = outstanding.find((i) => i.id === e.target.value);
                        if (inv) setModalAmount(String(inv.balanceDue.toFixed(2)));
                      }}
                      className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-secondary/50"
                    >
                      <option value="">Select invoice...</option>
                      {outstanding.map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          {inv.invoiceNumber} — {inv.customer?.name || "Customer"} — Due: {formatINR(inv.balanceDue)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                      Amount (₹)
                    </label>
                    <div className="relative">
                      <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={modalAmount}
                        onChange={(e) => setModalAmount(e.target.value)}
                        className="w-full pl-8 pr-4 py-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-secondary/50"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Payment Mode */}
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                      Payment Mode
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {PAYMENT_MODES.map((mode) => (
                        <button
                          key={mode.value}
                          onClick={() => setModalMode(mode.value)}
                          className={`flex flex-col items-center p-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                            modalMode === mode.value
                              ? "border-secondary bg-secondary/10 text-secondary"
                              : "border-border text-muted-foreground hover:border-border hover:bg-muted/50"
                          }`}
                        >
                          <span className="text-base mb-0.5">{mode.emoji}</span>
                          {mode.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                      Payment Date
                    </label>
                    <div className="relative">
                      <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="date"
                        value={modalDate}
                        onChange={(e) => setModalDate(e.target.value)}
                        className="w-full pl-8 pr-4 py-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-secondary/50"
                      />
                    </div>
                  </div>

                  {/* Transaction ID */}
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                      Reference / Transaction ID <span className="text-muted-foreground">(optional)</span>
                    </label>
                    <div className="relative">
                      <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        value={modalTxnId}
                        onChange={(e) => setModalTxnId(e.target.value)}
                        className="w-full pl-8 pr-4 py-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-secondary/50"
                        placeholder="UPI Ref No., Cheque No., etc."
                      />
                    </div>
                  </div>

                  {saveError && (
                    <div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-400">
                      {saveError}
                    </div>
                  )}

                  <Button
                    onClick={handleSavePayment}
                    disabled={isSaving || !modalInvoiceId || !modalAmount}
                    className="w-full h-11 text-sm font-semibold gap-2 cursor-pointer"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} /> Record Payment
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </Navigation>
  );
}
