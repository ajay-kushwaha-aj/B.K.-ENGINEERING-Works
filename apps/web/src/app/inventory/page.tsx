"use client";

import * as React from "react";
import { Navigation } from "@/components/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Package,
  Plus,
  ArrowDown,
  ArrowUp,
  AlertTriangle,
  History,
  Loader2,
  RefreshCw,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string | null;
  hsnCode: string | null;
  gstPercent: number;
  unit: string;
  price: number;
  stockQty: number;
  minStock: number;
}

interface StockMovement {
  id: string;
  productId: string;
  type: "IN" | "OUT" | "ADJUSTMENT" | "OPENING";
  qty: number;
  reason: string | null;
  createdAt: string;
}

function formatNumber(val: number) {
  return val.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export default function InventoryPage() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = React.useState<string>("");
  const [movements, setMovements] = React.useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isMovementsLoading, setIsMovementsLoading] = React.useState(false);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  // Form State
  const [adjustType, setAdjustType] = React.useState<"IN" | "OUT" | "ADJUSTMENT">("ADJUSTMENT");
  const [adjustQty, setAdjustQty] = React.useState<number>(0);
  const [adjustReason, setAdjustReason] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const fetchInventory = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/products");
      const json = await res.json();
      setProducts(Array.isArray(json) ? json : json.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const loadMovements = async (pId: string) => {
    if (!pId) return;
    setIsMovementsLoading(true);
    try {
      const res = await fetch(`/api/products/${pId}/stock`);
      const json = await res.json();
      setMovements(json);
    } catch (err) {
      console.error(err);
    } finally {
      setIsMovementsLoading(false);
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || adjustQty <= 0) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/products/${selectedProductId}/stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: adjustType,
          qty: adjustType === "OUT" ? -adjustQty : adjustQty,
          reason: adjustReason,
        }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setAdjustQty(0);
        setAdjustReason("");
        fetchInventory();
        loadMovements(selectedProductId);
      } else {
        const json = await res.json();
        alert(json.error || "Adjustment failed");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const lowStockCount = products.filter((p) => Number(p.stockQty) < Number(p.minStock)).length;

  return (
    <Navigation>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
              <Package size={28} className="text-secondary" /> Stock Inventory
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Adjust stock counts, analyze low stocks, and monitor inventory movements
            </p>
          </div>
          {products.length > 0 && (
            <Button
              className="gap-1.5 cursor-pointer"
              onClick={() => {
                setSelectedProductId(products[0]?.id || "");
                setIsModalOpen(true);
              }}
            >
              <RefreshCw size={16} /> Adjust Stock
            </Button>
          )}
        </div>

        {/* Alerts Banner */}
        {lowStockCount > 0 && (
          <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 p-4 flex items-center gap-3">
            <AlertTriangle className="text-red-500 shrink-0" size={24} />
            <div>
              <p className="font-bold text-red-900 dark:text-red-300">Low Stock Warning</p>
              <p className="text-xs text-red-700 dark:text-red-400">
                There are {lowStockCount} product(s) currently below their defined minimum threshold level.
              </p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Products Inventory List */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-1.5">
                    <Package size={16} className="text-secondary" /> Product Stock Ledger
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/50">
                          <th className="px-4 py-3 text-xs font-bold uppercase text-muted-foreground">Product</th>
                          <th className="px-4 py-3 text-xs font-bold uppercase text-muted-foreground text-center">Unit</th>
                          <th className="px-4 py-3 text-xs font-bold uppercase text-muted-foreground text-right">Min Stock</th>
                          <th className="px-4 py-3 text-xs font-bold uppercase text-muted-foreground text-right">Current Stock</th>
                          <th className="px-4 py-3 text-xs font-bold uppercase text-muted-foreground text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((p) => {
                          const isLow = Number(p.stockQty) < Number(p.minStock);
                          return (
                            <tr
                              key={p.id}
                              onClick={() => {
                                setSelectedProductId(p.id);
                                loadMovements(p.id);
                              }}
                              className={`border-b border-border/40 hover:bg-muted/30 transition-colors cursor-pointer ${
                                selectedProductId === p.id ? "bg-muted/50 font-medium" : ""
                              }`}
                            >
                              <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                              <td className="px-4 py-3 text-center text-muted-foreground">{p.unit}</td>
                              <td className="px-4 py-3 text-right">{formatNumber(Number(p.minStock))}</td>
                              <td className="px-4 py-3 text-right">
                                <span className={`font-bold ${isLow ? "text-red-500" : "text-foreground"}`}>
                                  {formatNumber(Number(p.stockQty))}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                {isLow ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 uppercase">
                                    Low Stock
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800 uppercase">
                                    Good
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Selected Product Stock Movements log */}
            <div className="space-y-4">
              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-1.5">
                    <History size={16} className="text-secondary" /> Stock Movements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedProductId ? (
                    <>
                      <div className="p-3 bg-muted/40 rounded-lg border border-border/40 text-sm">
                        <p className="font-bold text-foreground">{selectedProduct?.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">HSN Code: {selectedProduct?.hsnCode || "—"}</p>
                      </div>

                      {isMovementsLoading ? (
                        <div className="flex items-center justify-center py-10">
                          <Loader2 className="animate-spin text-muted-foreground" size={20} />
                        </div>
                      ) : movements.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-6">No movement records log yet.</p>
                      ) : (
                        <div className="relative border-l border-border/80 pl-4 space-y-4 text-xs">
                          {movements.map((m) => (
                            <div key={m.id} className="relative">
                              <span className={`absolute -left-[22px] top-0 rounded-full p-0.5 ${
                                m.type === "IN" || m.type === "OPENING"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}>
                                {m.type === "IN" || m.type === "OPENING" ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                              </span>
                              <div className="space-y-0.5">
                                <p className="font-bold">
                                  {m.type} • {formatNumber(Math.abs(Number(m.qty)))} {selectedProduct?.unit}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {new Date(m.createdAt).toLocaleString("en-IN")}
                                </p>
                                {m.reason && <p className="text-muted-foreground italic">"{m.reason}"</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-10">
                      Select a product from the list to view its movement logs.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Adjust Stock Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border text-foreground rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
              <h2 className="text-lg font-bold tracking-tight mb-4">Stock Ledger Adjustment</h2>
              <form onSubmit={handleAdjustStock} className="space-y-4 text-sm">
                <div className="space-y-1.5">
                  <label className="font-semibold">Product</label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => {
                      setSelectedProductId(e.target.value);
                      loadMovements(e.target.value);
                    }}
                    className="w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground cursor-pointer"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold">Adjustment Type</label>
                  <div className="flex rounded-lg border border-border overflow-hidden">
                    {(["IN", "OUT", "ADJUSTMENT"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setAdjustType(t)}
                        className={`flex-1 py-1.5 text-xs font-semibold cursor-pointer ${
                          adjustType === t ? "bg-secondary text-slate-900" : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {t === "IN" ? "Stock In" : t === "OUT" ? "Stock Out" : "Adjustment"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold">Quantity</label>
                  <Input
                    type="number"
                    min="1"
                    value={adjustQty || ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAdjustQty(Number(e.target.value))}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold">Reason / Note</label>
                  <Input
                    placeholder="e.g. Audit deviation, broken shaft, opening stock"
                    value={adjustReason}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAdjustReason(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)} className="cursor-pointer">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="cursor-pointer">
                    {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : "Record Adjustment"}
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
