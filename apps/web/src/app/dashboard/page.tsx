"use client";

import * as React from "react";
import Link from "next/link";
import { Navigation } from "@/components/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
    const fetchDashboard = async () => {
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
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

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
          icon: TrendingDown,
          color: "text-white",
          iconBg: "bg-rose-500 dark:bg-rose-600",
        },
        {
          label: "This Month's Payroll",
          value: formatINR((data.payrollPaid || 0) + (data.payrollPending || 0)),
          description: `Paid: ₹${Math.round(data.payrollPaid || 0)} | Pending: ₹${Math.round(data.payrollPending || 0)}`,
          icon: Coins,
          color: "text-white",
          iconBg: "bg-indigo-500 dark:bg-indigo-600",
        },
        {
          label: "Workers on Leave",
          value: String(data.workersOnLeaveToday || 0),
          icon: Users,
          color: "text-white",
          iconBg: "bg-teal-500 dark:bg-teal-600",
        },
      ]
    : [];


  return (
    <Navigation>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
              Dashboard
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

        {data && (
          <>
            {/* Low Stock Alerts Banner */}
            {data.lowStockProducts && data.lowStockProducts.length > 0 && (
              <Link href="/inventory">
                <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 p-4 mb-6 flex items-center gap-3 hover:bg-red-100/50 transition-colors">
                  <AlertTriangle className="text-red-500 shrink-0" size={24} />
                  <div>
                    <p className="font-bold text-red-950 dark:text-red-300">Low Stock Notice</p>
                    <p className="text-xs text-red-700 dark:text-red-400">
                      There are {data.lowStockProducts.length} product(s) below their minimum stock levels. Click here to adjust stock.
                    </p>
                  </div>
                </div>
              </Link>
            )}

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {kpiCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.label}
                    className="rounded-xl border border-border bg-card p-4 md:p-5 flex items-center justify-between transition-all hover:shadow-md hover:scale-[1.01]"
                  >
                    <div className="space-y-1 truncate pr-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block truncate">
                        {card.label}
                      </span>
                      <p className="text-xl md:text-2xl font-black text-foreground tracking-tight leading-tight">
                        {card.value}
                      </p>
                      {card.description && (
                        <p className="text-[10px] text-muted-foreground/80 font-medium leading-normal mt-1 block">
                          {card.description}
                        </p>
                      )}
                    </div>
                    <div className={`p-3 rounded-xl ${card.iconBg} ${card.color} shrink-0`}>
                      <Icon size={20} />
                    </div>
                  </div>
                );
              })}
            </div>


            {/* Charts + Recent Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
              {/* Monthly Sales Chart */}
              <Card className="lg:col-span-2 border-border/60">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BarChart3 size={18} className="text-secondary" />
                    Monthly Sales & Collections
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isMounted && data.chartData.length > 0 ? (
                    <div className="h-[280px] md:h-[320px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.chartData} barGap={4}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} />
                          <XAxis
                            dataKey="month"
                            tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v: number) =>
                              v >= 100000
                                ? `₹${(v / 100000).toFixed(1)}L`
                                : v >= 1000
                                ? `₹${(v / 1000).toFixed(0)}K`
                                : `₹${v}`
                            }
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "var(--color-card)",
                              border: "1px solid var(--color-border)",
                              borderRadius: "8px",
                              fontSize: "12px",
                            }}
                            formatter={(value: any, name: any) => [
                              formatINR(Number(value || 0)),
                              name === "sales" ? "Sales" : "Collections",
                            ]}
                          />
                          <Legend
                            wrapperStyle={{ fontSize: "11px" }}
                            formatter={(value: string) =>
                              value === "sales" ? "Sales" : "Collections"
                            }
                          />
                          <Bar
                            dataKey="sales"
                            fill="#D4AF37"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={40}
                          />
                          <Bar
                            dataKey="collections"
                            fill="#3b82f6"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={40}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
                      {isMounted ? "No chart data available yet" : "Loading chart..."}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Invoices */}
              <Card className="border-border/60">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span className="flex items-center gap-2">
                      <FileText size={18} className="text-secondary" />
                      Recent Invoices
                    </span>
                    <Link
                      href="/invoices"
                      className="text-xs text-muted-foreground hover:text-secondary flex items-center gap-1"
                    >
                      View All <ArrowRight size={12} />
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {data.recentInvoices.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText size={32} className="mx-auto text-muted-foreground/40 mb-2" />
                      <p className="text-sm text-muted-foreground">No invoices yet</p>
                      <Link href="/invoices/create">
                        <Button variant="outline" size="sm" className="mt-3 gap-1 cursor-pointer">
                          <Plus size={14} /> Create First Invoice
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    data.recentInvoices.map((inv) => (
                      <div
                        key={inv.id}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border/60"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {inv.invoiceNumber}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {inv.customer?.companyName || inv.customer?.name || "—"}
                          </p>
                        </div>
                        <div className="text-right ml-3 flex-shrink-0">
                          <p className="text-sm font-bold text-foreground">
                            {formatINR(Number(inv.grandTotal))}
                          </p>
                          <span
                            className={`inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                              inv.paymentStatus === "PAID"
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                                : inv.paymentStatus === "PARTIAL"
                                ? "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
                                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                            }`}
                          >
                            {inv.paymentStatus}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Top Customers Widget */}
              {data.topCustomers && data.topCustomers.length > 0 && (
                <Card className="border-border/60">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold text-muted-foreground flex items-center gap-1.5">
                      <Users size={14} className="text-secondary" /> Top Customers
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {data.topCustomers.map((c, idx) => {
                      const maxVal = data.topCustomers![0]?.total || 1;
                      const pct = Math.round((c.total / maxVal) * 100);
                      return (
                        <div key={c.id} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-foreground truncate max-w-[140px]">
                              {idx + 1}. {c.name}
                            </span>
                            <span className="font-bold text-foreground">{formatINR(c.total)}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-secondary to-amber-400" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {/* Top Products Widget */}
              {data.topProducts && data.topProducts.length > 0 && (
                <Card className="border-border/60">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold text-muted-foreground flex items-center gap-1.5">
                      <Package size={14} className="text-secondary" /> Top Products
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {data.topProducts.map((p, idx) => {
                      const maxVal = data.topProducts![0]?.revenue || 1;
                      const pct = Math.round((p.revenue / maxVal) * 100);
                      return (
                        <div key={p.id} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-foreground truncate max-w-[140px]">
                              {idx + 1}. {p.name}
                            </span>
                            <span className="font-bold text-foreground">{formatINR(p.revenue)} ({p.qty} units)</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}
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
    </Navigation>
  );
}
