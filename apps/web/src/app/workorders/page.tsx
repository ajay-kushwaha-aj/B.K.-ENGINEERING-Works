"use client";

import * as React from "react";
import { Navigation } from "@/components/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Briefcase,
  Plus,
  ArrowRight,
  Loader2,
  Calendar,
  DollarSign,
  TrendingUp,
} from "lucide-react";

interface Customer {
  id: string;
  name: string;
}

interface WorkOrder {
  id: string;
  woNumber: string;
  customerId: string;
  siteName: string;
  location: string | null;
  startDate: string | null;
  completionDate: string | null;
  projectManager: string | null;
  description: string | null;
  status: "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  estimatedCost: number | null;
  actualCost: number | null;
  customer?: Customer;
}

const STATUS_BADGE: Record<string, string> = {
  OPEN: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  COMPLETED: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

function formatINR(val: number | null) {
  if (val === null) return "—";
  return `₹${val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = React.useState<WorkOrder[]>([]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  // New WorkOrder Form State
  const [selectedCustomerId, setSelectedCustomerId] = React.useState("");
  const [siteName, setSiteName] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [completionDate, setCompletionDate] = React.useState("");
  const [projectManager, setProjectManager] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [estimatedCost, setEstimatedCost] = React.useState<number | "">("");

  const fetchWorkOrders = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [woRes, custRes] = await Promise.all([
        fetch("/api/workorders"),
        fetch("/api/customers"),
      ]);
      const [woJson, custJson] = await Promise.all([
        woRes.json(),
        custRes.json(),
      ]);
      setWorkOrders(woJson);
      setCustomers(custJson);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchWorkOrders();
  }, [fetchWorkOrders]);

  const handleCreateWO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !siteName) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/workorders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          siteName,
          location: location || null,
          startDate: startDate || null,
          completionDate: completionDate || null,
          projectManager: projectManager || null,
          description: description || null,
          estimatedCost: estimatedCost ? Number(estimatedCost) : null,
        }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        // Clear Form State
        setSiteName("");
        setLocation("");
        setStartDate("");
        setCompletionDate("");
        setProjectManager("");
        setDescription("");
        setEstimatedCost("");
        fetchWorkOrders();
      } else {
        const json = await res.json();
        alert(json.error || "Creation failed");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string, actualCostVal?: number) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/workorders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          ...(actualCostVal !== undefined && { actualCost: actualCostVal }),
        }),
      });
      if (res.ok) {
        fetchWorkOrders();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const statusNext: Record<string, string | null> = {
    OPEN: "IN_PROGRESS",
    IN_PROGRESS: "COMPLETED",
    COMPLETED: null,
    CANCELLED: null,
  };

  return (
    <Navigation>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
              <Briefcase size={28} className="text-secondary" /> Work Orders & Projects
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track manufacturing job orders, site statuses, and estimated vs actual project costs
            </p>
          </div>
          <Button className="gap-1.5 cursor-pointer" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> New Work Order
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-muted-foreground" />
          </div>
        ) : workOrders.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-2xl bg-card/50">
            <Briefcase size={48} className="mx-auto text-muted-foreground/30 mb-3" />
            <h3 className="text-lg font-bold text-foreground">No work orders recorded</h3>
            <p className="text-sm text-muted-foreground mt-1">Record your first site job order.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workOrders.map((wo) => {
              const variance =
                wo.actualCost && wo.estimatedCost
                  ? Number(wo.actualCost) - Number(wo.estimatedCost)
                  : null;
              return (
                <Card key={wo.id} className="border-border/60 flex flex-col justify-between">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono font-bold text-muted-foreground">{wo.woNumber}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${STATUS_BADGE[wo.status]}`}>
                        {wo.status}
                      </span>
                    </div>
                    <CardTitle className="text-base text-foreground font-bold">{wo.siteName}</CardTitle>
                    <p className="text-xs text-muted-foreground">{wo.customer?.name || "Unknown Customer"}</p>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs flex-grow">
                    {wo.location && (
                      <p className="text-muted-foreground">Location: <span className="font-semibold text-foreground">{wo.location}</span></p>
                    )}
                    {wo.projectManager && (
                      <p className="text-muted-foreground">Manager: <span className="font-semibold text-foreground">{wo.projectManager}</span></p>
                    )}
                    <div className="grid grid-cols-2 gap-2 border-t border-border/40 pt-2 text-[11px]">
                      <div>
                        <p className="text-[10px] uppercase text-muted-foreground">Est. Cost</p>
                        <p className="font-bold">{formatINR(wo.estimatedCost)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase text-muted-foreground">Actual Cost</p>
                        <p className="font-bold">{formatINR(wo.actualCost)}</p>
                      </div>
                    </div>

                    {variance !== null && (
                      <p className={`text-[10px] font-bold ${variance > 0 ? "text-red-500" : "text-green-600"}`}>
                        Cost Delta: {variance > 0 ? "+" : ""}{formatINR(variance)}
                      </p>
                    )}
                  </CardContent>
                  <CardFooter className="pt-2 border-t border-border/40 flex items-center justify-between gap-2">
                    {statusNext[wo.status] ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-xs h-8 cursor-pointer gap-1.5"
                        disabled={actionLoading === wo.id}
                        onClick={() => {
                          if (statusNext[wo.status] === "COMPLETED") {
                            const costPrompt = prompt("Enter actual final cost (optional):", String(wo.estimatedCost || 0));
                            handleUpdateStatus(wo.id, "COMPLETED", costPrompt ? Number(costPrompt) : undefined);
                          } else {
                            handleUpdateStatus(wo.id, statusNext[wo.status]!);
                          }
                        }}
                      >
                        {actionLoading === wo.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <>
                            Progress to {statusNext[wo.status]} <ArrowRight size={12} />
                          </>
                        )}
                      </Button>
                    ) : (
                      <span className="text-[10px] text-muted-foreground italic w-full text-center">Lifecycle Completed</span>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}

        {/* New WorkOrder Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border text-foreground rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
              <h2 className="text-lg font-bold tracking-tight mb-4">Create Site Work Order</h2>
              <form onSubmit={handleCreateWO} className="space-y-4 text-sm">
                <div className="space-y-1.5">
                  <label className="font-semibold">Customer</label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground cursor-pointer"
                    required
                  >
                    <option value="">— Select Customer —</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold">Site Project Name</label>
                  <Input
                    placeholder="e.g. Godavari Pipeline Phase III Structure"
                    value={siteName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSiteName(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold">Location</label>
                    <Input
                      placeholder="e.g. Bagalkot"
                      value={location}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocation(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold">Project Manager</label>
                    <Input
                      placeholder="e.g. Rajesh Kumar"
                      value={projectManager}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProjectManager(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold">Start Date</label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold">Estimated Cost</label>
                    <Input
                      type="number"
                      placeholder="e.g. 500000"
                      value={estimatedCost}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEstimatedCost(e.target.value ? Number(e.target.value) : "")}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)} className="cursor-pointer">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="cursor-pointer">
                    {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : "Launch Project"}
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
