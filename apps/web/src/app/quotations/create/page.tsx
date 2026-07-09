"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { calculateGstSplit, convertNumberToIndianWords, CustomerType, ProductType } from "shared";
import {
  User,
  ShoppingCart,
  FileCheck,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Sparkles,
  Loader2,
} from "lucide-react";

interface LineItem {
  id: string;
  productId: string;
  description: string;
  hsnCode: string;
  qty: number;
  unit: string;
  rate: number;
  discount: number;
  gstPercent: number;
  cgst: number;
  sgst: number;
  igst: number;
  amount: number;
}

export default function CreateQuotationPage() {
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [isMounted, setIsMounted] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const [customers, setCustomers] = React.useState<CustomerType[]>([]);
  const [products, setProducts] = React.useState<ProductType[]>([]);
  const [companySettings, setCompanySettings] = React.useState<any>(null);

  const [selectedCustomerId, setSelectedCustomerId] = React.useState("");
  const [quotationDate, setQuotationDate] = React.useState(new Date().toISOString().split("T")[0]);
  const [lineItems, setLineItems] = React.useState<LineItem[]>([
    { id: "item_1", productId: "", description: "", hsnCode: "", qty: 1, unit: "Pcs", rate: 0, discount: 0, gstPercent: 18, cgst: 0, sgst: 0, igst: 0, amount: 0 },
  ]);
  const [notes, setNotes] = React.useState("");

  React.useEffect(() => {
    setIsMounted(true);
    Promise.all([
      fetch("/api/customers").then((r) => r.json()),
      fetch("/api/products").then((r) => r.json()),
    ]).then(([custs, prods]) => {
      setCustomers(Array.isArray(custs) ? custs : custs?.data || []);
      setProducts(Array.isArray(prods) ? prods : prods?.data || []);
    });
    const saved = localStorage.getItem("bk_company_settings");
    if (saved) setCompanySettings(JSON.parse(saved));
  }, []);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  const companyState = companySettings?.state || "Maharashtra";

  const recalcItem = (item: LineItem): LineItem => {
    const split = calculateGstSplit(
      item.rate,
      item.qty,
      item.discount,
      item.gstPercent,
      companyState,
      selectedCustomer?.state || companyState
    );
    return {
      ...item,
      cgst: split.cgst,
      sgst: split.sgst,
      igst: split.igst,
      amount: split.taxableAmount,
    };
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === "productId" && value) {
          const prod = products.find((p) => p.id === value);
          if (prod) {
            updated.description = prod.name;
            updated.hsnCode = prod.hsnCode || "";
            updated.unit = prod.unit || "Pcs";
            updated.rate = Number(prod.price || 0);
            updated.gstPercent = Number(prod.gstPercent || 18);
          }
        }
        return recalcItem(updated);
      })
    );
  };

  const addLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      { id: `item_${Date.now()}`, productId: "", description: "", hsnCode: "", qty: 1, unit: "Pcs", rate: 0, discount: 0, gstPercent: 18, cgst: 0, sgst: 0, igst: 0, amount: 0 },
    ]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length <= 1) return;
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  };

  const subTotal = lineItems.reduce((s, i) => s + i.amount, 0);
  const cgstTotal = lineItems.reduce((s, i) => s + i.cgst, 0);
  const sgstTotal = lineItems.reduce((s, i) => s + i.sgst, 0);
  const igstTotal = lineItems.reduce((s, i) => s + i.igst, 0);
  const grandTotal = subTotal + cgstTotal + sgstTotal + igstTotal;

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const body = {
        customerId: selectedCustomerId,
        date: quotationDate,
        items: lineItems.map((item) => ({
          productId: item.productId || null,
          description: item.description,
          hsnCode: item.hsnCode,
          qty: item.qty,
          unit: item.unit,
          rate: item.rate,
          discount: item.discount,
          gstPercent: item.gstPercent,
          cgst: item.cgst,
          sgst: item.sgst,
          igst: item.igst,
          amount: item.amount,
        })),
        grandTotal,
        status: "DRAFT",
      };

      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (res.ok) {
        setStep(4); // success step
      } else {
        alert(json.error || "Failed to save quotation");
      }
    } catch (err) {
      console.error(err);
      alert("Network error");
    } finally {
      setIsLoading(false);
    }
  };

  const formatINR = (val: number) =>
    `₹${val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (!isMounted) return null;

  const steps = [
    { num: 1, label: "Customer", icon: User },
    { num: 2, label: "Items", icon: ShoppingCart },
    { num: 3, label: "Review", icon: FileCheck },
    { num: 4, label: "Done", icon: CheckCircle },
  ];

  return (
    <Navigation>
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 md:gap-6">
          {steps.map((s, i) => (
            <React.Fragment key={s.num}>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                step >= s.num ? "bg-secondary text-slate-900" : "bg-muted text-muted-foreground"
              }`}>
                <s.icon size={14} /> {s.label}
              </div>
              {i < steps.length - 1 && <ChevronRight size={14} className="text-muted-foreground" />}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: Customer */}
        {step === 1 && (
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User size={20} className="text-secondary" /> Select Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Customer</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground cursor-pointer"
                >
                  <option value="">— Select Customer —</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.companyName ? `(${c.companyName})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Quotation Date</label>
                <Input
                  type="date"
                  value={quotationDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuotationDate(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button disabled={!selectedCustomerId} onClick={() => setStep(2)} className="cursor-pointer">
                Next <ChevronRight size={16} className="ml-1" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 2: Line Items */}
        {step === 2 && (
          <Card className="border-border/60">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShoppingCart size={20} className="text-secondary" /> Add Items
              </CardTitle>
              <Button variant="outline" size="sm" onClick={addLineItem} className="gap-1 cursor-pointer">
                <Plus size={14} /> Add Row
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {lineItems.map((item, idx) => (
                <div key={item.id} className="p-4 rounded-lg border border-border/60 bg-muted/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground">Item #{idx + 1}</span>
                    {lineItems.length > 1 && (
                      <button onClick={() => removeLineItem(item.id)} className="text-red-500 hover:text-red-700 cursor-pointer">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <select
                    value={item.productId}
                    onChange={(e) => updateLineItem(item.id, "productId", e.target.value)}
                    className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm cursor-pointer"
                  >
                    <option value="">— Select Product —</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} — {formatINR(Number(p.price))}</option>
                    ))}
                  </select>
                  <Input
                    placeholder="Description"
                    value={item.description}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateLineItem(item.id, "description", e.target.value)}
                  />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div>
                      <label className="text-[10px] uppercase text-muted-foreground">Qty</label>
                      <Input type="number" min="1" value={item.qty} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateLineItem(item.id, "qty", Number(e.target.value))} />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase text-muted-foreground">Rate</label>
                      <Input type="number" min="0" value={item.rate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateLineItem(item.id, "rate", Number(e.target.value))} />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase text-muted-foreground">GST %</label>
                      <Input type="number" min="0" value={item.gstPercent} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateLineItem(item.id, "gstPercent", Number(e.target.value))} />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase text-muted-foreground">Amount</label>
                      <div className="text-sm font-bold pt-2">{formatINR(item.amount + item.cgst + item.sgst + item.igst)}</div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="border-t border-border pt-4 space-y-1 text-right">
                <p className="text-sm">Sub Total: <span className="font-bold">{formatINR(subTotal)}</span></p>
                {cgstTotal > 0 && <p className="text-sm text-muted-foreground">CGST: {formatINR(cgstTotal)}</p>}
                {sgstTotal > 0 && <p className="text-sm text-muted-foreground">SGST: {formatINR(sgstTotal)}</p>}
                {igstTotal > 0 && <p className="text-sm text-muted-foreground">IGST: {formatINR(igstTotal)}</p>}
                <p className="text-lg font-extrabold text-secondary">Grand Total: {formatINR(grandTotal)}</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)} className="cursor-pointer">
                <ChevronLeft size={16} className="mr-1" /> Back
              </Button>
              <Button disabled={lineItems.every((i) => i.amount === 0)} onClick={() => setStep(3)} className="cursor-pointer">
                Next <ChevronRight size={16} className="ml-1" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileCheck size={20} className="text-secondary" /> Review Quotation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Customer</p>
                  <p className="font-semibold">{selectedCustomer?.name}</p>
                  {selectedCustomer?.companyName && (
                    <p className="text-sm text-muted-foreground">{selectedCustomer.companyName}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="font-semibold">{new Date(quotationDate).toLocaleDateString("en-IN")}</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-3 py-2 text-xs font-bold uppercase text-muted-foreground">#</th>
                      <th className="px-3 py-2 text-xs font-bold uppercase text-muted-foreground">Description</th>
                      <th className="px-3 py-2 text-xs font-bold uppercase text-muted-foreground text-right">Qty</th>
                      <th className="px-3 py-2 text-xs font-bold uppercase text-muted-foreground text-right">Rate</th>
                      <th className="px-3 py-2 text-xs font-bold uppercase text-muted-foreground text-right">Tax</th>
                      <th className="px-3 py-2 text-xs font-bold uppercase text-muted-foreground text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((item, idx) => (
                      <tr key={item.id} className="border-b border-border/40">
                        <td className="px-3 py-2">{idx + 1}</td>
                        <td className="px-3 py-2">{item.description}</td>
                        <td className="px-3 py-2 text-right">{item.qty} {item.unit}</td>
                        <td className="px-3 py-2 text-right">{formatINR(item.rate)}</td>
                        <td className="px-3 py-2 text-right">{formatINR(item.cgst + item.sgst + item.igst)}</td>
                        <td className="px-3 py-2 text-right font-bold">{formatINR(item.amount + item.cgst + item.sgst + item.igst)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="text-right space-y-1">
                <p className="text-lg font-extrabold text-secondary">Grand Total: {formatINR(grandTotal)}</p>
              </div>

              <Textarea
                placeholder="Notes (optional)"
                value={notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)} className="cursor-pointer">
                <ChevronLeft size={16} className="mr-1" /> Back
              </Button>
              <Button onClick={handleSave} disabled={isLoading} className="gap-1.5 cursor-pointer">
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                Save Quotation
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <Card className="border-border/60 text-center">
            <CardContent className="py-12 space-y-4">
              <CheckCircle size={56} className="mx-auto text-green-500" />
              <h2 className="text-xl font-extrabold text-foreground">Quotation Saved!</h2>
              <p className="text-sm text-muted-foreground">
                Your quotation has been saved as a draft. You can send it to the customer or approve it later.
              </p>
              <div className="flex items-center justify-center gap-3 pt-4">
                <Button variant="outline" onClick={() => router.push("/quotations")} className="cursor-pointer">
                  View All Quotations
                </Button>
                <Button onClick={() => { setStep(1); setSelectedCustomerId(""); setLineItems([{ id: "item_1", productId: "", description: "", hsnCode: "", qty: 1, unit: "Pcs", rate: 0, discount: 0, gstPercent: 18, cgst: 0, sgst: 0, igst: 0, amount: 0 }]); }} className="cursor-pointer">
                  <Plus size={16} className="mr-1" /> New Quotation
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Navigation>
  );
}
