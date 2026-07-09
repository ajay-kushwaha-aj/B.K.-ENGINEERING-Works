import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mockDb, useMockDb } from "@/lib/mock-db";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (useMockDb()) {
      const q = mockDb.getQuotationById(id);
      if (!q) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ ...q, customer: mockDb.getCustomerById(q.customerId) });
    }
    const q = await prisma.quotation.findUnique({ where: { id }, include: { customer: true } });
    if (!q) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(q);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const json = await request.json();
    const { status } = json;

    const validStatuses = ["DRAFT", "SENT", "APPROVED", "REJECTED"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` }, { status: 400 });
    }

    if (useMockDb()) {
      const updated = mockDb.updateQuotation(id, { status });
      if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ ...updated, customer: mockDb.getCustomerById(updated.customerId) });
    }

    const updated = await prisma.quotation.update({
      where: { id },
      data: { status },
      include: { customer: true },
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
