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
  FileSpreadsheet
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
    const sessionStr = localStorage.getItem("bk_session");
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        setUserSession(session);
        setUserRole(session.user?.role || "ADMIN");
      } catch (e) {
        setUserRole("ADMIN");
      }
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
   ADMIN DASHBOARD COMPONENT
   ========================================== */
function AdminDashboard({ user }: { user: any }) {
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [pendingIssues, setPendingIssues] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isProcessingApproval, setIsProcessingApproval] = React.useState<string | null>(null);

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
        // Reload dashboard stats and pending list
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

  const kpiCards = data
    ? [
        {
          label: "Today's Sales",
          value: formatINR(data.todaysSales),
          icon: TrendingUp,
          color: "text-white",
          iconBg: "bg-emerald-500 dark:bg-emerald-600",
        },
        {
          label: "Today's Collections",
          value: formatINR(data.todaysCollections),
          icon: Wallet,
          color: "text-white",
          iconBg: "bg-blue-500 dark:bg-blue-600",
        },
        {
          label: "Monthly Sales",
          value: formatINR(data.monthlySales),
          icon: CalendarDays,
          color: "text-white",
          iconBg: "bg-violet-500 dark:bg-violet-600",
        },
        {
          label: "Pending Invoices",
          value: String(data.pendingCount),
          icon: Clock,
          color: "text-white",
          iconBg: "bg-amber-500 dark:bg-amber-600",
        },
        {
          label: "Outstanding Amount",
          value: formatINR(data.outstandingAmount),
          icon: AlertCircle,
          color: "text-white",
          iconBg: "bg-red-500 dark:bg-red-600",
        },
        {
          label: "Monthly Expenses",
          value: formatINR(data.monthlyExpenses || 0),
          icon: Coins,
          color: "text-white",
          iconBg: "bg-indigo-500 dark:bg-indigo-600",
        },
        {
          label: "Employees on Leave",
          value: String(data.workersOnLeaveToday || 0),
          icon: Users,
          color: "text-white",
          iconBg: "bg-teal-500 dark:bg-teal-600",
        },
      ]
    : [];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/invoices/create">
            <Button className="gap-2 cursor-pointer">
              <Plus size={16} /> Create Invoice
            </Button>
          </Link>
          <Link href="/payments">
            <Button variant="outline" className="gap-2 cursor-pointer">
              <Wallet size={16} /> Record Payment
            </Button>
          </Link>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 p-6 text-center">
          <AlertCircle className="mx-auto mb-2 text-red-500" size={28} />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {!isLoading && !error && data && (
        <>
          {/* KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpiCards.map((card, idx) => (
              <Card key={idx} className="relative overflow-hidden border border-border/60 shadow-md hover:shadow-lg transition-all duration-300 group bg-card">
                <CardContent className="p-5 sm:p-6 flex flex-col justify-between h-full min-h-[120px]">
                  {/* Top Row: Heading and Icon */}
                  <div className="flex flex-row items-center justify-between gap-3 w-full">
                    <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 whitespace-normal leading-tight flex-1">
                      {card.label}
                    </p>
                    <div className={`p-2.5 rounded-xl ${card.iconBg} ${card.color} shadow-xs group-hover:scale-105 transition-transform duration-300 flex-shrink-0`}>
                      <card.icon className="w-5.5 h-5.5" />
                    </div>
                  </div>
                  {/* Bottom Row: Numbers / Data */}
                  <div className="mt-4">
                    <div className="text-2xl sm:text-3xl font-black text-foreground tracking-tight break-all">
                      {card.value}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pending Material Requests Widget */}
          {pendingIssues.length > 0 && (
            <Card className="border-none shadow-md overflow-hidden bg-card">
              <CardHeader className="bg-amber-50 dark:bg-amber-950/20 py-4 px-6 border-b border-amber-100 dark:border-amber-950">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="text-amber-600 dark:text-amber-500" size={20} />
                    <CardTitle className="text-lg font-bold text-amber-950 dark:text-amber-300">
                      Pending Material Requests ({pendingIssues.length})
                    </CardTitle>
                  </div>
                  <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">Requires Action</span>
                </div>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-border">
                {pendingIssues.map((issue) => (
                  <div key={issue.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-amber-50/10 dark:bg-amber-950/5">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 font-semibold uppercase">
                          {issue.site?.name || "Boiler Site"}
                        </span>
                        <span className="text-xs font-medium text-muted-foreground">
                          Requested by {issue.createdByName || "Manager"}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-foreground">
                        {issue.product?.name || "Product Name"}{" "}
                        <span className="text-muted-foreground font-normal">
                          x {issue.qty} {issue.product?.unit || "units"}
                        </span>
                      </p>
                      {issue.reason && (
                        <p className="text-xs text-muted-foreground italic">
                          "Reason: {issue.reason}"
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 cursor-pointer"
                        disabled={isProcessingApproval !== null}
                        onClick={() => handleMaterialRequest(issue.id, "APPROVED")}
                      >
                        {isProcessingApproval === issue.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Check size={14} />
                        )}
                        Approve & Issue
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
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

          {/* Charts and Lists Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 border-none shadow-md bg-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold">Revenue & Collections</CardTitle>
                  <p className="text-xs text-muted-foreground">Monthly breakdown of sales vs collections</p>
                </div>
                <BarChart3 className="text-muted-foreground" size={20} />
              </CardHeader>
              <CardContent className="h-80 pb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
                    <Tooltip cursor={{ fill: "rgba(0, 0, 0, 0.05)" }} />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="sales" name="Sales" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="collections" name="Collections" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md bg-card">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Low Stock Warning</CardTitle>
                <p className="text-xs text-muted-foreground">Products reaching critical levels</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.lowStockProducts && data.lowStockProducts.length > 0 ? (
                  data.lowStockProducts.map((p) => (
                    <div key={p.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-border">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-foreground truncate max-w-[150px]">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground">Minimum required: {p.minStock}</p>
                      </div>
                      <span className="text-xs font-extrabold text-red-600 bg-red-100 dark:bg-red-950/20 dark:text-red-400 px-2 py-0.5 rounded-md">
                        {p.stockQty} left
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground py-6 text-center">All stocks are normal levels.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Bottom Stats Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-700 text-white p-5">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                Total Revenue
              </p>
              <p className="text-lg font-extrabold">
                {formatINR(data.totalRevenue)}
              </p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-700 text-white p-5">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                Total Invoices
              </p>
              <p className="text-lg font-extrabold">{data.totalInvoices}</p>
            </div>
            <Link
              href="/invoices/create"
              className="rounded-xl bg-gradient-to-br from-secondary/90 to-secondary text-slate-900 p-5 hover:from-secondary hover:to-amber-500 transition-all group"
            >
              <p className="text-[10px] uppercase tracking-wider text-slate-700 mb-1">
                Quick Action
              </p>
              <p className="text-sm font-extrabold flex items-center gap-1">
                Create Invoice{" "}
                <ArrowRight
                  size={14}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </p>
            </Link>
            <Link
              href="/payments"
              className="rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white p-5 hover:from-blue-500 hover:to-blue-600 transition-all group"
            >
              <p className="text-[10px] uppercase tracking-wider text-blue-200 mb-1">
                Quick Action
              </p>
              <p className="text-sm font-extrabold flex items-center gap-1">
                Record Payment{" "}
                <ArrowRight
                  size={14}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </p>
            </Link>
          </div>
        </>
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

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">
          Site Manager Portal
        </h1>
        <p className="text-xs text-muted-foreground">Logged in: {user?.user?.name || "Manager"}</p>
      </div>

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
