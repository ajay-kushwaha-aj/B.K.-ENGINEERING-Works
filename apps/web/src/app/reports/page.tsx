"use client";

import * as React from "react";
import { Navigation } from "@/components/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Download,
  Loader2,
  AlertCircle,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  HardHat,
} from "lucide-react";


interface GSTReport {
  month: number;
  year: number;
  monthLabel: string;
  gstr1: any[];
  hsnSummary: any[];
  monthlyTotals: {
    totalTaxableValue: number;
    totalCgst: number;
    totalSgst: number;
    totalIgst: number;
    totalTax: number;
    totalInvoiceValue: number;
    invoiceCount: number;
  };
}

function formatINR(val: number) {
  return `₹${val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function exportCSV(filename: string, headers: string[], rows: string[][]) {
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const TABS = ["GSTR-1 Summary", "HSN Summary", "Monthly GST", "Payroll Summary"] as const;

export default function ReportsPage() {
  const [report, setReport] = React.useState<GSTReport | null>(null);
  const [payrollReport, setPayrollReport] = React.useState<any | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<(typeof TABS)[number]>("GSTR-1 Summary");
  const [month, setMonth] = React.useState(new Date().getMonth() + 1);
  const [year, setYear] = React.useState(new Date().getFullYear());

  const fetchReport = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (activeTab === "Payroll Summary") {
        const res = await fetch(`/api/reports/payroll?month=${month}&year=${year}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to fetch payroll report");
        setPayrollReport(json);
      } else {
        const res = await fetch(`/api/reports/gst?month=${month}&year=${year}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to fetch GST report");
        setReport(json);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [month, year, activeTab]);

  React.useEffect(() => {
    fetchReport();
  }, [fetchReport]);


  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(year - 1); }
    else setMonth(month - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const handleExportGSTR1 = () => {
    if (!report) return;
    const headers = ["Invoice No", "Date", "Customer", "GSTIN", "Taxable Value", "CGST", "SGST", "IGST", "Total Tax", "Invoice Total"];
    const rows = report.gstr1.map((r) => [
      r.invoiceNumber, new Date(r.invoiceDate).toLocaleDateString("en-IN"), `"${r.customerName}"`,
      r.gstin, r.taxableValue.toFixed(2), r.cgst.toFixed(2), r.sgst.toFixed(2),
      r.igst.toFixed(2), r.totalTax.toFixed(2), r.invoiceTotal.toFixed(2),
    ]);
    exportCSV(`GSTR1_${report.monthLabel.replace(" ", "_")}.csv`, headers, rows);
  };

  const handleExportHSN = () => {
    if (!report) return;
    const headers = ["HSN Code", "Quantity", "Taxable Value", "CGST", "SGST", "IGST", "Total Tax"];
    const rows = report.hsnSummary.map((r) => [
      r.hsnCode, r.qty.toFixed(2), r.taxableValue.toFixed(2),
      r.cgst.toFixed(2), r.sgst.toFixed(2), r.igst.toFixed(2),
      (r.cgst + r.sgst + r.igst).toFixed(2),
    ]);
    exportCSV(`HSN_Summary_${report?.monthLabel?.replace(" ", "_")}.csv`, headers, rows);
  };

  const handleExportPayroll = () => {
    if (!payrollReport) return;
    const headers = ["Slip Number", "Worker Name", "Designation", "Salary Type", "Days Present", "Days Absent", "Basic Salary (Wage)", "Net Pay", "Payment Status", "Payment Date", "Payment Mode"];
    const rows = payrollReport.breakdown.map((r: any) => [
      r.slipNumber, `"${r.workerName}"`, r.designation, r.salaryType, r.daysPresent, r.daysAbsent, r.basicSalary.toFixed(2), r.netPay.toFixed(2), r.paymentStatus, r.paymentDate ? new Date(r.paymentDate).toLocaleDateString("en-IN") : "—", r.paymentMode || "—"
    ]);
    exportCSV(`Payroll_Report_${new Date(year, month - 1).toLocaleDateString("en-IN", { month: "short", year: "numeric" }).replace(" ", "_")}.csv`, headers, rows);
  };


  return (
    <Navigation>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
              <BarChart3 size={28} className="text-secondary" /> GST Reports
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Generate GSTR-1, HSN summary, and monthly GST reports for your CA
            </p>
          </div>
        </div>

        {/* Month Selector */}
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" onClick={prevMonth} className="cursor-pointer">
            <ChevronLeft size={16} />
          </Button>
          <span className="text-lg font-bold text-foreground min-w-[180px] text-center">
            {new Date(year, month - 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
          </span>
          <Button variant="outline" size="sm" onClick={nextMonth} className="cursor-pointer">
            <ChevronRight size={16} />
          </Button>
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

        {!isLoading && (
          <>
            {/* Monthly Totals Summary */}
            {activeTab === "Payroll Summary" && payrollReport ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-xl border border-border/60 bg-card p-4">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Settled Payroll</p>
                  <p className="text-lg font-extrabold text-emerald-600">{formatINR(payrollReport.summary.totalPaid)}</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-card p-4">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Pending Payroll</p>
                  <p className="text-lg font-extrabold text-red-500">{formatINR(payrollReport.summary.totalPending)}</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-card p-4">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Net Pay</p>
                  <p className="text-lg font-extrabold text-secondary">{formatINR(payrollReport.summary.totalNetPay)}</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-card p-4">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Active Slips</p>
                  <p className="text-xl font-extrabold text-foreground">{payrollReport.summary.slipCount}</p>
                </div>
              </div>
            ) : report ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-xl border border-border/60 bg-card p-4">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Invoices</p>
                  <p className="text-xl font-extrabold text-foreground">{report.monthlyTotals.invoiceCount}</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-card p-4">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Taxable Value</p>
                  <p className="text-lg font-extrabold text-foreground">{formatINR(report.monthlyTotals.totalTaxableValue)}</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-card p-4">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Tax</p>
                  <p className="text-lg font-extrabold text-secondary">{formatINR(report.monthlyTotals.totalTax)}</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-card p-4">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Invoice Value</p>
                  <p className="text-lg font-extrabold text-foreground">{formatINR(report.monthlyTotals.totalInvoiceValue)}</p>
                </div>
              </div>
            ) : null}


            {/* Tab Toggle */}
            <div className="flex rounded-lg border border-border overflow-hidden">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer ${
                    activeTab === tab
                      ? "bg-secondary text-slate-900"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* GSTR-1 Summary Tab */}
            {activeTab === "GSTR-1 Summary" && report && (
              <Card className="border-border/60">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base">GSTR-1 Invoice Summary</CardTitle>
                  <Button variant="outline" size="sm" onClick={handleExportGSTR1} className="gap-1.5 cursor-pointer">
                    <Download size={14} /> Export CSV
                  </Button>
                </CardHeader>
                <CardContent>
                  {report.gstr1.length === 0 ? (
                    <div className="text-center py-12">
                      <FileSpreadsheet size={40} className="mx-auto text-muted-foreground/40 mb-3" />
                      <p className="text-sm text-muted-foreground">No invoices found for this period</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-border bg-muted/50">
                            <th className="px-3 py-2 text-xs font-bold uppercase text-muted-foreground">Invoice #</th>
                            <th className="px-3 py-2 text-xs font-bold uppercase text-muted-foreground">Date</th>
                            <th className="px-3 py-2 text-xs font-bold uppercase text-muted-foreground">Customer</th>
                            <th className="px-3 py-2 text-xs font-bold uppercase text-muted-foreground">GSTIN</th>
                            <th className="px-3 py-2 text-xs font-bold uppercase text-muted-foreground text-right">Taxable</th>
                            <th className="px-3 py-2 text-xs font-bold uppercase text-muted-foreground text-right">CGST</th>
                            <th className="px-3 py-2 text-xs font-bold uppercase text-muted-foreground text-right">SGST</th>
                            <th className="px-3 py-2 text-xs font-bold uppercase text-muted-foreground text-right">IGST</th>
                            <th className="px-3 py-2 text-xs font-bold uppercase text-muted-foreground text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {report.gstr1.map((r, i) => (
                            <tr key={i} className="border-b border-border/40 hover:bg-muted/30">
                              <td className="px-3 py-2 font-semibold">{r.invoiceNumber}</td>
                              <td className="px-3 py-2 text-muted-foreground">{new Date(r.invoiceDate).toLocaleDateString("en-IN")}</td>
                              <td className="px-3 py-2">{r.customerName}</td>
                              <td className="px-3 py-2 text-xs font-mono text-muted-foreground">{r.gstin}</td>
                              <td className="px-3 py-2 text-right">{formatINR(r.taxableValue)}</td>
                              <td className="px-3 py-2 text-right">{formatINR(r.cgst)}</td>
                              <td className="px-3 py-2 text-right">{formatINR(r.sgst)}</td>
                              <td className="px-3 py-2 text-right">{formatINR(r.igst)}</td>
                              <td className="px-3 py-2 text-right font-bold">{formatINR(r.invoiceTotal)}</td>
                            </tr>
                          ))}
                          <tr className="bg-muted/60 font-bold border-t-2 border-border">
                            <td className="px-3 py-2" colSpan={4}>TOTAL</td>
                            <td className="px-3 py-2 text-right">{formatINR(report.monthlyTotals.totalTaxableValue)}</td>
                            <td className="px-3 py-2 text-right">{formatINR(report.monthlyTotals.totalCgst)}</td>
                            <td className="px-3 py-2 text-right">{formatINR(report.monthlyTotals.totalSgst)}</td>
                            <td className="px-3 py-2 text-right">{formatINR(report.monthlyTotals.totalIgst)}</td>
                            <td className="px-3 py-2 text-right">{formatINR(report.monthlyTotals.totalInvoiceValue)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* HSN Summary Tab */}
            {activeTab === "HSN Summary" && report && (
              <Card className="border-border/60">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base">HSN-wise Summary</CardTitle>
                  <Button variant="outline" size="sm" onClick={handleExportHSN} className="gap-1.5 cursor-pointer">
                    <Download size={14} /> Export CSV
                  </Button>
                </CardHeader>
                <CardContent>
                  {report.hsnSummary.length === 0 ? (
                    <div className="text-center py-12">
                      <FileSpreadsheet size={40} className="mx-auto text-muted-foreground/40 mb-3" />
                      <p className="text-sm text-muted-foreground">No HSN data for this period</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-border bg-muted/50">
                            <th className="px-3 py-2 text-xs font-bold uppercase text-muted-foreground">HSN Code</th>
                            <th className="px-3 py-2 text-xs font-bold uppercase text-muted-foreground text-right">Qty</th>
                            <th className="px-3 py-2 text-xs font-bold uppercase text-muted-foreground text-right">Taxable Value</th>
                            <th className="px-3 py-2 text-xs font-bold uppercase text-muted-foreground text-right">CGST</th>
                            <th className="px-3 py-2 text-xs font-bold uppercase text-muted-foreground text-right">SGST</th>
                            <th className="px-3 py-2 text-xs font-bold uppercase text-muted-foreground text-right">IGST</th>
                            <th className="px-3 py-2 text-xs font-bold uppercase text-muted-foreground text-right">Total Tax</th>
                          </tr>
                        </thead>
                        <tbody>
                          {report.hsnSummary.map((r, i) => (
                            <tr key={i} className="border-b border-border/40 hover:bg-muted/30">
                              <td className="px-3 py-2 font-mono font-semibold">{r.hsnCode}</td>
                              <td className="px-3 py-2 text-right">{r.qty}</td>
                              <td className="px-3 py-2 text-right">{formatINR(r.taxableValue)}</td>
                              <td className="px-3 py-2 text-right">{formatINR(r.cgst)}</td>
                              <td className="px-3 py-2 text-right">{formatINR(r.sgst)}</td>
                              <td className="px-3 py-2 text-right">{formatINR(r.igst)}</td>
                              <td className="px-3 py-2 text-right font-bold">{formatINR(r.cgst + r.sgst + r.igst)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Monthly GST Tab */}
            {activeTab === "Monthly GST" && report && (
              <Card className="border-border/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Monthly GST Summary — {report.monthLabel}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      {[
                        { label: "Total Taxable Value", value: report.monthlyTotals.totalTaxableValue },
                        { label: "CGST Collected", value: report.monthlyTotals.totalCgst },
                        { label: "SGST Collected", value: report.monthlyTotals.totalSgst },
                        { label: "IGST Collected", value: report.monthlyTotals.totalIgst },
                      ].map((item) => (
                        <div key={item.label} className="flex justify-between items-center p-3 rounded-lg bg-muted/30 border border-border/40">
                          <span className="text-sm text-muted-foreground">{item.label}</span>
                          <span className="text-sm font-bold text-foreground">{formatINR(item.value)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 rounded-lg bg-secondary/10 border border-secondary/30">
                        <span className="text-sm font-semibold text-foreground">Total Tax Liability</span>
                        <span className="text-lg font-extrabold text-secondary">{formatINR(report.monthlyTotals.totalTax)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30 border border-border/40">
                        <span className="text-sm text-muted-foreground">Total Invoice Value</span>
                        <span className="text-sm font-bold">{formatINR(report.monthlyTotals.totalInvoiceValue)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30 border border-border/40">
                        <span className="text-sm text-muted-foreground">Number of Invoices</span>
                        <span className="text-sm font-bold">{report.monthlyTotals.invoiceCount}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payroll Summary Tab */}
            {activeTab === "Payroll Summary" && payrollReport && (
              <Card className="border-border/60">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base">Monthly Worker Payroll Breakdown</CardTitle>
                  <Button variant="outline" size="sm" onClick={handleExportPayroll} className="gap-1.5 cursor-pointer">
                    <Download size={14} /> Export CSV
                  </Button>
                </CardHeader>
                <CardContent>
                  {payrollReport.breakdown.length === 0 ? (
                    <div className="text-center py-12">
                      <HardHat size={40} className="mx-auto text-muted-foreground/40 mb-3" />
                      <p className="text-sm text-muted-foreground">No payroll slips found for this period</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-border bg-muted/50">
                            <th className="px-3 py-2 text-xs font-bold uppercase text-muted-foreground">Slip #</th>
                            <th className="px-3 py-2 text-xs font-bold uppercase text-muted-foreground">Worker Name</th>
                            <th className="px-3 py-2 text-xs font-bold uppercase text-muted-foreground">Designation</th>
                            <th className="px-3 py-2 text-xs font-bold uppercase text-muted-foreground text-center">Salary Type</th>
                            <th className="px-3 py-2 text-xs font-bold uppercase text-muted-foreground text-center">Days Present</th>
                            <th className="px-3 py-2 text-xs font-bold uppercase text-muted-foreground text-right">Basic Pay</th>
                            <th className="px-3 py-2 text-xs font-bold uppercase text-muted-foreground text-right">Net Take-home</th>
                            <th className="px-3 py-2 text-xs font-bold uppercase text-muted-foreground text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payrollReport.breakdown.map((r: any, i: number) => (
                            <tr key={i} className="border-b border-border/40 hover:bg-muted/30">
                              <td className="px-3 py-2 font-semibold font-mono text-xs">{r.slipNumber}</td>
                              <td className="px-3 py-2 font-medium">{r.workerName}</td>
                              <td className="px-3 py-2 text-muted-foreground">{r.designation}</td>
                              <td className="px-3 py-2 text-center text-xs">{r.salaryType}</td>
                              <td className="px-3 py-2 text-center">{r.daysPresent}</td>
                              <td className="px-3 py-2 text-right">{formatINR(r.basicSalary)}</td>
                              <td className="px-3 py-2 text-right font-bold text-secondary">{formatINR(r.netPay)}</td>
                              <td className="px-3 py-2 text-center">
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-2xs font-extrabold ${
                                  r.paymentStatus === "PAID"
                                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                }`}>
                                  {r.paymentStatus}
                                </span>
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-muted/60 font-bold border-t-2 border-border">
                            <td className="px-3 py-2" colSpan={5}>TOTAL</td>
                            <td className="px-3 py-2 text-right">{formatINR(payrollReport.summary.totalBasic)}</td>
                            <td className="px-3 py-2 text-right text-secondary">{formatINR(payrollReport.summary.totalNetPay)}</td>
                            <td></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </Navigation>
  );
}

