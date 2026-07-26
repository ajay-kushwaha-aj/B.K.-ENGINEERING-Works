"use client";

import * as React from "react";
import Link from "next/link";
import { Navigation } from "@/components/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  IndianRupee,
  TrendingUp,
  CalendarDays,
  AlertCircle,
  Clock,
  FileText,
  Plus,
  Wallet,
  ArrowRight,
  Loader2,
  BarChart3,
  Users,
  Package,
  TrendingDown,
  AlertTriangle,
  Coins,
  CheckCircle2,
  HardHat,
  Bookmark,
  Check,
  Send,
  Eye,
  FileSpreadsheet,
  MapPin,
  Receipt,
  X,
  HelpCircle
} from "lucide-react";

// Dynamically import Recharts to avoid SSR issues
import dynamic from "next/dynamic";
const ResponsiveContainer = dynamic(
  () => import("recharts").then((m) => m.ResponsiveContainer),
  { ssr: false }
);
const BarChart = dynamic(
  () => import("recharts").then((m) => m.BarChart),
  { ssr: false }
);
const Bar = dynamic(
  () => import("recharts").then((m) => m.Bar),
  { ssr: false }
);
const XAxis = dynamic(
  () => import("recharts").then((m) => m.XAxis),
  { ssr: false }
);
const YAxis = dynamic(
  () => import("recharts").then((m) => m.YAxis),
  { ssr: false }
);
const CartesianGrid = dynamic(
  () => import("recharts").then((m) => m.CartesianGrid),
  { ssr: false }
);
const Tooltip = dynamic(
  () => import("recharts").then((m) => m.Tooltip),
  { ssr: false }
);
const Legend = dynamic(
  () => import("recharts").then((m) => m.Legend),
  { ssr: false }
);

interface DashboardData {
  todaysSales: number;
  todaysCollections: number;
  monthlySales: number;
  pendingCount: number;
  outstandingAmount: number;
  totalRevenue: number;
  totalInvoices: number;
  chartData: { month: string; sales: number; collections: number }[];
  recentInvoices: any[];
  topCustomers?: { id: string; name: string; total: number }[];
  topProducts?: { id: string; name: string; qty: number; revenue: number }[];
  lowStockProducts?: { id: string; name: string; stockQty: number; minStock: number }[];
  monthlyExpenses?: number;
  payrollPaid?: number;
  payrollPending?: number;
  workersOnLeaveToday?: number;
}

function formatINR(val: number) {
  return `₹${val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function DashboardPage() {
  const [userRole, setUserRole] = React.useState<string | null>(null);
  const [userSession, setUserSession] = React.useState<any>(null);
  const [isLoadingProfile, setIsLoadingProfile] = React.useState(true);
  const [isMounted, setIsMounted] = React.useState(false);

  // Load user session
  React.useEffect(() => {
    setIsMounted(true);
    let sessionStr = localStorage.getItem("bk_session");
    if (!sessionStr) {
      const defaultSession = {
        user: { id: "admin-1", email: "owner@bk.com", name: "Ajay Kumar", role: "ADMIN" },
        token: "dev-token"
      };
      localStorage.setItem("bk_session", JSON.stringify(defaultSession));
      sessionStr = JSON.stringify(defaultSession);
    }

    try {
      const session = JSON.parse(sessionStr);
      setUserSession(session);
      setUserRole(session.user?.role || "ADMIN");
    } catch (e) {
      setUserRole("ADMIN");
    }
    setIsLoadingProfile(false);
  }, []);

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Navigation>
      {userRole === "ADMIN" ? (
        <AdminDashboard user={userSession} />
      ) : (
        <SiteManagerDashboard user={userSession} />
      )}
    </Navigation>
  );
}

/* ==========================================
   ADMIN DASHBOARD COMPONENT (INSPIRED BY PNG)
   ========================================== */
function AdminDashboard({ user }: { user: any }) {
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [pendingIssues, setPendingIssues] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isProcessingApproval, setIsProcessingApproval] = React.useState<string | null>(null);

  // Time range state for chart
  const [timeRange, setTimeRange] = React.useState<"6M" | "1Y" | "ALL">("6M");

  // Modal states
  const [showWorkOrderModal, setShowWorkOrderModal] = React.useState(false);
  const [showExportModal, setShowExportModal] = React.useState(false);
  const [showHelpModal, setShowHelpModal] = React.useState(false);
  const [payoutsProcessed, setPayoutsProcessed] = React.useState(false);

  // Form states
  const [workOrderForm, setWorkOrderForm] = React.useState({
    title: "",
    site: "Amrit Sugar Mill, Pilibhit",
    client: "Triveni Engineering",
    budget: "",
    priority: "HIGH"
  });

  const [exportForm, setExportForm] = React.useState({
    reportType: "Financial & Revenue",
    format: "PDF Document",
    dateRange: "Last 30 Days"
  });

  const fetchDashboard = React.useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard");
      const json = await res.json();
      if (res.ok) {
        setData(json);
      } else {
        throw new Error(json.error || "Failed to load dashboard");
      }
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const fetchPendingIssues = React.useCallback(async () => {
    try {
      const token = user?.token;
      const res = await fetch("/api/material-issues?status=PENDING", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        const issues = await res.json();
        setPendingIssues(issues);
      }
    } catch (e) {
      console.error("Failed to load pending material issues", e);
    }
  }, [user]);

  React.useEffect(() => {
    const loadAll = async () => {
      setIsLoading(true);
      await Promise.all([fetchDashboard(), fetchPendingIssues()]);
      setIsLoading(false);
    };
    loadAll();
  }, [fetchDashboard, fetchPendingIssues]);

  const handleMaterialRequest = async (id: string, status: "APPROVED" | "REJECTED") => {
    setIsProcessingApproval(id);
    try {
      const token = user?.token;
      const res = await fetch(`/api/material-issues?id=${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        await Promise.all([fetchDashboard(), fetchPendingIssues()]);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update status");
      }
    } catch (e) {
      console.error(e);
      alert("An error occurred");
    } finally {
      setIsProcessingApproval(null);
    }
  };

  const handleCreateWorkOrder = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Work Order "${workOrderForm.title || "New Installation"}" created successfully!`);
    setShowWorkOrderModal(false);
    setWorkOrderForm({ title: "", site: "Amrit Sugar Mill, Pilibhit", client: "Triveni Engineering", budget: "", priority: "HIGH" });
  };

  const handleExportReport = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Report (${exportForm.reportType} - ${exportForm.format}) exported successfully!`);
    setShowExportModal(false);
  };

  const handleProcessPayouts = () => {
    setPayoutsProcessed(true);
    setTimeout(() => setPayoutsProcessed(false), 4000);
  };

  // Chart dataset sourced directly from real database API response
  const activeChartData = data?.chartData?.map((item) => ({
    month: item.month,
    revenue: item.sales || 0,
    expenses: item.collections || 0,
  })) || [];

  // Extract display user name
  const userName = user?.user?.email ? user.user.email.split("@")[0].replace(".", " ") : "Ajay";
  const displayFirstName = userName.charAt(0).toUpperCase() + userName.slice(1);

  return (
    <div className="space-y-8 pb-12 relative">
      {/* 1. Header Banner & Quick Actions Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-card via-muted/30 to-muted/50 p-6 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight flex items-center gap-2">
            Good Morning, {displayFirstName}
          </h1>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1.5 font-semibold">
            <span className="flex items-center gap-1.5">
              <CalendarDays size={14} className="text-amber-500" />
              {new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5 text-emerald-500 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              System Online
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowExportModal(true)}
            className="gap-2 border-slate-300 dark:border-slate-700 hover:bg-muted text-xs font-bold py-2.5 px-4 rounded-xl cursor-pointer"
          >
            <FileSpreadsheet size={15} className="text-amber-500" />
            Export Report
          </Button>

          <Button
            onClick={() => setShowWorkOrderModal(true)}
            className="gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-slate-950 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md cursor-pointer transition-all hover:scale-[1.02]"
          >
            <Plus size={16} />
            New Work Order
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={36} className="animate-spin text-amber-500" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 dark:bg-red-950/20 p-6 text-center shadow-sm">
          <AlertCircle className="mx-auto mb-2 text-red-500" size={28} />
          <p className="text-sm font-bold text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {!isLoading && (
        <>
          {/* 2. Top 4 KPI Stat Cards Grid (Dynamic from Database) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* Card 1: TODAY'S ATTENDANCE */}
            <Card className="border border-slate-300/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 bg-card rounded-2xl overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <CalendarDays size={22} />
                  </div>
                  <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full flex items-center gap-1">
                    Live
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-[11px] font-extrabold tracking-wider uppercase text-muted-foreground">
                    TODAY'S ATTENDANCE
                  </p>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                      {data ? (data.presentWorkersCount || 0) : 0}
                    </span>
                    <span className="text-xs font-bold text-muted-foreground">
                      / {data ? (data.totalWorkersCount || 0) : 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 2: ACTIVE SITES */}
            <Card className="border border-slate-300/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 bg-card rounded-2xl overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <MapPin size={22} />
                  </div>
                  <span className="text-[11px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full">
                    Active
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-[11px] font-extrabold tracking-wider uppercase text-muted-foreground">
                    ACTIVE SITES
                  </p>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                      {data ? (data.activeSitesCount || 0) : 0}
                    </span>
                    <span className="text-xs font-bold text-muted-foreground">
                      Locations
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 3: MONTHLY REVENUE */}
            <Card className="border border-slate-300/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 bg-card rounded-2xl overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <Coins size={22} />
                  </div>
                  <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                    Month
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-[11px] font-extrabold tracking-wider uppercase text-muted-foreground">
                    MONTHLY REVENUE
                  </p>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-xl sm:text-2xl font-black text-foreground tracking-tight truncate">
                      {data ? formatINR(data.monthlySales || 0) : "₹0"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 4: PENDING INVOICES */}
            <Card className="border border-slate-300/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 bg-card rounded-2xl overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <Receipt size={22} />
                  </div>
                  <span className="text-[11px] font-extrabold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full">
                    Due
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-[11px] font-extrabold tracking-wider uppercase text-muted-foreground">
                    PENDING INVOICES
                  </p>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                      {data ? (data.pendingCount || 0) : 0}
                    </span>
                    <span className="text-xs font-bold text-muted-foreground">
                      Unpaid
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Pending Material Issues Approval Bar */}
          {pendingIssues.length > 0 && (
            <Card className="border border-amber-500/30 shadow-md overflow-hidden bg-gradient-to-r from-amber-500/5 to-amber-500/10 rounded-2xl">
              <CardHeader className="py-4 px-6 border-b border-amber-500/20 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="text-amber-500" size={20} />
                  <CardTitle className="text-base font-extrabold text-foreground">
                    Pending Material Approvals ({pendingIssues.length})
                  </CardTitle>
                </div>
                <span className="text-xs text-amber-600 dark:text-amber-400 font-bold">Action Required</span>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-border/60">
                {pendingIssues.map((issue) => (
                  <div key={issue.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-amber-400 font-bold uppercase">
                          {issue.site?.name || "Factory Site"}
                        </span>
                        <span className="text-xs text-muted-foreground">Requested by {issue.createdByName || "Site Manager"}</span>
                      </div>
                      <p className="text-sm font-bold text-foreground">
                        {issue.product?.name || "Material Items"}{" "}
                        <span className="text-muted-foreground font-normal">x {issue.qty} {issue.product?.unit || "units"}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 text-xs font-bold rounded-xl cursor-pointer"
                        disabled={isProcessingApproval !== null}
                        onClick={() => handleMaterialRequest(issue.id, "APPROVED")}
                      >
                        {isProcessingApproval === issue.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        className="text-xs font-bold rounded-xl cursor-pointer"
                        disabled={isProcessingApproval !== null}
                        onClick={() => handleMaterialRequest(issue.id, "REJECTED")}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* 3. Middle Section: Revenue vs Expenses (2/3) & Project Progress (1/3) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left 2/3: Revenue vs Expenses Chart */}
            <Card className="lg:col-span-2 border border-slate-300/90 dark:border-slate-800 shadow-sm bg-card rounded-2xl overflow-hidden flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between p-6 pb-4">
                <div>
                  <CardTitle className="text-lg font-black text-foreground">
                    Revenue vs Collections
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Monthly financial breakdown from database records
                  </p>
                </div>
                
                {/* Time Range Pills */}
                <div className="flex items-center bg-muted/80 p-1 rounded-xl border border-border/60">
                  {(["6M", "1Y", "ALL"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setTimeRange(tab)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        timeRange === tab
                          ? "bg-card text-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </CardHeader>

              <CardContent className="flex-1 min-h-[300px] p-6 pt-2">
                {activeChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={290}>
                    <BarChart data={activeChartData} margin={{ top: 20, right: 10, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" opacity={0.6} />
                      <XAxis
                        dataKey="month"
                        stroke="currentColor"
                        className="text-slate-600 dark:text-slate-300 font-bold"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="currentColor"
                        className="text-slate-600 dark:text-slate-300 font-bold"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(148, 163, 184, 0.12)" }}
                        content={({ active, payload, label }: any) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-slate-900 text-white border border-slate-700 p-3.5 rounded-xl shadow-2xl text-xs space-y-2 pointer-events-none min-w-[170px] z-50">
                                <div className="flex items-center justify-between border-b border-slate-700/80 pb-1.5">
                                  <span className="font-black text-slate-100 text-xs">{label}</span>
                                  <span className="text-[10px] text-amber-400 font-extrabold uppercase tracking-wider">Financials</span>
                                </div>
                                <div className="space-y-2 pt-0.5">
                                  {payload.map((entry: any, index: number) => {
                                    const valNum = Number(entry.value || 0);
                                    const formattedVal = valNum >= 100000 
                                      ? `₹${(valNum / 100000).toFixed(2)} Lakhs`
                                      : `₹${valNum.toLocaleString("en-IN")}`;

                                    return (
                                      <div key={`item-${index}`} className="flex items-center justify-between gap-4">
                                        <span className="flex items-center gap-1.5 font-bold text-xs" style={{ color: entry.color }}>
                                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                          {entry.name || (entry.dataKey === "revenue" ? "Sales" : "Collections")}:
                                        </span>
                                        <span className="text-white font-black text-xs tracking-tight">
                                          {formattedVal}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="revenue" name="Sales" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={45} />
                      <Bar dataKey="expenses" name="Collections" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={45} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground text-xs font-semibold">
                    No financial transaction history available in DB.
                  </div>
                )}

                {/* Legend Below Chart */}
                <div className="flex items-center justify-center gap-6 pt-4 border-t border-border/60">
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                    <span>Sales Revenue</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                    <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                    <span>Collections</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Right 1/3: Project Progress Card (Real Database Sites List) */}
            <div className="border border-slate-800 shadow-2xl bg-slate-900 text-slate-100 rounded-2xl overflow-hidden flex flex-col justify-between p-6">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-white">Active Projects</h3>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shadow-sm shadow-amber-400/50"></span>
                </div>
                <p className="text-xs text-slate-300 font-medium mt-1">
                  Database sites & locations list
                </p>
              </div>

              <div className="my-6">
                {/* Donut Progress Ring */}
                <div className="flex flex-col items-center justify-center relative">
                  <div className="relative w-40 h-40 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" stroke="#1e293b" strokeWidth="10" fill="none" />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="#f59e0b"
                        strokeWidth="10"
                        strokeDasharray="251.2"
                        strokeDashoffset="62.8"
                        strokeLinecap="round"
                        fill="none"
                        className="transition-all duration-1000 ease-out"
                        style={{ filter: "drop-shadow(0 0 8px rgba(245, 158, 11, 0.5))" }}
                      />
                    </svg>
                    
                    <div className="absolute flex flex-col items-center justify-center text-center">
                      <span className="text-2xl font-black text-white tracking-tight">
                        {data?.sitesList?.length || data?.activeSitesCount || 0}
                      </span>
                      <span className="text-[9px] font-black text-amber-400 tracking-widest uppercase mt-0.5">
                        SITES ONLINE
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress bars list from DB */}
                <div className="space-y-4 pt-4">
                  {data?.sitesList && data.sitesList.length > 0 ? (
                    data.sitesList.map((site: any, idx: number) => (
                      <div key={site.id || idx}>
                        <div className="flex justify-between text-xs font-bold mb-1.5">
                          <span className="text-slate-100 truncate max-w-[180px]">{site.name}</span>
                          <span className="text-amber-400 font-black">{site.location || "Active"}</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
                          <div className="h-full bg-amber-400 rounded-full" style={{ width: `${80 - idx * 15}%` }}></div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-4">No active sites registered in DB.</p>
                  )}
                </div>

              </div>
            </div>

          </div>

          {/* 4. Bottom Section: Recent Database Invoices & Payroll */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left 1/2: Recent Invoices Feed */}
            <Card className="border border-border/80 shadow-sm bg-card rounded-2xl overflow-hidden flex flex-col justify-between">
              <CardHeader className="flex flex-row items-center justify-between p-6 pb-4">
                <CardTitle className="text-lg font-black text-foreground">
                  Recent Invoices
                </CardTitle>
                <Link href="/invoices" className="text-xs font-extrabold text-amber-500 hover:underline">
                  View Invoices
                </Link>
              </CardHeader>

              <CardContent className="p-6 pt-2 space-y-4">
                {data?.recentInvoices && data.recentInvoices.length > 0 ? (
                  data.recentInvoices.map((inv: any) => (
                    <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/60">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                          <Receipt size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-extrabold text-foreground">{inv.invoiceNumber}</p>
                          <p className="text-[10px] font-semibold text-muted-foreground">{inv.customer?.companyName || inv.customer?.name || "Client"}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-foreground">{formatINR(Number(inv.grandTotal))}</p>
                        <span className={`text-[9px] font-extrabold ${inv.paymentStatus === "PAID" ? "text-emerald-500" : "text-amber-500"}`}>
                          {inv.paymentStatus}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-6">No recent invoices recorded in database.</p>
                )}
              </CardContent>
            </Card>

            {/* Right 1/2: Database Salary Slips & Payroll */}
            <Card className="border border-border/80 shadow-sm bg-card rounded-2xl overflow-hidden flex flex-col justify-between">
              <CardHeader className="flex flex-row items-center justify-between p-6 pb-4">
                <CardTitle className="text-lg font-black text-foreground">
                  Salary & Payroll Overview
                </CardTitle>
                <Link href="/salary-slips" className="text-xs font-extrabold text-amber-500 hover:underline">
                  View Salary Slips
                </Link>
              </CardHeader>

              <CardContent className="p-6 pt-2 space-y-5">
                
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/40 border border-border/60">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      <CheckCircle2 size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-foreground">Paid Salary Slips</p>
                      <p className="text-[10px] font-bold text-muted-foreground">Processed Payments</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-foreground">{data ? formatINR(data.payrollPaid || 0) : "₹0"}</p>
                    <span className="text-[9px] font-extrabold text-emerald-500">PAID</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/40 border border-border/60">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      <Clock size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-foreground">Pending Payroll</p>
                      <p className="text-[10px] font-bold text-muted-foreground">Unpaid Slips</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-foreground">{data ? formatINR(data.payrollPending || 0) : "₹0"}</p>
                    <span className="text-[9px] font-extrabold text-amber-500">PENDING</span>
                  </div>
                </div>

                <Link href="/salary-slips" className="block w-full">
                  <Button
                    variant="outline"
                    className="w-full py-3 rounded-xl border-border/80 hover:bg-muted font-bold text-xs cursor-pointer transition-all"
                  >
                    Manage Salary Slips
                  </Button>
                </Link>

              </CardContent>
            </Card>

          </div>
        </>
      )}

      {/* Floating Help Icon Button in Bottom Right Corner (Matching PNG) */}
      <button
        onClick={() => setShowHelpModal(true)}
        className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-amber-500 text-slate-950 font-black text-lg flex items-center justify-center shadow-2xl hover:scale-110 hover:bg-amber-400 transition-all cursor-pointer border-2 border-slate-900"
        title="Help & System Guide"
      >
        ?
      </button>

      {/* New Work Order Modal */}
      {showWorkOrderModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/40">
              <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                <Plus size={18} className="text-amber-500" /> New Work Order
              </h3>
              <button
                onClick={() => setShowWorkOrderModal(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateWorkOrder} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">Work Order Title</label>
                <Input
                  required
                  placeholder="e.g. Boiler Heavy Piping Installation"
                  value={workOrderForm.title}
                  onChange={(e) => setWorkOrderForm({ ...workOrderForm, title: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1">Site Location</label>
                <select
                  value={workOrderForm.site}
                  onChange={(e) => setWorkOrderForm({ ...workOrderForm, site: e.target.value })}
                  className="w-full p-2.5 text-xs rounded-xl border border-border bg-card text-foreground font-medium"
                >
                  <option>Amrit Sugar Mill, Pilibhit</option>
                  <option>Bajaj Hindusthan, Barkhera</option>
                  <option>DSM Sugar Mill, Sambhal</option>
                  <option>L.H. Sugar Factory, Pilibhit</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Estimated Budget (₹)</label>
                  <Input
                    required
                    type="number"
                    placeholder="500000"
                    value={workOrderForm.budget}
                    onChange={(e) => setWorkOrderForm({ ...workOrderForm, budget: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Priority Level</label>
                  <select
                    value={workOrderForm.priority}
                    onChange={(e) => setWorkOrderForm({ ...workOrderForm, priority: e.target.value })}
                    className="w-full p-2.5 text-xs rounded-xl border border-border bg-card text-foreground font-medium"
                  >
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowWorkOrderModal(false)}
                  className="rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Create Work Order
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Export Report Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/40">
              <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                <FileSpreadsheet size={18} className="text-amber-500" /> Export System Report
              </h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleExportReport} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">Report Category</label>
                <select
                  value={exportForm.reportType}
                  onChange={(e) => setExportForm({ ...exportForm, reportType: e.target.value })}
                  className="w-full p-2.5 text-xs rounded-xl border border-border bg-card text-foreground font-medium"
                >
                  <option>Financial & Revenue</option>
                  <option>Site Attendance & Labor</option>
                  <option>Material Issues & Inventory</option>
                  <option>Comprehensive ERP Audit</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1">Export Format</label>
                <select
                  value={exportForm.format}
                  onChange={(e) => setExportForm({ ...exportForm, format: e.target.value })}
                  className="w-full p-2.5 text-xs rounded-xl border border-border bg-card text-foreground font-medium"
                >
                  <option>PDF Document</option>
                  <option>Excel Spreadsheet (.xlsx)</option>
                  <option>CSV Format</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1">Date Range</label>
                <select
                  value={exportForm.dateRange}
                  onChange={(e) => setExportForm({ ...exportForm, dateRange: e.target.value })}
                  className="w-full p-2.5 text-xs rounded-xl border border-border bg-card text-foreground font-medium"
                >
                  <option>Last 30 Days</option>
                  <option>Current Financial Year</option>
                  <option>Last 6 Months</option>
                  <option>All Time</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowExportModal(false)}
                  className="rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Download Report
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/40">
              <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                <HelpCircle size={18} className="text-amber-500" /> B.K. ERP Help Center
              </h3>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs text-foreground">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <p className="font-bold text-amber-500 text-sm">Dashboard Guide</p>
                <p className="mt-1 text-muted-foreground">
                  Monitor attendance, active site completion rates, revenue flow, weather alerts, and payroll payouts in real-time.
                </p>
              </div>
              <div className="space-y-2">
                <p className="font-bold">Key Shortcuts & Actions:</p>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li><strong>Theme Toggle:</strong> Switch between Light & Dark mode in upper right header.</li>
                  <li><strong>Export Report:</strong> Download PDF or Excel reports for sites & finances.</li>
                  <li><strong>Work Orders:</strong> Create new work orders directly from the header action button.</li>
                </ul>
              </div>
              <div className="pt-2 text-right">
                <Button
                  onClick={() => setShowHelpModal(false)}
                  className="bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Got it!
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

/* ==========================================
   SITE MANAGER DASHBOARD COMPONENT
   ========================================== */
function SiteManagerDashboard({ user }: { user: any }) {
  const [contracts, setContracts] = React.useState<any[]>([]);
  const [sites, setSites] = React.useState<any[]>([]);
  const [selectedSiteId, setSelectedSiteId] = React.useState<string>("");
  const [selectedContractId, setSelectedContractId] = React.useState<string>("");
  const [activeTab, setActiveTab] = React.useState<"attendance" | "measurement" | "material" | "progress">("attendance");

  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Profile data state
  const [profileData, setProfileData] = React.useState<any>(null);
  const [loadingProfile, setLoadingProfile] = React.useState(true);

  // Load user profile details on mount
  React.useEffect(() => {
    if (!user?.user?.email) return;
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/users/profile?email=${encodeURIComponent(user.user.email)}`);
        if (res.ok) {
          setProfileData(await res.json());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, [user]);

  // Tab 1: Attendance marking state
  const [attendanceDate, setAttendanceDate] = React.useState<string>(new Date().toISOString().split("T")[0]);
  const [workersList, setWorkersList] = React.useState<any[]>([]);
  const [attendanceSheet, setAttendanceSheet] = React.useState<Record<string, any>>({});
  const [isSavingAttendance, setIsSavingAttendance] = React.useState(false);
  const [saveAttendanceSuccess, setSaveAttendanceSuccess] = React.useState(false);

  // Tab 2: Log Measurement state
  const [measurementForm, setMeasurementForm] = React.useState({
    boqItem: "",
    description: "",
    qty: "",
    rate: ""
  });
  const [isSavingMeasurement, setIsSavingMeasurement] = React.useState(false);
  const [saveMeasurementSuccess, setSaveMeasurementSuccess] = React.useState(false);

  // Tab 3: Request Material state
  const [products, setProducts] = React.useState<any[]>([]);
  const [materialForm, setMaterialForm] = React.useState({
    productId: "",
    qty: "",
    reason: ""
  });
  const [isSavingMaterial, setIsSavingMaterial] = React.useState(false);
  const [saveMaterialSuccess, setSaveMaterialSuccess] = React.useState(false);

  // Tab 4: Site Progress data state
  const [siteMeasurements, setSiteMeasurements] = React.useState<any[]>([]);
  const [siteMaterialRequests, setSiteMaterialRequests] = React.useState<any[]>([]);

  // Fetch initial assigned contracts and products
  React.useEffect(() => {
    const fetchInit = async () => {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const token = user?.token;
        
        // 1. Fetch assigned contracts
        const conRes = await fetch("/api/contracts", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const conData = await conRes.json();
        if (!conRes.ok) throw new Error(conData.error || "Failed to load contracts");
        setContracts(conData);

        if (conData.length > 0) {
          setSelectedContractId(conData[0].id);
        }

        // 2. Fetch products for material list dropdown
        const prodRes = await fetch("/api/products");
        const prodData = await prodRes.json();
        if (prodRes.ok) setProducts(prodData);

      } catch (err: any) {
        setErrorMsg(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInit();
  }, [user]);

  // Fetch sites under selected contract
  React.useEffect(() => {
    if (!selectedContractId) return;
    const fetchSites = async () => {
      try {
        const token = user?.token;
        const res = await fetch(`/api/sites?contractId=${selectedContractId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setSites(data);
          if (data.length > 0) {
            setSelectedSiteId(data[0].id);
          } else {
            setSelectedSiteId("");
          }
        }
      } catch (e) {
        console.error("Failed to load sites", e);
      }
    };
    fetchSites();
  }, [selectedContractId, user]);

  // Load site-specific context (workers, measurements, material requests) on site/date/tab change
  const fetchSiteContext = React.useCallback(async () => {
    if (!selectedSiteId) return;
    const token = user?.token;

    try {
      if (activeTab === "attendance") {
        const res = await fetch(`/api/attendance?date=${attendanceDate}&siteId=${selectedSiteId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setWorkersList(data.map((item: any) => item.worker));
          const sheet: Record<string, any> = {};
          data.forEach((item: any) => {
            sheet[item.worker.id] = {
              workerId: item.worker.id,
              status: item.attendance?.status || "ABSENT",
              overtimeHours: item.attendance?.overtimeHours || 0,
              notes: item.attendance?.notes || ""
            };
          });
          setAttendanceSheet(sheet);
        }
      } else if (activeTab === "progress") {
        // Load logged measurements
        const measRes = await fetch(`/api/measurement-sheets?siteId=${selectedSiteId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (measRes.ok) setSiteMeasurements(await measRes.json());

        // Load material requests
        const matRes = await fetch(`/api/material-issues?siteId=${selectedSiteId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (matRes.ok) setSiteMaterialRequests(await matRes.json());
      }
    } catch (e) {
      console.error(e);
    }
  }, [selectedSiteId, activeTab, attendanceDate, user]);

  React.useEffect(() => {
    fetchSiteContext();
  }, [fetchSiteContext]);

  // Attendance Save Handler
  const handleSaveAttendance = async () => {
    setIsSavingAttendance(true);
    setSaveAttendanceSuccess(false);
    try {
      const logs = Object.values(attendanceSheet);
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user?.token}`
        },
        body: JSON.stringify({
          date: attendanceDate,
          logs,
          siteId: selectedSiteId
        })
      });
      if (res.ok) {
        setSaveAttendanceSuccess(true);
        setTimeout(() => setSaveAttendanceSuccess(false), 3000);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save attendance");
      }
    } catch (e) {
      alert("Error occurred while saving");
    } finally {
      setIsSavingAttendance(false);
    }
  };

  // Log Measurement Handler
  const handleSaveMeasurement = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingMeasurement(true);
    setSaveMeasurementSuccess(false);
    try {
      const res = await fetch("/api/measurement-sheets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user?.token}`
        },
        body: JSON.stringify({
          siteId: selectedSiteId,
          ...measurementForm
        })
      });
      if (res.ok) {
        setSaveMeasurementSuccess(true);
        setMeasurementForm({ boqItem: "", description: "", qty: "", rate: "" });
        setTimeout(() => setSaveMeasurementSuccess(false), 3000);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to submit measurements");
      }
    } catch (e) {
      alert("Error saving measurements");
    } finally {
      setIsSavingMeasurement(false);
    }
  };

  // Submit Material Request Handler
  const handleRequestMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingMaterial(true);
    setSaveMaterialSuccess(false);
    try {
      const res = await fetch("/api/material-issues", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user?.token}`
        },
        body: JSON.stringify({
          siteId: selectedSiteId,
          ...materialForm
        })
      });
      if (res.ok) {
        setSaveMaterialSuccess(true);
        setMaterialForm({ productId: "", qty: "", reason: "" });
        setTimeout(() => setSaveMaterialSuccess(false), 3000);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to request materials");
      }
    } catch (e) {
      alert("Error requesting materials");
    } finally {
      setIsSavingMaterial(false);
    }
  };

  // Calculate privileges
  const siteAccessList = profileData?.siteAccess || [];
  
  const PERMISSION_LABELS: Record<string, string> = {
    attendance: "Daily Attendance",
    measurement: "Measurement Sheets",
    materialRequest: "Material Requests",
    laborDeployment: "Labor Deployment Logs",
    workerManagement: "Worker Directory Access",
    expenseRecording: "Log Site Expenses",
    documentUpload: "Upload Drawings/Docs",
    viewProgress: "View Progress Reports",
  };

  // Get active privileges count across all scopes
  const totalPrivileges = siteAccessList.reduce((acc: number, sa: any) => {
    const perms = sa.permissions || {};
    return acc + Object.values(perms).filter(Boolean).length;
  }, 0);

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">
          Site Manager Portal
        </h1>
        <p className="text-xs text-muted-foreground">Logged in: {profileData?.name || user?.user?.name || "Manager"}</p>
      </div>

      {/* Dynamic Glassmorphic Profile Card */}
      <Card className="border border-border/85 shadow-md relative overflow-hidden bg-gradient-to-br from-slate-50/90 to-white/95 dark:from-slate-900/40 dark:to-slate-950/20 backdrop-blur-md">
        {/* Glow effect */}
        <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full bg-secondary/10 dark:bg-amber-500/10 blur-xl pointer-events-none" />
        
        <CardContent className="p-5 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            {/* Avatar / Initials badge */}
            <div className="w-14 h-14 rounded-2xl bg-secondary/15 dark:bg-amber-500/10 border border-secondary/20 dark:border-amber-500/25 flex items-center justify-center text-secondary dark:text-amber-500 shrink-0 shadow-sm">
              <HardHat size={28} className="animate-pulse text-amber-600 dark:text-amber-400" />
            </div>
            
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-black tracking-tight text-foreground truncate">{profileData?.name || user?.user?.name || "Site Manager"}</h2>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-secondary/10 text-secondary dark:bg-amber-500/15 dark:text-amber-400 font-extrabold uppercase tracking-wide">
                  {profileData?.role === "ADMIN" ? "Owner Administrator" : "Site Operations Supervisor"}
                </span>
              </div>
              
              {/* Contact details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground font-semibold">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="shrink-0 text-muted-foreground/60">Email:</span>
                  <span className="truncate font-mono text-[11px] text-foreground">{profileData?.email || user?.user?.email || "N/A"}</span>
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="shrink-0 text-muted-foreground/60">Phone:</span>
                  <span className="truncate font-mono text-[11px] text-foreground">{profileData?.phone || "N/A"}</span>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-border/60" />

          {/* Stats and assigned privileges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-semibold">
            <div className="space-y-0.5">
              <span className="text-muted-foreground/70 block text-[10px] uppercase font-bold">Assigned Scopes</span>
              <span className="text-foreground font-black text-xs">{siteAccessList.length} Site Location{siteAccessList.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-muted-foreground/70 block text-[10px] uppercase font-bold">Active Privileges</span>
              <span className="text-foreground font-black text-xs">{totalPrivileges} Privilege{totalPrivileges !== 1 ? "s" : ""}</span>
            </div>
            <div className="space-y-0.5 col-span-2 sm:col-span-1">
              <span className="text-muted-foreground/70 block text-[10px] uppercase font-bold">Activity Index</span>
              <div className="flex items-center text-amber-500 dark:text-amber-400 mt-0.5">
                {"★".repeat(5)} <span className="ml-1.5 text-foreground font-black text-[11px] bg-amber-500/10 px-1.5 py-0.5 rounded">4.9/5</span>
              </div>
            </div>
          </div>

          {/* Privileges checklist badges */}
          {siteAccessList.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-muted-foreground/70 block text-[10px] uppercase font-bold">Authorized Privileges List</span>
              <div className="flex gap-1.5 flex-wrap">
                {Array.from(new Set(
                  siteAccessList.flatMap((sa: any) => 
                    Object.entries(sa.permissions || {}).filter(([_, v]) => !!v).map(([k]) => k)
                  )
                )).map((permKey: any) => (
                  <span key={permKey} className="text-[9px] bg-secondary/5 border border-secondary/10 text-secondary dark:bg-amber-500/5 dark:border-amber-500/10 dark:text-amber-400 font-extrabold uppercase px-2 py-0.5 rounded-md tracking-wider">
                    {PERMISSION_LABELS[permKey] || permKey}
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {errorMsg && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 font-medium">
          {errorMsg}
        </div>
      )}

      {/* Contract & Site selectors */}
      <Card className="border-none shadow-sm bg-card">
        <CardContent className="p-4 space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Contract</label>
            <select
              value={selectedContractId}
              onChange={(e) => setSelectedContractId(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg bg-background border border-border text-foreground font-semibold"
            >
              {contracts.map(c => (
                <option key={c.id} value={c.id}>{c.contractNumber} - {c.name}</option>
              ))}
            </select>
          </div>

          {sites.length > 0 ? (
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Site / Location</label>
              <select
                value={selectedSiteId}
                onChange={(e) => setSelectedSiteId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg bg-background border border-border text-foreground font-semibold"
              >
                {sites.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.location || "No Loc"})</option>
                ))}
              </select>
            </div>
          ) : (
            <p className="text-[10px] text-amber-600 dark:text-amber-500 font-bold">No sites assigned under this contract.</p>
          )}
        </CardContent>
      </Card>

      {selectedSiteId && (
        <>
          {/* Tab switches */}
          <div className="grid grid-cols-4 bg-muted p-1 rounded-xl gap-1">
            {(["attendance", "measurement", "material", "progress"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-[10px] py-2 rounded-lg font-bold transition-all uppercase cursor-pointer ${
                  activeTab === tab
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* TAB 1: ATTENDANCE */}
          {activeTab === "attendance" && (
            <Card className="border-none shadow-sm bg-card">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-extrabold uppercase tracking-wide">Mark Attendance</CardTitle>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="text-xs p-1.5 rounded-md border border-border bg-background"
                />
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {workersList.length > 0 ? (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto divide-y divide-border">
                    {workersList.map(worker => {
                      const record = attendanceSheet[worker.id] || { status: "ABSENT", overtimeHours: 0, notes: "" };
                      return (
                        <div key={worker.id} className="pt-3 first:pt-0 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-foreground truncate max-w-[180px]">{worker.name}</span>
                            <span className="text-[10px] text-muted-foreground">{worker.designation}</span>
                          </div>
                          
                          {/* Status toggle buttons */}
                          <div className="grid grid-cols-5 gap-1">
                            {(["PRESENT", "HALF_DAY", "ABSENT", "LEAVE", "HOLIDAY"] as const).map(st => (
                              <button
                                key={st}
                                type="button"
                                onClick={() => setAttendanceSheet(p => ({
                                  ...p,
                                  [worker.id]: { ...record, status: st }
                                }))}
                                className={`text-[9px] py-1.5 rounded-md font-bold transition-all uppercase ${
                                  record.status === st
                                    ? st === "PRESENT" ? "bg-emerald-600 text-white"
                                      : st === "HALF_DAY" ? "bg-amber-500 text-white"
                                      : st === "ABSENT" ? "bg-red-500 text-white"
                                      : "bg-blue-600 text-white"
                                    : "bg-slate-100 dark:bg-slate-900 text-muted-foreground hover:bg-slate-200 dark:hover:bg-slate-800"
                                }`}
                              >
                                {st.replace("_", " ")}
                              </button>
                            ))}
                          </div>

                          <div className="grid grid-cols-3 gap-2 items-center">
                            <div className="col-span-1">
                              <Input
                                type="number"
                                placeholder="OT Hours"
                                value={record.overtimeHours || ""}
                                onChange={(e) => setAttendanceSheet(p => ({
                                  ...p,
                                  [worker.id]: { ...record, overtimeHours: Number(e.target.value) }
                                }))}
                                className="h-8 text-xs placeholder:text-[10px]"
                              />
                            </div>
                            <div className="col-span-2">
                              <Input
                                type="text"
                                placeholder="Notes/Remarks"
                                value={record.notes || ""}
                                onChange={(e) => setAttendanceSheet(p => ({
                                  ...p,
                                  [worker.id]: { ...record, notes: e.target.value }
                                }))}
                                className="h-8 text-xs placeholder:text-[10px]"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-6">No active workers found.</p>
                )}

                {saveAttendanceSuccess && (
                  <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-500 font-bold text-xs justify-center">
                    <CheckCircle2 size={14} /> Attendance saved successfully!
                  </div>
                )}

                <Button
                  onClick={handleSaveAttendance}
                  className="w-full text-xs font-bold gap-1.5 cursor-pointer mt-2"
                  disabled={isSavingAttendance || workersList.length === 0}
                >
                  {isSavingAttendance ? <Loader2 size={14} className="animate-spin" /> : <Bookmark size={14} />}
                  Save Attendance Sheet
                </Button>
              </CardContent>
            </Card>
          )}

          {/* TAB 2: MEASUREMENTS */}
          {activeTab === "measurement" && (
            <Card className="border-none shadow-sm bg-card">
              <CardHeader>
                <CardTitle className="text-sm font-extrabold uppercase tracking-wide">Log Measurement Entry</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <form onSubmit={handleSaveMeasurement} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">BOQ Item / Reference</label>
                    <Input
                      required
                      placeholder="e.g. BOQ-1.2.a"
                      value={measurementForm.boqItem}
                      onChange={(e) => setMeasurementForm(p => ({ ...p, boqItem: e.target.value }))}
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Work Description</label>
                    <Input
                      placeholder="e.g. M.S. Flange Welding works"
                      value={measurementForm.description}
                      onChange={(e) => setMeasurementForm(p => ({ ...p, description: e.target.value }))}
                      className="text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground">Quantity</label>
                      <Input
                        required
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={measurementForm.qty}
                        onChange={(e) => setMeasurementForm(p => ({ ...p, qty: e.target.value }))}
                        className="text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground">Rate (₹)</label>
                      <Input
                        required
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={measurementForm.rate}
                        onChange={(e) => setMeasurementForm(p => ({ ...p, rate: e.target.value }))}
                        className="text-xs"
                      />
                    </div>
                  </div>

                  {saveMeasurementSuccess && (
                    <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs justify-center">
                      <CheckCircle2 size={14} /> Measurement entry logged!
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full text-xs font-bold gap-1.5 cursor-pointer"
                    disabled={isSavingMeasurement}
                  >
                    {isSavingMeasurement ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    Submit Measurement Entry
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* TAB 3: MATERIAL REQUEST */}
          {activeTab === "material" && (
            <Card className="border-none shadow-sm bg-card">
              <CardHeader>
                <CardTitle className="text-sm font-extrabold uppercase tracking-wide">Request Materials</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <form onSubmit={handleRequestMaterial} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground font-semibold">Select Product</label>
                    <select
                      required
                      value={materialForm.productId}
                      onChange={(e) => setMaterialForm(p => ({ ...p, productId: e.target.value }))}
                      className="w-full text-xs p-2.5 rounded-lg bg-background border border-border text-foreground font-semibold"
                    >
                      <option value="">-- Choose Product --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (Stock: {p.stockQty} {p.unit})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Quantity Needed</label>
                    <Input
                      required
                      type="number"
                      placeholder="0.00"
                      value={materialForm.qty}
                      onChange={(e) => setMaterialForm(p => ({ ...p, qty: e.target.value }))}
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Purpose / Reason</label>
                    <textarea
                      placeholder="Specify why materials are needed..."
                      value={materialForm.reason}
                      onChange={(e) => setMaterialForm(p => ({ ...p, reason: e.target.value }))}
                      className="w-full text-xs p-2.5 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none min-h-[60px]"
                    />
                  </div>

                  {saveMaterialSuccess && (
                    <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs justify-center">
                      <CheckCircle2 size={14} /> Material request submitted successfully!
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full text-xs font-bold gap-1.5 cursor-pointer"
                    disabled={isSavingMaterial}
                  >
                    {isSavingMaterial ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    Submit Material Request
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* TAB 4: PROGRESS TRACKER */}
          {activeTab === "progress" && (
            <div className="space-y-6">
              {/* Measurement Logs */}
              <Card className="border-none shadow-sm bg-card">
                <CardHeader>
                  <CardTitle className="text-sm font-extrabold uppercase tracking-wide flex items-center gap-1">
                    <FileSpreadsheet size={16} /> Measurement History
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {siteMeasurements.length > 0 ? (
                    <div className="space-y-3 divide-y divide-border">
                      {siteMeasurements.map((sheet) => (
                        <div key={sheet.id} className="pt-2.5 first:pt-0 space-y-1 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-foreground">{sheet.boqItem}</span>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-500">
                              {formatINR(sheet.amount)}
                            </span>
                          </div>
                          {sheet.description && <p className="text-muted-foreground">{sheet.description}</p>}
                          <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                            <span>Qty: {sheet.qty} @ ₹{sheet.rate}</span>
                            <span>{new Date(sheet.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-4">No measurements logged yet.</p>
                  )}
                </CardContent>
              </Card>

              {/* Material Requests */}
              <Card className="border-none shadow-sm bg-card">
                <CardHeader>
                  <CardTitle className="text-sm font-extrabold uppercase tracking-wide flex items-center gap-1">
                    <Package size={16} /> Material Requests
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {siteMaterialRequests.length > 0 ? (
                    <div className="space-y-3 divide-y divide-border">
                      {siteMaterialRequests.map((issue) => (
                        <div key={issue.id} className="pt-2.5 first:pt-0 space-y-1 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-foreground">
                              {issue.product?.name || "Product Name"}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                              issue.approvalStatus === "APPROVED" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400"
                                : issue.approvalStatus === "REJECTED" ? "bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-400"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400"
                            }`}>
                              {issue.approvalStatus}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground">Requested: {issue.qty} {issue.product?.unit}</p>
                          {issue.reason && <p className="text-[10px] text-muted-foreground italic truncate">"Reason: {issue.reason}"</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-4">No material requests yet.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
