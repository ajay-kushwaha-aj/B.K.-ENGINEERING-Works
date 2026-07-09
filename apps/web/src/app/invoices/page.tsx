"use client";

import * as React from "react";
import Link from "next/link";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
  Plus, 
  Search, 
  FileText, 
  Download, 
  XCircle, 
  Loader2,
  Calendar,
  AlertCircle,
  Copy,
  ExternalLink,
  Printer
} from "lucide-react";

// Dynamic import of PDF renderer inside handlers to prevent hydrations or reconciler crashes

export default function InvoicesPage() {
  const [invoices, setInvoices] = React.useState<any[]>([]);
  const [companySettings, setCompanySettings] = React.useState<any>(null);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [isMounted, setIsMounted] = React.useState(false);
  const [downloadingId, setDownloadingId] = React.useState<string | null>(null);

  const handleDownloadPdf = async (inv: any) => {
    try {
      setDownloadingId(inv.id);
      const themeChoice = confirm("Download using the Modern theme? (Cancel for Classic Standard)")
        ? "modern"
        : "classic";

      const { pdf } = await import("@react-pdf/renderer");
      const { InvoicePdfDocument } = await import("@/components/invoice-pdf");
      const doc = <InvoicePdfDocument invoice={inv} companySettings={companySettings} theme={themeChoice} />;
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${inv.invoiceNumber || "invoice"}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePrintInvoice = async (inv: any) => {
    try {
      const themeChoice = confirm("Print using the Modern theme? (Cancel for Classic Standard)")
        ? "modern"
        : "classic";

      const { pdf } = await import("@react-pdf/renderer");
      const { InvoicePdfDocument } = await import("@/components/invoice-pdf");
      const doc = <InvoicePdfDocument invoice={inv} companySettings={companySettings} theme={themeChoice} />;
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);

      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Print Invoice ${inv.invoiceNumber || ""}</title>
              <style>
                body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; }
                iframe { width: 100%; height: 100%; border: none; }
              </style>
            </head>
            <body>
              <iframe id="pdfFrame" src="${url}"></iframe>
              <script>
                window.onload = function() {
                  setTimeout(function() {
                    try {
                      const frame = document.getElementById('pdfFrame');
                      frame.contentWindow.focus();
                      frame.contentWindow.print();
                    } catch (e) {
                      console.error("Iframe print blocked:", e);
                      window.print();
                    }
                  }, 500);
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    } catch (err) {
      console.error("Print dialog trigger failed:", err);
    }
  };


  React.useEffect(() => {
    setIsMounted(true);
    // Load local company settings for PDF generation
    const localSettings = localStorage.getItem("bk_company_settings");
    if (localSettings) {
      setCompanySettings(JSON.parse(localSettings));
    }
  }, []);

  const fetchInvoices = React.useCallback(async () => {
    setIsLoading(true);
    try {
      let url = `/api/invoices?search=${encodeURIComponent(search)}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setInvoices(data);
      } else {
        throw new Error(data.error || "Failed to fetch invoices");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter]);

  React.useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleCancelInvoice = async (id: string, number: string) => {
    if (!confirm(`Are you sure you want to cancel Invoice ${number}? This action is permanent and required for GST audit compliance.`)) {
      return;
    }
    
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancelled: true }),
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || "Failed to cancel invoice");
      }

      fetchInvoices();
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    }
  };

  return (
    <Navigation>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              Invoices
              <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-mono font-medium">
                {invoices.length} total
              </span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Generate sequential billing documents, track payments, download GST-compliant PDFs, and share via WhatsApp.
            </p>
          </div>
          <Link href="/invoices/create" className="self-start sm:self-auto">
            <Button className="flex items-center gap-2">
              <Plus size={18} />
              Create Invoice
            </Button>
          </Link>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              placeholder="Search by invoice number or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 w-full pl-10 pr-4 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-11 rounded-lg border border-border bg-card text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary cursor-pointer min-w-[150px]"
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">DRAFT</option>
              <option value="FINAL">FINAL</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm font-semibold">
            {errorMsg}
          </div>
        )}

        {/* Loading state */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-secondary" size={36} />
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-2xl bg-card/50">
            <FileText className="mx-auto text-muted-foreground/50 mb-3" size={48} />
            <h3 className="text-lg font-bold text-foreground">No invoices found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {search || statusFilter ? "Try adjusting your filter settings." : "Get started by generating your first GST bill."}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto border border-border rounded-2xl bg-card shadow-sm">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Invoice No</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Customer</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Grand Total</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Payment</th>
                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-sm font-bold text-foreground">
                        {inv.invoiceNumber}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-foreground">{inv.customer?.companyName || inv.customer?.name}</div>
                        {inv.customer?.companyName && (
                          <div className="text-xs text-muted-foreground">Attn: {inv.customer?.name}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {new Date(inv.invoiceDate).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-foreground">
                        ₹{Number(inv.grandTotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
                          inv.status === "FINAL" 
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400"
                            : inv.status === "CANCELLED"
                            ? "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
                          inv.paymentStatus === "PAID" 
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400" 
                            : inv.paymentStatus === "PARTIAL"
                            ? "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}>
                          {inv.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex justify-end items-center gap-1.5">
                          {isMounted && (
                            <button
                              onClick={() => handleDownloadPdf(inv)}
                              disabled={downloadingId === inv.id}
                              className="p-2 text-slate-500 hover:text-secondary rounded-lg hover:bg-muted transition-colors cursor-pointer disabled:opacity-50"
                              title="Download PDF"
                            >
                              {downloadingId === inv.id ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <Download size={16} />
                              )}
                            </button>
                          )}

                          {isMounted && (
                            <button
                              onClick={() => handlePrintInvoice(inv)}
                              className="p-2 text-slate-500 hover:text-secondary rounded-lg hover:bg-muted transition-colors cursor-pointer"
                              title="Print Invoice"
                            >
                              <Printer size={16} />
                            </button>
                          )}

                          
                          <Link 
                            href={`https://wa.me/?text=${encodeURIComponent(
                              `Dear Customer, please find attached Invoice ${inv.invoiceNumber} for ₹${Number(inv.grandTotal).toLocaleString("en-IN")} from B.K. Engineering Works.`
                            )}`}
                            target="_blank"
                            className="p-2 text-slate-500 hover:text-emerald-500 rounded-lg hover:bg-muted transition-colors"
                            title="Share on WhatsApp"
                          >
                            <ExternalLink size={16} />
                          </Link>

                          {inv.status !== "CANCELLED" && (
                            <button
                              onClick={() => handleCancelInvoice(inv.id, inv.invoiceNumber)}
                              className="p-2 text-slate-500 hover:text-danger rounded-lg hover:bg-muted transition-colors cursor-pointer"
                              title="Cancel / Void Invoice"
                            >
                              <XCircle size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {invoices.map((inv) => (
                <Card key={inv.id}>
                  <CardHeader className="flex flex-row items-start justify-between pb-2 mb-0">
                    <div>
                      <span className="font-mono text-sm font-bold text-foreground block">{inv.invoiceNumber}</span>
                      <h3 className="font-bold text-foreground text-base leading-snug mt-1">{inv.customer?.companyName || inv.customer?.name}</h3>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-2xs font-extrabold ${
                        inv.status === "FINAL" 
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400"
                          : inv.status === "CANCELLED"
                          ? "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      }`}>
                        {inv.status}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    <div className="flex items-center justify-between text-sm pt-2 border-t border-border/40">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar size={14} />
                        <span>{new Date(inv.invoiceDate).toLocaleDateString("en-IN")}</span>
                      </div>
                      <span className="font-bold text-foreground">₹{Number(inv.grandTotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    </div>
                    
                    <div className="flex justify-between items-center pt-3 border-t border-border/60">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-2xs font-extrabold ${
                        inv.paymentStatus === "PAID" 
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400" 
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      }`}>
                        {inv.paymentStatus}
                      </span>
                      
                      <div className="flex items-center gap-2">
                        {isMounted && (
                          <button
                            onClick={() => handleDownloadPdf(inv)}
                            disabled={downloadingId === inv.id}
                            className="inline-flex items-center gap-1 text-xs border border-border hover:bg-muted text-foreground px-2.5 py-1.5 rounded-lg font-semibold disabled:opacity-50"
                          >
                            {downloadingId === inv.id ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <><Download size={12} /> PDF</>
                            )}
                          </button>
                        )}

                        {isMounted && (
                          <button
                            onClick={() => handlePrintInvoice(inv)}
                            className="inline-flex items-center gap-1 text-xs border border-border hover:bg-muted text-foreground px-2.5 py-1.5 rounded-lg font-semibold"
                          >
                            <Printer size={12} /> Print
                          </button>
                        )}

                        
                        {inv.status !== "CANCELLED" && (
                          <button
                            onClick={() => handleCancelInvoice(inv.id, inv.invoiceNumber)}
                            className="p-1.5 text-slate-500 hover:text-danger rounded-lg border border-border"
                          >
                            <XCircle size={14} />
                          </button>
                        )}
                      </div>
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
