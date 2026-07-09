import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    

    // Real DB path
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!quotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }
    if (quotation.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Only APPROVED quotations can be converted to invoices" },
        { status: 400 }
      );
    }

    const invoice = await prisma.$transaction(async (tx) => {
      const currentYear = new Date().getFullYear();
      const latest = await tx.invoice.findFirst({
        where: { invoiceNumber: { startsWith: `BK-${currentYear}-` } },
        orderBy: { invoiceNumber: "desc" },
      });
      let nextSeq = 1;
      if (latest) {
        const parts = latest.invoiceNumber.split("-");
        const lastSeq = parseInt(parts[2], 10);
        if (!isNaN(lastSeq)) nextSeq = lastSeq + 1;
      }
      const invoiceNumber = `BK-${currentYear}-${String(nextSeq).padStart(6, "0")}`;

      const items = quotation.items as any[];
      const subTotal = items.reduce((s: number, i: any) => s + Number(i.amount || 0), 0);
      const cgstTotal = items.reduce((s: number, i: any) => s + Number(i.cgst || 0), 0);
      const sgstTotal = items.reduce((s: number, i: any) => s + Number(i.sgst || 0), 0);
      const igstTotal = items.reduce((s: number, i: any) => s + Number(i.igst || 0), 0);

      const created = await tx.invoice.create({
        data: {
          invoiceNumber,
          customerId: quotation.customerId,
          invoiceDate: new Date(),
          subTotal,
          discountTotal: 0,
          cgstTotal,
          sgstTotal,
          igstTotal,
          grandTotal: Number(quotation.grandTotal),
          amountInWords: "",
          status: "FINAL",
          paymentStatus: "UNPAID",
          quotationId: id,
          items: {
            create: items.map((item: any) => ({
              productId: item.productId || null,
              description: item.description,
              qty: Number(item.qty),
              unit: item.unit,
              rate: Number(item.rate),
              discount: Number(item.discount || 0),
              gstPercent: Number(item.gstPercent),
              cgst: Number(item.cgst || 0),
              sgst: Number(item.sgst || 0),
              igst: Number(item.igst || 0),
              amount: Number(item.amount),
            })),
          },
        },
        include: { items: true, customer: true },
      });

      await tx.quotation.update({
        where: { id },
        data: { status: "CONVERTED" },
      });

      return created;
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error: any) {
    console.error("Convert quotation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
