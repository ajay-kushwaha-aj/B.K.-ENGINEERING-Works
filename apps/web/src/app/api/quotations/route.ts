import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mockDb, useMockDb } from "@/lib/mock-db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    if (useMockDb()) {
      let quotations = mockDb.getQuotations();
      if (status) quotations = quotations.filter((q) => q.status === status);
      const result = quotations.map((q) => ({
        ...q,
        customer: mockDb.getCustomerById(q.customerId),
      }));
      return NextResponse.json(result);
    }

    const where: any = {};
    if (status) where.status = status;

    const quotations = await prisma.quotation.findMany({
      where,
      include: { customer: true },
      orderBy: { quotationNumber: "desc" },
    });
    return NextResponse.json(quotations);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { customerId, date, items, grandTotal, status: qStatus } = json;

    if (!customerId || !items || grandTotal === undefined) {
      return NextResponse.json({ error: "customerId, items, and grandTotal are required" }, { status: 400 });
    }

    if (useMockDb()) {
      const quotation = mockDb.addQuotation({
        customerId,
        date: date || new Date().toISOString().split("T")[0],
        items,
        grandTotal: Number(grandTotal),
        status: qStatus || "DRAFT",
      });
      return NextResponse.json({ ...quotation, customer: mockDb.getCustomerById(customerId) }, { status: 201 });
    }

    const quotation = await prisma.$transaction(async (tx) => {
      const currentYear = new Date().getFullYear();
      const latest = await tx.quotation.findFirst({
        where: { quotationNumber: { startsWith: `QT-${currentYear}-` } },
        orderBy: { quotationNumber: "desc" },
      });
      let nextSeq = 1;
      if (latest) {
        const parts = latest.quotationNumber.split("-");
        const lastSeq = parseInt(parts[2], 10);
        if (!isNaN(lastSeq)) nextSeq = lastSeq + 1;
      }
      const quotationNumber = `QT-${currentYear}-${String(nextSeq).padStart(6, "0")}`;

      return tx.quotation.create({
        data: {
          quotationNumber,
          customerId,
          date: new Date(date || new Date()),
          items,
          grandTotal: Number(grandTotal),
          status: qStatus || "DRAFT",
        },
        include: { customer: true },
      });
    });

    return NextResponse.json(quotation, { status: 201 });
  } catch (error: any) {
    console.error("Quotation save error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
