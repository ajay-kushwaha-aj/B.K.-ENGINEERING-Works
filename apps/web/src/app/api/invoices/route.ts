import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { InvoiceSchema } from "shared";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const customerId = searchParams.get("customerId");

    

    const where: any = {};
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        customer: true,
      },
      orderBy: { invoiceNumber: "desc" },
    });

    return NextResponse.json(invoices);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    
    // Parse incoming fields (Zod will strip extra calculated details to re-verify)
    const result = InvoiceSchema.safeParse(json);
    if (!result.success) {
      return NextResponse.json({ error: result.error.format() }, { status: 400 });
    }

    const inputData = result.data;

    

    // Run transaction block for sequential invoice numbering
    const invoice = await prisma.$transaction(async (tx) => {
      const currentYear = new Date().getFullYear();
      
      // Fetch latest invoice sequence
      const latest = await tx.invoice.findFirst({
        where: {
          invoiceNumber: {
            startsWith: `BK-${currentYear}-`,
          },
        },
        orderBy: { invoiceNumber: "desc" },
      });

      let nextSeq = 1;
      if (latest) {
        const parts = latest.invoiceNumber.split("-");
        const lastSeq = parseInt(parts[2], 10);
        if (!isNaN(lastSeq)) {
          nextSeq = lastSeq + 1;
        }
      }

      const formattedSeq = String(nextSeq).padStart(6, "0");
      const invoiceNumber = `BK-${currentYear}-${formattedSeq}`;

      return tx.invoice.create({
        data: {
          invoiceNumber,
          customerId: inputData.customerId,
          invoiceDate: new Date(inputData.invoiceDate),
          dueDate: inputData.dueDate ? new Date(inputData.dueDate) : null,
          subTotal: inputData.subTotal,
          discountTotal: inputData.discountTotal,
          cgstTotal: inputData.cgstTotal,
          sgstTotal: inputData.sgstTotal,
          igstTotal: inputData.igstTotal,
          grandTotal: inputData.grandTotal,
          amountInWords: inputData.amountInWords,
          notes: inputData.notes,
          terms: inputData.terms,
          status: inputData.status as any,
          paymentStatus: inputData.paymentStatus as any,
          items: {
            create: inputData.items.map((item) => ({
              productId: item.productId,
              description: item.description,
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
          },
        },
        include: {
          items: true,
          customer: true,
        },
      });
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error: any) {
    console.error("Invoice save error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
