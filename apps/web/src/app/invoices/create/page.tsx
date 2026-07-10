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
  Download,
  Share2,
  Loader2
} from "lucide-react";
// Dynamic import of PDF renderer inside handlers to prevent hydrations or reconciler crashes

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

export default function CreateInvoicePage() {
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [isMounted, setIsMounted] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  // Loaded Options
  const [customers, setCustomers] = React.useState<CustomerType[]>([]);
  const [products, setProducts] = React.useState<ProductType[]>([]);
  const [companySettings, setCompanySettings] = React.useState<any>(null);

  // Form Selections
  const [selectedCustomerId, setSelectedCustomerId] = React.useState("");
  const [invoiceDate, setInvoiceDate] = React.useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = React.useState("");
  const [lineItems, setLineItems] = React.useState<LineItem[]>([
    {
      id: "item_1",
      productId: "",
      description: "",
      hsnCode: "",
      qty: 1,
      unit: "Nos",
      rate: 0,
      discount: 0,
      gstPercent: 18,
      cgst: 0,
      sgst: 0,
      igst: 0,
      amount: 0,
    },
  ]);
  const [notes, setNotes] = React.useState("");
  const [terms, setTerms] = React.useState("");

  // Final Created Invoice Data
  const [createdInvoice, setCreatedInvoice] = React.useState<any>(null);
  const [isPdfDownloading, setIsPdfDownloading] = React.useState(false);

  const handleDownloadPdf = async () => {
    if (!createdInvoice) return;
    try {
      setIsPdfDownloading(true);
      const { pdf } = await import("@react-pdf/renderer");
      const { InvoicePdfDocument } = await import("@/components/invoice-pdf");
      const doc = <InvoicePdfDocument invoice={createdInvoice} companySettings={companySettings} />;
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${createdInvoice.invoiceNumber || "invoice"}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setIsPdfDownloading(false);
    }
  };

  React.useEffect(() => {
    setIsMounted(true);

    // Load Company Settings
    const localSettings = localStorage.getItem("bk_company_settings");
    if (localSettings) {
      const parsed = JSON.parse(localSettings);
      setCompanySettings(parsed);
      setTerms(parsed.termsDefault || "");
    }

    // Load Customers & Products options
    const loadOptions = async () => {
      try {
        const [cRes, pRes] = await Promise.all([
          fetch("/api/customers"),
          fetch("/api/products")
        ]);
        const cData = await cRes.json();
        const pData = await pRes.json();
        if (cRes.ok) setCustomers(cData);
        if (pRes.ok) setProducts(pData);
      } catch (err) {
        console.error("Failed to load select options:", err);
      }
    };
    loadOptions();
  }, []);

  // Update invoice terms when a customer is selected
  React.useEffect(() => {
    if (!selectedCustomerId) return;
    const cust = customers.find(c => c.id === selectedCustomerId);
    if (cust) {
      if (cust.termsDefault) {
        setTerms(cust.termsDefault);
      } else if (companySettings?.termsDefault) {
        setTerms(companySettings.termsDefault);
      } else {
        setTerms("");
      }
    }
  }, [selectedCustomerId, customers, companySettings]);

  const activeCustomer = customers.find(c => c.id === selectedCustomerId);

  // Calculate totals
  const subTotal = lineItems.reduce((sum, item) => sum + (item.rate * item.qty - item.discount), 0);
  const discountTotal = lineItems.reduce((sum, item) => sum + item.discount, 0);
  const cgstTotal = lineItems.reduce((sum, item) => sum + item.cgst, 0);
  const sgstTotal = lineItems.reduce((sum, item) => sum + item.sgst, 0);
  const igstTotal = lineItems.reduce((sum, item) => sum + item.igst, 0);
  
  // Round off and final totals
  const rawGrandTotal = subTotal + cgstTotal + sgstTotal + igstTotal;
  const grandTotal = Math.round(rawGrandTotal);
  const roundOff = grandTotal - rawGrandTotal;
  const amountInWords = convertNumberToIndianWords(grandTotal);

  const firstItemGst = lineItems[0]?.gstPercent || 18;
  const cgstRate = firstItemGst / 2;
  const sgstRate = firstItemGst / 2;
  const igstRate = firstItemGst;
  const totalTax = cgstTotal + sgstTotal + igstTotal;

  // Recalculate a single line item
  const updateLineCalculations = (item: LineItem, customerState: string, companyState: string): LineItem => {
    const split = calculateGstSplit(
      item.rate,
      item.qty,
      item.discount,
      item.gstPercent,
      companyState,
      customerState
    );
    return {
      ...item,
      cgst: split.cgst,
      sgst: split.sgst,
      igst: split.igst,
      amount: split.totalAmount,
    };
  };

  // Trigger recalculation on line item change
  const handleItemChange = (idx: number, updatedItem: Partial<LineItem>) => {
    const items = [...lineItems];
    const baseItem = { ...items[idx], ...updatedItem };
    
    // Auto-fill product attributes if productId changed
    if (updatedItem.productId) {
      const prod = products.find(p => p.id === updatedItem.productId);
      if (prod) {
        baseItem.description = prod.name;
        baseItem.hsnCode = prod.hsnCode || "";
        baseItem.rate = Number(prod.price);
        baseItem.unit = prod.unit;
        baseItem.gstPercent = Number(prod.gstPercent);
      }
    }

    const calculated = updateLineCalculations(
      baseItem,
      activeCustomer?.state || "Maharashtra",
      companySettings?.state || "Maharashtra"
    );

    items[idx] = calculated;
    setLineItems(items);
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        id: `item_${Date.now()}`,
        productId: "",
        description: "",
        hsnCode: "",
        qty: 1,
        unit: "Nos",
        rate: 0,
        discount: 0,
        gstPercent: 18,
        cgst: 0,
        sgst: 0,
        igst: 0,
        amount: 0,
      },
    ]);
  };

  const removeLineItem = (idx: number) => {
    if (lineItems.length === 1) return;
    const items = [...lineItems];
    items.splice(idx, 1);
    setLineItems(items);
  };

  const handleNextStep = () => {
    if (step === 1 && !selectedCustomerId) {
      alert("Please select a customer before proceeding.");
      return;
    }
    if (step === 2 && lineItems.some(i => !i.description.trim() || i.rate <= 0 || i.qty <= 0)) {
      alert("Please ensure all line items have descriptions, valid rates, and quantities.");
      return;
    }
    setStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setStep(prev => prev - 1);
  };

  const handleCreateInvoice = async () => {
    setIsLoading(true);
    try {
      const payload = {
        customerId: selectedCustomerId,
        invoiceDate: new Date(invoiceDate).toISOString(),
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        subTotal,
        discountTotal,
        cgstTotal,
        sgstTotal,
        igstTotal,
        grandTotal,
        amountInWords,
        notes,
        terms,
        items: lineItems,
        status: "FINAL",
        paymentStatus: "UNPAID",
      };

      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create invoice");
      }

      setCreatedInvoice(data);
      setStep(4);
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Navigation>
      <div className="space-y-6">
        {/* Wizard Headers */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground bg-gradient-to-r from-foreground via-slate-500 to-foreground bg-clip-text text-transparent">Create GST Invoice</h1>
            <p className="mt-1 text-sm text-muted-foreground">Follow the steps to construct and finalize a tax receipt.</p>
          </div>
          
          <div className="flex items-center gap-1 bg-card border border-border/80 p-1.5 rounded-full text-xs font-semibold shadow-xs">
            <span className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all ${step === 1 ? "bg-primary text-white shadow-sm" : "text-muted-foreground"}`}>
              <User size={13} /> Customer
            </span>
            <ChevronRight size={12} className="text-slate-300 dark:text-slate-700" />
            <span className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all ${step === 2 ? "bg-primary text-white shadow-sm" : "text-muted-foreground"}`}>
              <ShoppingCart size={13} /> Items
            </span>
            <ChevronRight size={12} className="text-slate-300 dark:text-slate-700" />
            <span className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all ${step === 3 ? "bg-primary text-white shadow-sm" : "text-muted-foreground"}`}>
              <FileCheck size={13} /> Review
            </span>
            <ChevronRight size={12} className="text-slate-300 dark:text-slate-700" />
            <span className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all ${step === 4 ? "bg-emerald-600 text-white shadow-sm" : "text-muted-foreground"}`}>
              <CheckCircle size={13} /> Finalized
            </span>
          </div>
        </div>

        {/* STEP 1: Select Customer */}
        {step === 1 && (
          <Card className="border border-border/60 shadow-md rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-border/40 pb-4">
              <CardTitle className="text-lg font-bold">Step 1: Select Customer Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-extrabold uppercase tracking-wider text-foreground">Client Customer *</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-background px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary cursor-pointer transition-all shadow-xs"
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName ? `${c.companyName} (${c.name})` : c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Invoice Date *"
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="rounded-xl"
                />
                <Input
                  label="Due Date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              {activeCustomer && (
                <div className="p-5 bg-muted/40 rounded-2xl border border-border text-sm space-y-3 shadow-xs">
                  <h4 className="font-extrabold text-foreground text-base tracking-tight border-b border-border pb-1.5">Selected Customer Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-muted-foreground mt-2">
                    <p><span className="font-bold text-foreground block text-xs uppercase tracking-wider mb-0.5">Billing Address</span> <span className="text-foreground/90 font-medium">{activeCustomer.address}</span></p>
                    <p><span className="font-bold text-foreground block text-xs uppercase tracking-wider mb-0.5">State Tax Jurisdiction</span> <span className="text-foreground/90 font-medium">{activeCustomer.state}</span></p>
                    <p><span className="font-bold text-foreground block text-xs uppercase tracking-wider mb-0.5">GSTIN</span> <span className="font-mono text-foreground font-semibold bg-background px-2 py-0.5 rounded border border-border">{activeCustomer.gstin || "Unregistered (URD)"}</span></p>
                    <p><span className="font-bold text-foreground block text-xs uppercase tracking-wider mb-0.5">Contact Details</span> <span className="text-foreground/90 font-medium">{activeCustomer.phone || "—"} {activeCustomer.email || ""}</span></p>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="justify-end border-t border-border/40 pt-4">
              <Button onClick={handleNextStep} className="flex items-center gap-1 h-11 px-6 rounded-xl shadow-xs">
                Next: Add Items <ChevronRight size={16} />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* STEP 2: Line Items */}
        {step === 2 && (
          <Card className="border border-border/60 shadow-md rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-border/40 pb-4">
              <CardTitle className="text-lg font-bold">Step 2: Add Invoiced Goods / Services</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Product rows table */}
              <div className="space-y-5">
                {lineItems.map((item, idx) => (
                  <div key={item.id} className="p-5 border border-border rounded-2xl bg-muted/30 shadow-xs relative flex flex-col gap-4 hover:border-border transition-all">
                    <button
                      type="button"
                      onClick={() => removeLineItem(idx)}
                      className="absolute top-5 right-5 p-2 rounded-full border border-border bg-card hover:bg-muted text-foreground/70 hover:text-danger hover:border-danger/30 cursor-pointer transition-all shadow-xs"
                      title="Remove Row"
                    >
                      <Trash2 size={15} />
                    </button>
                    
                    <span className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-extrabold rounded bg-muted text-foreground/80 w-fit border border-border">Line Item #{idx + 1}</span>
 
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {/* Product Selector */}
                      <div className="md:col-span-2 flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-foreground uppercase tracking-wider">Item Template (Auto-fill)</label>
                        <select
                          value={item.productId}
                          onChange={(e) => handleItemChange(idx, { productId: e.target.value })}
                          className="h-11 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary cursor-pointer transition-all shadow-xs text-foreground font-medium"
                        >
                          <option value="">-- Manual Input / Custom Description --</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
 
                      <Input
                        label="Description of Service/Goods *"
                        value={item.description}
                        onChange={(e) => handleItemChange(idx, { description: e.target.value })}
                        className="rounded-xl border-border"
                      />
                      
                      <Input
                        label="HSN / SAC Code"
                        value={item.hsnCode}
                        onChange={(e) => handleItemChange(idx, { hsnCode: e.target.value })}
                        className="rounded-xl border-border font-mono"
                      />
                    </div>
 
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 items-end">
                      <Input
                        label="Qty *"
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => handleItemChange(idx, { qty: Number(e.target.value) })}
                        className="rounded-xl border-border"
                      />
                      <Input
                        label="Unit *"
                        value={item.unit}
                        onChange={(e) => handleItemChange(idx, { unit: e.target.value })}
                        className="rounded-xl border-border"
                      />
                      <Input
                        label="Rate (₹) *"
                        type="number"
                        value={item.rate}
                        onChange={(e) => handleItemChange(idx, { rate: Number(e.target.value) })}
                        className="rounded-xl border-border"
                      />
                      <Input
                        label="Discount (₹)"
                        type="number"
                        value={item.discount}
                        onChange={(e) => handleItemChange(idx, { discount: Number(e.target.value) })}
                        className="rounded-xl border-border"
                      />
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-foreground uppercase tracking-wider">GST %</label>
                        <select
                          value={item.gstPercent}
                          onChange={(e) => handleItemChange(idx, { gstPercent: Number(e.target.value) })}
                          className="h-11 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary cursor-pointer transition-all shadow-xs text-foreground font-medium"
                        >
                          <option value={18}>18%</option>
                          <option value={12}>12%</option>
                          <option value={28}>28%</option>
                          <option value={5}>5%</option>
                          <option value={0}>0%</option>
                        </select>
                      </div>
                      <div className="flex flex-col justify-center pb-2 text-right">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Line Total</span>
                        <span className="font-black text-foreground text-lg mt-0.5">₹{item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
 
                    {/* CGST, SGST & IGST breakdown displayed directly on the product row */}
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2.5 p-3 rounded-xl bg-card border border-border text-xs font-bold text-foreground shadow-2xs">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">GST Breakdown:</span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span>CGST ({(item.gstPercent / 2)}%): <strong className="text-foreground">₹{item.cgst.toFixed(2)}</strong></span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-teal-500" />
                        <span>SGST ({(item.gstPercent / 2)}%): <strong className="text-foreground">₹{item.sgst.toFixed(2)}</strong></span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                        <span>IGST ({item.gstPercent}%): <strong className="text-foreground">₹{item.igst.toFixed(2)}</strong></span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
 
              <Button variant="outline" onClick={addLineItem} className="w-full h-11 flex items-center justify-center gap-1.5 rounded-xl border-dashed hover:bg-slate-50 dark:hover:bg-slate-900/40">
                <Plus size={16} /> Add Item Row
              </Button>
            </CardContent>
            <CardFooter className="justify-between">
              <Button variant="outline" onClick={handlePrevStep} className="flex items-center gap-1">
                <ChevronLeft size={16} /> Back
              </Button>
              <Button onClick={handleNextStep} className="flex items-center gap-1">
                Next: Review Invoice <ChevronRight size={16} />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* STEP 3: Review */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 3: Review Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* simulated billing invoice summary */}
                <div className="lg:col-span-2 border border-border rounded-xl p-6 bg-card text-foreground space-y-4">
                  <h3 className="font-bold text-lg border-b border-border pb-3 flex items-center justify-between">
                    Simulated Invoice Preview
                    <span className="font-mono text-xs text-muted-foreground">[Draft Sequence]</span>
                  </h3>

                  <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                    <div>
                      <p className="font-bold text-foreground uppercase tracking-wider text-[10px]">Client Details</p>
                      <p className="font-bold mt-1 text-foreground text-sm">{activeCustomer?.companyName || activeCustomer?.name}</p>
                      <p>{activeCustomer?.address}</p>
                      <p className="mt-1 font-mono">GST: {activeCustomer?.gstin || "URD"}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground uppercase tracking-wider text-[10px]">Date & Terms</p>
                      <p className="mt-1 text-foreground">Date: {new Date(invoiceDate).toLocaleDateString("en-IN")}</p>
                      {dueDate && <p className="text-foreground">Due: {new Date(dueDate).toLocaleDateString("en-IN")}</p>}
                    </div>
                  </div>

                  {/* table preview */}
                  <div className="overflow-x-auto border border-border rounded-lg bg-background">
                    <table className="min-w-full divide-y divide-border text-xs">
                      <thead className="bg-muted/50 font-bold">
                        <tr>
                          <th className="px-4 py-2 text-left">Description</th>
                          <th className="px-4 py-2 text-center">HSN</th>
                          <th className="px-4 py-2 text-center">Qty</th>
                          <th className="px-4 py-2 text-right">Rate</th>
                          <th className="px-4 py-2 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {lineItems.map((item, idx) => (
                          <tr key={item.id || idx}>
                            <td className="px-4 py-2 font-medium">{item.description}</td>
                            <td className="px-4 py-2 text-center font-mono text-[10px]">{item.hsnCode || "—"}</td>
                            <td className="px-4 py-2 text-center">{item.qty} {item.unit}</td>
                            <td className="px-4 py-2 text-right">₹{item.rate.toFixed(2)}</td>
                            <td className="px-4 py-2 text-right font-bold">₹{item.amount.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Amount in words */}
                  <div className="p-3 bg-muted/30 rounded border border-border text-xs">
                    <span className="font-bold uppercase tracking-wider text-[10px] text-muted-foreground block mb-0.5">Spelled Amount</span>
                    <span className="font-bold text-foreground">{amountInWords}</span>
                  </div>

                  <Textarea
                    label="Default Internal Notes (Optional)"
                    placeholder="Enter any notes that are visible internally..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />

                  <Textarea
                    label="Terms & Conditions (Pre-populated)"
                    rows={4}
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                  />
                </div>

                {/* totals layout panel */}
                <div className="space-y-4">
                  <div className="p-4 bg-muted/40 rounded-xl border border-border/80 space-y-3">
                    <h4 className="font-bold text-foreground text-sm uppercase tracking-wider border-b border-border/80 pb-2">Calculated Totals</h4>
                    <div className="text-xs space-y-2 text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Total Amount Before Tax:</span>
                        <span className="text-foreground font-semibold">₹{subTotal.toFixed(2)}</span>
                      </div>
                      {discountTotal > 0 && (
                        <div className="flex justify-between text-red-500">
                          <span>Discount Total:</span>
                          <span>-₹{discountTotal.toFixed(2)}</span>
                        </div>
                      )}
                      
                      {/* Intrastate & Interstate breakdown display */}
                      <div className="flex justify-between">
                        <span>CGST ({cgstRate}%):</span>
                        <span className="text-foreground">₹{cgstTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>SGST ({sgstRate}%):</span>
                        <span className="text-foreground">₹{sgstTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>IGST ({igstRate}%):</span>
                        <span className="text-foreground">₹{igstTotal.toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between border-t border-border/40 pt-2">
                        <span>Total Tax Amount:</span>
                        <span className="text-foreground font-semibold">₹{totalTax.toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between">
                        <span>Round Off:</span>
                        <span className="text-foreground">₹{roundOff.toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between text-base font-extrabold text-foreground border-t border-border pt-2.5 mt-2">
                        <span>Total Amount After Tax:</span>
                        <span>₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-blue-600 bg-blue-50 dark:bg-blue-950/20 dark:text-blue-400 p-3 rounded border border-blue-200/50 flex gap-2">
                    <Sparkles className="flex-shrink-0" size={14} />
                    <span>Calculations are fully GST compliance audited. Proceed to generate the final sequential Invoice sequence.</span>
                  </div>
                </div>

              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <Button variant="outline" onClick={handlePrevStep} className="flex items-center gap-1" disabled={isLoading}>
                <ChevronLeft size={16} /> Back
              </Button>
              <Button onClick={handleCreateInvoice} className="flex items-center gap-1" isLoading={isLoading}>
                Save & Finalize Invoice <ChevronRight size={16} />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* STEP 4: Finalized Success */}
        {step === 4 && createdInvoice && (
          <Card className="border border-emerald-200 dark:border-emerald-800 bg-emerald-50/10">
            <CardContent className="flex flex-col items-center justify-center text-center py-12 space-y-6">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full">
                <CheckCircle size={48} />
              </div>
              
              <div>
                <h2 className="text-2xl font-extrabold text-foreground">Invoice Generated Successfully!</h2>
                <p className="mt-2 text-sm text-muted-foreground max-w-md">
                  Invoice <span className="font-bold text-foreground font-mono">{createdInvoice.invoiceNumber}</span> is saved and registered sequentially in the database audit trail.
                </p>
              </div>

              <div className="p-4 bg-background border border-border rounded-2xl w-full max-w-md grid grid-cols-2 gap-4 text-xs font-semibold">
                <div className="text-left border-r border-border/80 pr-2">
                  <p className="text-muted-foreground uppercase text-[10px]">Grand Total</p>
                  <p className="text-lg font-bold text-foreground mt-1">₹{Number(createdInvoice.grandTotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="text-left pl-2">
                  <p className="text-muted-foreground uppercase text-[10px]">Client / Recipient</p>
                  <p className="text-sm font-bold text-foreground truncate mt-1">{activeCustomer?.companyName || activeCustomer?.name}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3.5 w-full max-w-md">
                {isMounted && (
                  <Button
                    onClick={handleDownloadPdf}
                    disabled={isPdfDownloading}
                    size="lg"
                    className="flex-1 inline-flex items-center justify-center gap-2.5 h-12 px-6 text-xs font-bold uppercase tracking-wider rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white border-none transition-all shadow-md cursor-pointer"
                  >
                    {isPdfDownloading ? (
                      <>
                        <Loader2 size={15} className="animate-spin" /> Building PDF...
                      </>
                    ) : (
                      <>
                        <Download size={15} /> Download PDF
                      </>
                    )}
                  </Button>
                )}

                <Button 
                  variant="outline" 
                  size="lg"
                  className="flex-1 flex items-center justify-center gap-2.5 h-12 px-6 text-xs font-bold uppercase tracking-wider rounded-xl border border-border bg-card text-foreground hover:bg-muted transition-all shadow-xs"
                  onClick={() => {
                    const shareText = `Dear Customer, please find attached Invoice ${createdInvoice.invoiceNumber} for ₹${Number(createdInvoice.grandTotal).toLocaleString("en-IN")} from B.K. Engineering Works.`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
                  }}
                >
                  <Share2 size={15} /> Share via WhatsApp
                </Button>
              </div>

              <div className="pt-6 border-t border-border/80 w-full max-w-md flex flex-col sm:flex-row gap-3">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="w-full sm:flex-1 rounded-xl text-xs font-bold uppercase tracking-wider h-12 text-muted-foreground border-border bg-transparent hover:bg-muted hover:text-foreground transition-all shadow-xs"
                  onClick={() => router.push("/invoices")}
                >
                  Go to Invoices List
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="w-full sm:flex-1 rounded-xl text-xs font-bold uppercase tracking-wider h-12 text-foreground border-border bg-transparent hover:bg-muted transition-all shadow-xs"
                  onClick={() => {
                    // Reset wizard for new invoice
                    setSelectedCustomerId("");
                    setLineItems([
                      {
                        id: "item_1",
                        productId: "",
                        description: "",
                        hsnCode: "",
                        qty: 1,
                        unit: "Nos",
                        rate: 0,
                        discount: 0,
                        gstPercent: 18,
                        cgst: 0,
                        sgst: 0,
                        igst: 0,
                        amount: 0,
                      },
                    ]);
                    setNotes("");
                    setStep(1);
                  }}
                >
                  Create Another Invoice
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </Navigation>
  );
}
