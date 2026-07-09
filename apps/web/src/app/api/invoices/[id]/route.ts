import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mockDb, useMockDb } from "@/lib/mock-db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (useMockDb()) {
      const invoice = mockDb.getInvoiceById(id);
      if (!invoice) {
        return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
      }
      return NextResponse.json({
        ...invoice,
        customer: mockDb.getCustomerById(invoice.customerId),
      });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        items: true,
        customer: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const json = await request.json();
    const { status, paymentStatus, cancelled } = json;

    if (useMockDb()) {
      const payload: any = {};
      if (status) payload.status = status;
      if (paymentStatus) payload.paymentStatus = paymentStatus;
      if (cancelled) {
        payload.status = "CANCELLED";
        payload.cancelledAt = new Date().toISOString();
      }

      const updated = mockDb.updateInvoice(id, payload);
      if (!updated) {
        return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
      }
      return NextResponse.json(updated);
    }

    const payload: any = {};
    if (status) payload.status = status;
    if (paymentStatus) payload.paymentStatus = paymentStatus;
    if (cancelled) {
      payload.status = "CANCELLED";
      payload.cancelledAt = new Date();
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: payload,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
