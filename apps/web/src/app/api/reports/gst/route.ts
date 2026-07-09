import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    

    // ---- Real DB path ----
    const invoices = await prisma.invoice.findMany({
      where: {
        invoiceDate: { gte: startDate, lte: endDate },
        status: { not: "CANCELLED" },
      },
      include: { customer: true, items: { include: { product: true } } },
      orderBy: { invoiceNumber: "asc" },
    });

    const gstr1 = invoices.map((inv) => ({
      invoiceNumber: inv.invoiceNumber,
      invoiceDate: inv.invoiceDate.toISOString(),
      customerName: inv.customer.companyName || inv.customer.name,
      gstin: inv.customer.gstin || "Unregistered",
      taxableValue: Number(inv.subTotal),
      cgst: Number(inv.cgstTotal),
      sgst: Number(inv.sgstTotal),
      igst: Number(inv.igstTotal),
      totalTax: Number(inv.cgstTotal) + Number(inv.sgstTotal) + Number(inv.igstTotal),
      invoiceTotal: Number(inv.grandTotal),
    }));

    const hsnMap: Record<string, any> = {};
    invoices.forEach((inv) => {
      inv.items.forEach((item) => {
        const hsn = item.product?.hsnCode || "N/A";
        if (!hsnMap[hsn]) {
          hsnMap[hsn] = { hsnCode: hsn, qty: 0, taxableValue: 0, cgst: 0, sgst: 0, igst: 0 };
        }
        hsnMap[hsn].qty += Number(item.qty);
        hsnMap[hsn].taxableValue += Number(item.amount);
        hsnMap[hsn].cgst += Number(item.cgst);
        hsnMap[hsn].sgst += Number(item.sgst);
        hsnMap[hsn].igst += Number(item.igst);
      });
    });
    const hsnSummary = Object.values(hsnMap);

    const monthlyTotals = {
      totalTaxableValue: gstr1.reduce((s, r) => s + r.taxableValue, 0),
      totalCgst: gstr1.reduce((s, r) => s + r.cgst, 0),
      totalSgst: gstr1.reduce((s, r) => s + r.sgst, 0),
      totalIgst: gstr1.reduce((s, r) => s + r.igst, 0),
      totalTax: gstr1.reduce((s, r) => s + r.totalTax, 0),
      totalInvoiceValue: gstr1.reduce((s, r) => s + r.invoiceTotal, 0),
      invoiceCount: gstr1.length,
    };

    return NextResponse.json({
      month,
      year,
      monthLabel: startDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
      gstr1,
      hsnSummary,
      monthlyTotals,
    });
  } catch (error: any) {
    console.error("GST report error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
