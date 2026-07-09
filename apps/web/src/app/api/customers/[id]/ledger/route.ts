import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mockDb, useMockDb } from "@/lib/mock-db";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: customerId } = await params;

    if (useMockDb()) {
      const customer = mockDb.getCustomerById(customerId);
      if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

      const invoices = mockDb.getInvoices().filter(
        (i) => i.customerId === customerId && i.status !== "CANCELLED"
      );
      const payments = mockDb.getPayments().filter((p) => {
        const inv = mockDb.getInvoiceById(p.invoiceId);
        return inv?.customerId === customerId;
      });

      // Build ledger entries
      type LedgerEntry = {
        date: string;
        type: "INVOICE" | "PAYMENT";
        description: string;
        debit: number;
        credit: number;
        balance: number;
        reference?: string;
      };

      const entries: LedgerEntry[] = [];

      invoices.forEach((inv) => {
        entries.push({
          date: inv.invoiceDate,
          type: "INVOICE",
          description: `Invoice ${inv.invoiceNumber}`,
          debit: inv.grandTotal,
          credit: 0,
          balance: 0,
        });
      });

      payments.forEach((p) => {
        const inv = mockDb.getInvoiceById(p.invoiceId);
        entries.push({
          date: p.paymentDate,
          type: "PAYMENT",
          description: `Payment - ${p.mode}${inv ? ` (${inv.invoiceNumber})` : ""}`,
          debit: 0,
          credit: p.amount,
          balance: 0,
          reference: p.transactionId || undefined,
        });
      });

      // Sort chronologically
      entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Calculate running balance
      let runningBalance = 0;
      entries.forEach((e) => {
        runningBalance += e.debit - e.credit;
        e.balance = runningBalance;
      });

      const totalDebit = entries.reduce((s, e) => s + e.debit, 0);
      const totalCredit = entries.reduce((s, e) => s + e.credit, 0);

      return NextResponse.json({
        customer,
        entries,
        summary: {
          totalDebit,
          totalCredit,
          closingBalance: runningBalance,
        },
      });
    }

    // Real DB path
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    const invoices = await prisma.invoice.findMany({
      where: { customerId, status: { not: "CANCELLED" } },
      orderBy: { invoiceDate: "asc" },
    });

    const payments = await prisma.payment.findMany({
      where: { invoice: { customerId } },
      include: { invoice: true },
      orderBy: { paymentDate: "asc" },
    });

    type LedgerEntry = {
      date: string;
      type: "INVOICE" | "PAYMENT";
      description: string;
      debit: number;
      credit: number;
      balance: number;
      reference?: string;
    };

    const entries: LedgerEntry[] = [];

    invoices.forEach((inv) => {
      entries.push({
        date: inv.invoiceDate.toISOString(),
        type: "INVOICE",
        description: `Invoice ${inv.invoiceNumber}`,
        debit: Number(inv.grandTotal),
        credit: 0,
        balance: 0,
      });
    });

    payments.forEach((p) => {
      entries.push({
        date: p.paymentDate.toISOString(),
        type: "PAYMENT",
        description: `Payment - ${p.mode} (${p.invoice.invoiceNumber})`,
        debit: 0,
        credit: Number(p.amount),
        balance: 0,
        reference: p.transactionId || undefined,
      });
    });

    entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBalance = 0;
    entries.forEach((e) => {
      runningBalance += e.debit - e.credit;
      e.balance = runningBalance;
    });

    return NextResponse.json({
      customer,
      entries,
      summary: {
        totalDebit: entries.reduce((s, e) => s + e.debit, 0),
        totalCredit: entries.reduce((s, e) => s + e.credit, 0),
        closingBalance: runningBalance,
      },
    });
  } catch (error: any) {
    console.error("Ledger error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
