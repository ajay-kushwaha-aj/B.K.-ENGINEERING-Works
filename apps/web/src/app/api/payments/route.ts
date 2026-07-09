import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mockDb, useMockDb } from "@/lib/mock-db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get("invoiceId");

    if (useMockDb()) {
      let payments = invoiceId
        ? mockDb.getPaymentsByInvoiceId(invoiceId)
        : mockDb.getPayments();

      // Enrich with invoice data
      const result = payments.map((p) => ({
        ...p,
        invoice: (() => {
          const inv = mockDb.getInvoiceById(p.invoiceId);
          if (!inv) return null;
          return {
            ...inv,
            customer: mockDb.getCustomerById(inv.customerId),
          };
        })(),
      }));
      return NextResponse.json(result);
    }

    const where: any = {};
    if (invoiceId) where.invoiceId = invoiceId;

    const payments = await prisma.payment.findMany({
      where,
      include: {
        invoice: {
          include: { customer: true },
        },
      },
      orderBy: { paymentDate: "desc" },
    });

    return NextResponse.json(payments);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { invoiceId, amount, mode, paymentDate, transactionId } = json;

    if (!invoiceId || !amount || !mode || !paymentDate) {
      return NextResponse.json(
        { error: "invoiceId, amount, mode, and paymentDate are required" },
        { status: 400 }
      );
    }

    if (useMockDb()) {
      const invoice = mockDb.getInvoiceById(invoiceId);
      if (!invoice) {
        return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
      }

      const totalPaid = mockDb.getTotalPaidForInvoice(invoiceId);
      const balance = invoice.grandTotal - totalPaid;

      if (Number(amount) > balance + 0.01) {
        return NextResponse.json(
          { error: `Payment exceeds balance due. Outstanding: ₹${balance.toFixed(2)}` },
          { status: 400 }
        );
      }

      const payment = mockDb.addPayment({
        invoiceId,
        amount: Number(amount),
        mode,
        transactionId: transactionId || null,
        paymentDate: new Date(paymentDate).toISOString(),
      });

      // Return enriched payment
      const enriched = {
        ...payment,
        invoice: {
          ...mockDb.getInvoiceById(invoiceId),
          customer: mockDb.getCustomerById(invoice.customerId),
        },
      };

      return NextResponse.json(enriched, { status: 201 });
    }

    // Real DB path
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const totalPaid = invoice.payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    );
    const balance = Number(invoice.grandTotal) - totalPaid;

    if (Number(amount) > balance + 0.01) {
      return NextResponse.json(
        { error: `Payment exceeds balance due. Outstanding: ₹${balance.toFixed(2)}` },
        { status: 400 }
      );
    }

    const payment = await prisma.$transaction(async (tx) => {
      const created = await tx.payment.create({
        data: {
          invoiceId,
          amount: Number(amount),
          mode,
          transactionId: transactionId || null,
          paymentDate: new Date(paymentDate),
        },
        include: {
          invoice: {
            include: { customer: true, payments: true },
          },
        },
      });

      // Recalculate payment status
      const newTotalPaid = created.invoice.payments.reduce(
        (sum, p) => sum + Number(p.amount),
        0
      );

      let newStatus: "PAID" | "PARTIAL" | "UNPAID" = "UNPAID";
      if (newTotalPaid >= Number(invoice.grandTotal)) {
        newStatus = "PAID";
      } else if (newTotalPaid > 0) {
        newStatus = "PARTIAL";
      }

      await tx.invoice.update({
        where: { id: invoiceId },
        data: { paymentStatus: newStatus },
      });

      return created;
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error: any) {
    console.error("Payment save error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
