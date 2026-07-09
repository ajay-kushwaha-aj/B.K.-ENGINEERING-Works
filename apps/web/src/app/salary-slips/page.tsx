"use client";

import * as React from "react";
import Link from "next/link";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { 
  Plus, 
  Search, 
  Receipt, 
  Download, 
  ExternalLink, 
  Loader2, 
  Calendar,
  AlertCircle,
  Coins,
  CheckCircle2,
  Trash2,
  Wallet,
  X,
  Printer
} from "lucide-react";
import { convertNumberToIndianWords } from "shared";

export default function SalarySlipsPage() {
  const [slips, setSlips] = React.useState<any[]>([]);
  const [workers, setWorkers] = React.useState<any[]>([]);
  const [companySettings, setCompanySettings] = React.useState<any>(null);
  
  // Filters
  const [search, setSearch] = React.useState("");
  const [workerFilter, setWorkerFilter] = React.useState("");
  const [monthFilter, setMonthFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  
  const [isLoading, setIsLoading] = React.useState(true);
  const [isMounted, setIsMounted] = React.useState(false);
  const [downloadingId, setDownloadingId] = React.useState<string | null>(null);
  
  // Modals state
  const [isGenerateModalOpen, setIsGenerateModalOpen] = React.useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = React.useState(false);
  
  // Selected slip for payment recording
  const [selectedSlip, setSelectedSlip] = React.useState<any>(null);
  const [paymentMode, setPaymentMode] = React.useState("BANK_TRANSFER");
  const [paymentDate, setPaymentDate] = React.useState(new Date().toISOString().split("T")[0]);
  const [transactionId, setTransactionId] = React.useState("");

  // Generation Modal States
  const [genWorkerId, setGenWorkerId] = React.useState("");
  const [genMonth, setGenMonth] = React.useState(new Date().getMonth() + 1);
  const [genYear, setGenYear] = React.useState(new Date().getFullYear());
  const [genLoading, setGenLoading] = React.useState(false);
  
  // Generated parameters
  const [daysPresent, setDaysPresent] = React.useState(0);
  const [daysAbsent, setDaysAbsent] = React.useState(0);
  const [overtimeHours, setOvertimeHours] = React.useState(0);
  
  const [basicSalary, setBasicSalary] = React.useState(0);
  const [overtimeAmount, setOvertimeAmount] = React.useState(0);
  const [allowances, setAllowances] = React.useState(0);
  const [bonus, setBonus] = React.useState(0);
  const [deductions, setDeductions] = React.useState(0);
  const [deductionNotes, setDeductionNotes] = React.useState("");
  
  const [netPay, setNetPay] = React.useState(0);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    setIsMounted(true);
    // Load local company settings
    const localSettings = localStorage.getItem("bk_company_settings");
    if (localSettings) {
      setCompanySettings(JSON.parse(localSettings));
    }
    
    // Load workers list for filter and generator dropdown
    const fetchWorkers = async () => {
      try {
        const res = await fetch("/api/workers");
        if (res.ok) {
          const data = await res.json();
          setWorkers(data);
        }
      } catch (err) {
        console.error("Failed to load workers list:", err);
      }
    };
    fetchWorkers();
  }, []);

  const fetchSlips = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (workerFilter) params.set("workerId", workerFilter);
      if (monthFilter) params.set("month", monthFilter);
      if (statusFilter) params.set("paymentStatus", statusFilter);

      const res = await fetch(`/api/salary-slips?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setSlips(data);
      } else {
        throw new Error(data.error || "Failed to fetch salary slips");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [workerFilter, monthFilter, statusFilter]);

  React.useEffect(() => {
    fetchSlips();
  }, [fetchSlips]);

  // Pull worker attendance logs and prefill wages on generator parameters change
  React.useEffect(() => {
    if (!genWorkerId) return;

    const pullAttendanceAndWages = async () => {
      setGenLoading(true);
      try {
        const workerObj = workers.find(w => w.id === genWorkerId);
        if (!workerObj) return;

        // Fetch attendance
        const res = await fetch(`/api/workers/${genWorkerId}/attendance?month=${genMonth}&year=${genYear}`);
        if (!res.ok) throw new Error("Failed to load attendance logs");
        
        const logs = await res.json();
        
        // Calculate days
        const present = logs.filter((l: any) => l.status === "PRESENT").length + 
                        logs.filter((l: any) => l.status === "HALF_DAY").length * 0.5;
        const absent = logs.filter((l: any) => l.status === "ABSENT").length + 
                       logs.filter((l: any) => l.status === "HALF_DAY").length * 0.5;
        const otHours = logs.reduce((sum: number, l: any) => sum + Number(l.overtimeHours), 0);

        setDaysPresent(present);
        setDaysAbsent(absent);
        setOvertimeHours(otHours);

        // Wage proration
        const baseVal = Number(workerObj.basicSalary);
        let calculatedBase = baseVal;
        
        if (workerObj.salaryType === "DAILY") {
          calculatedBase = baseVal * present;
        }
        
        setBasicSalary(calculatedBase);

        // Pre-calculate overtime wages at ₹150/hr default
        setOvertimeAmount(otHours * 150);
        
        // Reset allowances / bonus / deductions
        setAllowances(0);
        setBonus(0);
        setDeductions(0);
        setDeductionNotes("");
      } catch (err) {
        console.error(err);
      } finally {
        setGenLoading(false);
      }
    };

    pullAttendanceAndWages();
  }, [genWorkerId, genMonth, genYear, workers]);

  // Recalculate netPay when any wage component edits
  React.useEffect(() => {
    const gross = basicSalary + overtimeAmount + allowances + bonus;
    const net = Math.max(0, gross - deductions);
    setNetPay(net);
  }, [basicSalary, overtimeAmount, allowances, bonus, deductions]);

  const handleGenerateSlip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genWorkerId) return;

    try {
      const res = await fetch("/api/salary-slips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workerId: genWorkerId,
          month: Number(genMonth),
          year: Number(genYear),
          daysPresent,
          daysAbsent,
          overtimeHours,
          basicSalary,
          overtimeAmount,
          allowances,
          bonus,
          deductions,
          deductionNotes: deductionNotes || null,
          netPay,
          paymentStatus: "UNPAID",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate slip");
      }

      setIsGenerateModalOpen(false);
      fetchSlips();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlip) return;

    try {
      const res = await fetch(`/api/salary-slips/${selectedSlip.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentStatus: "PAID",
          paymentDate,
          paymentMode,
          transactionId: transactionId || null,
        }),
      });

      if (!res.ok) throw new Error("Failed to record payment");

      setIsPaymentModalOpen(false);
      fetchSlips();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDownloadPdf = async (slip: any) => {
    try {
      setDownloadingId(slip.id);
      const { pdf } = await import("@react-pdf/renderer");
      const { SalarySlipPdfDocument } = await import("@/components/salary-slip-pdf");
      const doc = <SalarySlipPdfDocument slip={slip} companySettings={companySettings} />;
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${slip.slipNumber || "salary-slip"}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePrintPdf = async (slip: any) => {
    try {
      const { pdf } = await import("@react-pdf/renderer");
      const { SalarySlipPdfDocument } = await import("@/components/salary-slip-pdf");
      const doc = <SalarySlipPdfDocument slip={slip} companySettings={companySettings} />;
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);

      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Print Salary Slip ${slip.slipNumber || ""}</title>
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

  const openPaymentModal = (slip: any) => {
    setSelectedSlip(slip);
    setPaymentMode("BANK_TRANSFER");
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setTransactionId("");
    setIsPaymentModalOpen(true);
  };

  const handleDeleteSlip = async (id: string, number: string) => {
    if (!confirm(`Are you sure you want to delete Salary Slip ${number}?`)) return;

    try {
      const res = await fetch(`/api/salary-slips/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete slip");
      fetchSlips();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <Navigation>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              <Receipt className="text-secondary" size={28} />
              Salary Slips
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Generate sequential payslips, record bank settlements, and share PDF copies with workers.
            </p>
          </div>
          <Button onClick={openAddModal} className="flex items-center gap-2 self-start sm:self-auto">
            <Plus size={18} />
            Generate Slip
          </Button>
        </div>

        {/* Filters Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-card border border-border p-4 rounded-xl shadow-sm">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Filter by Worker</label>
            <select
              value={workerFilter}
              onChange={(e) => setWorkerFilter(e.target.value)}
              className="h-10 rounded-lg border border-border bg-background px-3 focus:outline-none cursor-pointer text-sm"
            >
              <option value="">All Workers</option>
              {workers.map(w => (
                <option key={w.id} value={w.id}>{w.name} ({w.designation})</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Filter by Month</label>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="h-10 rounded-lg border border-border bg-background px-3 focus:outline-none cursor-pointer text-sm"
            >
              <option value="">All Months</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i+1} value={i+1}>
                  {new Date(0, i).toLocaleString("en-IN", { month: "long" })}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Payment Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-lg border border-border bg-background px-3 focus:outline-none cursor-pointer text-sm"
            >
              <option value="">All Statuses</option>
              <option value="UNPAID">UNPAID</option>
              <option value="PAID">PAID</option>
              <option value="PARTIAL">PARTIAL</option>
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
        ) : slips.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-2xl bg-card/50">
            <Receipt className="mx-auto text-muted-foreground/50 mb-3" size={48} />
            <h3 className="text-lg font-bold text-foreground">No salary slips found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Select a worker and month to generate your first professional payslip.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto border border-border rounded-2xl bg-card shadow-sm">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Slip Number</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Worker</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Month / Period</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Net Pay</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {slips.map((slip) => (
                    <tr key={slip.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-sm font-bold text-foreground">
                        {slip.slipNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-foreground">{slip.worker?.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{slip.worker?.designation}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {new Date(slip.year, slip.month - 1).toLocaleString("en-IN", { month: "long" })} {slip.year}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-foreground">
                        ₹{Number(slip.netPay).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
                          slip.paymentStatus === "PAID"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}>
                          {slip.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex justify-end items-center gap-1.5">
                          {isMounted && (
                            <button
                              onClick={() => handleDownloadPdf(slip)}
                              disabled={downloadingId === slip.id}
                              className="p-2 text-slate-500 hover:text-secondary rounded-lg hover:bg-muted transition-colors cursor-pointer disabled:opacity-50"
                              title="Download PDF"
                            >
                              {downloadingId === slip.id ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <Download size={16} />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => handlePrintPdf(slip)}
                            className="p-2 text-slate-500 hover:text-secondary rounded-lg hover:bg-muted transition-colors cursor-pointer"
                            title="Print Slip"
                          >
                            <Printer size={16} />
                          </button>
                          
                          <Link 
                            href={`https://wa.me/?text=${encodeURIComponent(
                              `Dear ${slip.worker?.name || "Employee"}, please find your Salary Slip ${slip.slipNumber} for ${new Date(slip.year, slip.month - 1).toLocaleString("en-IN", { month: "long" })} ${slip.year} (Net Pay: ₹${Number(slip.netPay).toLocaleString("en-IN")}) from B.K. Engineering Works.`
                            )}`}
                            target="_blank"
                            className="p-2 text-slate-500 hover:text-emerald-500 rounded-lg hover:bg-muted transition-colors"
                            title="Share on WhatsApp"
                          >
                            <ExternalLink size={16} />
                          </Link>

                          {slip.paymentStatus === "UNPAID" && (
                            <button
                              onClick={() => openPaymentModal(slip)}
                              className="p-2 text-slate-500 hover:text-emerald-500 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                              title="Record Payment"
                            >
                              <Wallet size={16} />
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteSlip(slip.id, slip.slipNumber)}
                            className="p-2 text-slate-500 hover:text-danger rounded-lg hover:bg-muted transition-colors cursor-pointer"
                            title="Delete payslip"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {slips.map((slip) => (
                <Card key={slip.id}>
                  <CardHeader className="flex flex-row items-start justify-between pb-2 mb-0">
                    <div>
                      <span className="font-mono text-sm font-bold text-foreground block">{slip.slipNumber}</span>
                      <h3 className="font-bold text-foreground text-base leading-snug mt-1">{slip.worker?.name}</h3>
                      <p className="text-xs text-muted-foreground">{slip.worker?.designation}</p>
                    </div>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
                      slip.paymentStatus === "PAID"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}>
                      {slip.paymentStatus}
                    </span>
                  </CardHeader>
                  <CardContent className="pt-2 pb-4 text-sm space-y-2">
                    <div className="flex justify-between border-b border-border/50 pb-2">
                      <span className="text-muted-foreground">Period</span>
                      <span className="font-medium text-foreground">{new Date(slip.year, slip.month - 1).toLocaleString("en-IN", { month: "long" })} {slip.year}</span>
                    </div>
                    <div className="flex justify-between border-b border-border/50 pb-2">
                      <span className="text-muted-foreground">Net Pay</span>
                      <span className="font-bold text-foreground">₹{Number(slip.netPay).toLocaleString("en-IN")}</span>
                    </div>
                    
                    <div className="flex justify-end gap-2 pt-2">
                      <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(slip)} disabled={downloadingId === slip.id} className="flex items-center gap-1.5">
                        <Download size={14} /> PDF
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handlePrintPdf(slip)} className="flex items-center gap-1.5">
                        <Printer size={14} /> Print
                      </Button>
                      {slip.paymentStatus === "UNPAID" && (
                        <Button size="sm" className="flex items-center gap-1.5" onClick={() => openPaymentModal(slip)}>
                          <Wallet size={14} /> Pay
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Generate Salary Slip Modal */}
        {isGenerateModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="relative bg-card w-full max-w-2xl rounded-2xl shadow-xl border border-border my-8">
              <button
                onClick={() => setIsGenerateModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>

              <div className="p-6 md:p-8 max-h-[85vh] overflow-y-auto">
                <h2 className="text-2xl font-bold tracking-tight mb-2 flex items-center gap-2">
                  <Receipt className="text-secondary" size={24} /> Create Monthly Payslip
                </h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Select a worker, year, and month. Wage levels are calculated based on work logs.
                </p>

                <form onSubmit={handleGenerateSlip} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5 md:col-span-1">
                      <label className="text-sm font-semibold text-foreground">Select Worker *</label>
                      <select
                        required
                        value={genWorkerId}
                        onChange={(e) => setGenWorkerId(e.target.value)}
                        className="h-11 rounded-lg border border-border bg-background px-3 text-base focus:outline-none cursor-pointer"
                      >
                        <option value="">Select Worker</option>
                        {workers.map(w => (
                          <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-foreground">Salary Year *</label>
                      <select
                        required
                        value={genYear}
                        onChange={(e) => setGenYear(Number(e.target.value))}
                        className="h-11 rounded-lg border border-border bg-background px-3 text-base focus:outline-none cursor-pointer"
                      >
                        <option value="2025">2025</option>
                        <option value="2026">2026</option>
                        <option value="2027">2027</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-foreground">Salary Month *</label>
                      <select
                        required
                        value={genMonth}
                        onChange={(e) => setGenMonth(Number(e.target.value))}
                        className="h-11 rounded-lg border border-border bg-background px-3 text-base focus:outline-none cursor-pointer"
                      >
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i+1} value={i+1}>
                            {new Date(0, i).toLocaleString("en-IN", { month: "long" })}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {genLoading ? (
                    <div className="flex items-center justify-center py-10 bg-muted/20 rounded-xl border border-dashed border-border">
                      <Loader2 className="animate-spin text-secondary mr-2" size={24} />
                      <span className="text-sm text-muted-foreground">Pulling attendance stats...</span>
                    </div>
                  ) : genWorkerId ? (
                    <div className="space-y-4">
                      {/* Attendance Summary */}
                      <div className="p-4 bg-muted/40 rounded-xl border border-border grid grid-cols-3 gap-2 text-center text-xs">
                        <div>
                          <p className="font-semibold text-muted-foreground">Days Present</p>
                          <p className="text-lg font-bold text-emerald-600">{daysPresent}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-muted-foreground">Days Absent</p>
                          <p className="text-lg font-bold text-red-500">{daysAbsent}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-muted-foreground">Overtime Hours</p>
                          <p className="text-lg font-bold text-secondary">{overtimeHours} hrs</p>
                        </div>
                      </div>

                      {/* Wage Calculations */}
                      <div className="space-y-4 border-t border-border pt-4">
                        <h4 className="text-sm font-bold text-foreground">Wage Breakdowns</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            label="Basic Pay / Pro-rated Basic *"
                            type="number"
                            value={basicSalary}
                            onChange={(e) => setBasicSalary(parseFloat(e.target.value) || 0)}
                          />
                          <Input
                            label="Overtime wages (₹)"
                            type="number"
                            value={overtimeAmount}
                            onChange={(e) => setOvertimeAmount(parseFloat(e.target.value) || 0)}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Input
                            label="Allowances (₹)"
                            type="number"
                            value={allowances}
                            onChange={(e) => setAllowances(parseFloat(e.target.value) || 0)}
                          />
                          <Input
                            label="Bonus (₹)"
                            type="number"
                            value={bonus}
                            onChange={(e) => setBonus(parseFloat(e.target.value) || 0)}
                          />
                          <Input
                            label="Deductions (Advance/PF) (₹)"
                            type="number"
                            value={deductions}
                            onChange={(e) => setDeductions(parseFloat(e.target.value) || 0)}
                          />
                        </div>

                        {deductions > 0 && (
                          <Input
                            label="Reason for Deductions *"
                            placeholder="e.g. PF, Loan recovery, Absence penalty"
                            required
                            value={deductionNotes}
                            onChange={(e) => setDeductionNotes(e.target.value)}
                          />
                        )}

                        {/* Net Pay Alert Panel */}
                        <div className="p-4 bg-secondary/10 rounded-xl border border-secondary/30 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                          <div>
                            <p className="text-2xs font-extrabold uppercase tracking-wider text-muted-foreground">Net Pay Words</p>
                            <p className="text-xs font-bold text-foreground mt-0.5">{convertNumberToIndianWords(netPay)}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-2xs font-extrabold uppercase tracking-wider text-muted-foreground">Take-Home Amount</p>
                            <p className="text-xl font-extrabold text-foreground">₹{netPay.toLocaleString("en-IN")}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsGenerateModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={!genWorkerId || genLoading}>
                      Generate Slip
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Record Payment Modal */}
        {isPaymentModalOpen && selectedSlip && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="relative bg-card w-full max-w-md rounded-2xl shadow-xl border border-border">
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>

              <div className="p-6">
                <h3 className="text-xl font-bold text-foreground mb-1 flex items-center gap-1.5">
                  <Coins className="text-emerald-500" size={20} /> Record Bank Settlement
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Settling payslip **{selectedSlip.slipNumber}** for **{selectedSlip.worker?.name}**.
                </p>

                <form onSubmit={handleRecordPaymentSubmit} className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-foreground">Payment Mode *</label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                      className="h-11 w-full rounded-lg border border-border bg-background px-3 text-base focus:outline-none cursor-pointer"
                    >
                      <option value="BANK_TRANSFER">BANK TRANSFER</option>
                      <option value="UPI">UPI</option>
                      <option value="CASH">CASH</option>
                      <option value="CHEQUE">CHEQUE</option>
                    </select>
                  </div>

                  <Input
                    label="Payment Date *"
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                  />

                  <Input
                    label="Transaction ID / Cheque No"
                    placeholder="e.g. UTR1234567890"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                  />

                  <div className="p-4 bg-muted/40 border border-border rounded-xl flex items-center justify-between text-sm">
                    <span className="font-bold text-foreground">Total Net Amount:</span>
                    <span className="font-black text-secondary text-lg">₹{Number(selectedSlip.netPay).toLocaleString("en-IN")}</span>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsPaymentModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      Record Paid
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Navigation>
  );

  function openAddModal() {
    setGenWorkerId("");
    setGenMonth(new Date().getMonth() + 1);
    setGenYear(new Date().getFullYear());
    setDaysPresent(0);
    setDaysAbsent(0);
    setOvertimeHours(0);
    setBasicSalary(0);
    setOvertimeAmount(0);
    setAllowances(0);
    setBonus(0);
    setDeductions(0);
    setDeductionNotes("");
    setIsGenerateModalOpen(true);
  }
}
