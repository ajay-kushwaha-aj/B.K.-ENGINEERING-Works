"use client";

import * as React from "react";
import { Navigation } from "@/components/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ShoppingBag,
  Plus,
  Trash2,
  Loader2,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";

interface Vendor {
  id: string;
  name: string;
  gstin: string | null;
}

interface Product {
  id: string;
  name: string;
  price: number;
  gstPercent: number;
}

interface Purchase {
  id: string;
  vendorId: string;
  purchaseDate: string;
  items: any;
  gstTotal: number;
  grandTotal: number;
  paymentStatus: "PAID" | "UNPAID" | "PARTIAL";
  createdAt: string;
  vendor?: Vendor;
}

interface PurchaseItem {
  id: string;
  productId: string;
  qty: number;
  rate: number;
  gstPercent: number;
  amount: number;
}

function formatINR(val: number) {
  return `₹${val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = React.useState<Purchase[]>([]);
  const [vendors, setVendors] = React.useState<Vendor[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // New Purchase Form State
  const [selectedVendorId, setSelectedVendorId] = React.useState("");
  const [purchaseDate, setPurchaseDate] = React.useState(new Date().toISOString().split("T")[0]);
  const [lineItems, setLineItems] = React.useState<PurchaseItem[]>([
    { id: "item_1", productId: "", qty: 1, rate: 0, gstPercent: 18, amount: 0 },
  ]);

  const fetchPurchasesAndOptions = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [purRes, vendRes, prodRes] = await Promise.all([
        fetch("/api/purchases"),
        fetch("/api/vendors"),
        fetch("/api/products"),
      ]);
      const [purJson, vendJson, prodJson] = await Promise.all([
        purRes.json(),
        vendRes.json(),
        prodRes.json(),
      ]);
      setPurchases(purJson);
      setVendors(vendJson);
      setProducts(Array.isArray(prodJson) ? prodJson : prodJson.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchPurchasesAndOptions();
  }, [fetchPurchasesAndOptions]);

  const addRow = () => {
    setLineItems((prev) => [
      ...prev,
      { id: `item_${Date.now()}`, productId: "", qty: 1, rate: 0, gstPercent: 18, amount: 0 },
    ]);
  };

  const removeRow = (id: string) => {
    if (lineItems.length <= 1) return;
    setLineItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateItem = (id: string, field: keyof PurchaseItem, value: any) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === "productId" && value) {
          const prod = products.find((p) => p.id === value);
          if (prod) {
            updated.rate = Number(prod.price);
            updated.gstPercent = Number(prod.gstPercent);
          }
        }
        updated.amount = updated.qty * updated.rate;
        return updated;
      })
    );
  };

  const subTotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const gstTotal = lineItems.reduce((sum, item) => sum + (item.amount * item.gstPercent) / 100, 0);
  const grandTotal = subTotal + gstTotal;

  const handleSubmitPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendorId || lineItems.some((item) => !item.productId)) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId: selectedVendorId,
          purchaseDate,
          items: lineItems,
          gstTotal,
          grandTotal,
          paymentStatus: "UNPAID",
        }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setLineItems([{ id: "item_1", productId: "", qty: 1, rate: 0, gstPercent: 18, amount: 0 }]);
        fetchPurchasesAndOptions();
      } else {
        const json = await res.json();
        alert(json.error || "Save purchase failed");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Navigation>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
              <ShoppingBag size={28} className="text-secondary" /> Purchases Log
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Record industrial vendor acquisitions, track raw stock values, and payments status
            </p>
          </div>
          <Button className="gap-1.5 cursor-pointer" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> New Purchase Entry
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-muted-foreground" />
          </div>
        ) : purchases.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-2xl bg-card/50">
            <ShoppingBag size={48} className="mx-auto text-muted-foreground/30 mb-3" />
            <h3 className="text-lg font-bold text-foreground">No purchases recorded</h3>
            <p className="text-sm text-muted-foreground mt-1">Acquisitions will show up here.</p>
          </div>
        ) : (
          <Card className="border-border/60">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-xs font-bold uppercase text-muted-foreground">Acquisition ID</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase text-muted-foreground">Vendor</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase text-muted-foreground">Date</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase text-muted-foreground text-right">GST Paid</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase text-muted-foreground text-right">Total Acquisition</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase text-muted-foreground text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.map((p) => (
                      <tr key={p.id} className="border-b border-border/40 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-semibold text-foreground">{p.id.substring(0, 12)}</td>
                        <td className="px-4 py-3">{p.vendor?.name || "Unknown"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{new Date(p.purchaseDate).toLocaleDateString("en-IN")}</td>
                        <td className="px-4 py-3 text-right">{formatINR(Number(p.gstTotal))}</td>
                        <td className="px-4 py-3 text-right font-bold">{formatINR(Number(p.grandTotal))}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            p.paymentStatus === "PAID"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                              : "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400"
                          }`}>
                            {p.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Record Acquisition Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border text-foreground rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative">
              <h2 className="text-lg font-bold tracking-tight mb-4 flex items-center gap-1.5">
                <ShoppingBag size={20} className="text-secondary" /> Vendor Acquisition Entry
              </h2>
              <form onSubmit={handleSubmitPurchase} className="space-y-4 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold">Vendor</label>
                    <select
                      value={selectedVendorId}
                      onChange={(e) => setSelectedVendorId(e.target.value)}
                      className="w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground cursor-pointer"
                      required
                    >
                      <option value="">— Select Vendor —</option>
                      {vendors.map((v) => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold">Date</label>
                    <Input
                      type="date"
                      value={purchaseDate}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPurchaseDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Line Items */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between border-b border-border pb-1">
                    <span className="font-bold text-muted-foreground">Items list</span>
                    <Button variant="outline" size="sm" type="button" onClick={addRow} className="cursor-pointer">
                      Add Item
                    </Button>
                  </div>

                  {lineItems.map((item, idx) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-4 space-y-1">
                        <label className="text-[10px] text-muted-foreground">Product</label>
                        <select
                          value={item.productId}
                          onChange={(e) => updateItem(item.id, "productId", e.target.value)}
                          className="w-full rounded-lg border border-border bg-card px-2 py-1 text-xs cursor-pointer"
                          required
                        >
                          <option value="">— Select —</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2 space-y-1">
                        <label className="text-[10px] text-muted-foreground">Qty</label>
                        <Input
                          type="number"
                          min="1"
                          value={item.qty || ""}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateItem(item.id, "qty", Number(e.target.value))}
                          className="px-2 py-1 text-xs h-7"
                          required
                        />
                      </div>
                      <div className="col-span-3 space-y-1">
                        <label className="text-[10px] text-muted-foreground">Rate</label>
                        <Input
                          type="number"
                          value={item.rate || ""}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateItem(item.id, "rate", Number(e.target.value))}
                          className="px-2 py-1 text-xs h-7"
                          required
                        />
                      </div>
                      <div className="col-span-2 text-right text-xs font-semibold pb-2">
                        {formatINR(item.amount)}
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          disabled={lineItems.length <= 1}
                          onClick={() => removeRow(item.id)}
                          className="text-red-500 hover:text-red-700 disabled:opacity-50 pb-2 cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Calculations */}
                <div className="border-t border-border pt-3 space-y-1.5 text-right">
                  <p className="text-xs">Sub Total: <span className="font-bold">{formatINR(subTotal)}</span></p>
                  <p className="text-xs text-muted-foreground">Acquisition GST: {formatINR(gstTotal)}</p>
                  <p className="text-sm font-extrabold text-secondary">Total Value: {formatINR(grandTotal)}</p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)} className="cursor-pointer">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="cursor-pointer">
                    {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : "Record Acquisition"}
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
