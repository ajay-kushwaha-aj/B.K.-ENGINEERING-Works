import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {


    // Real database dump
    const [
      customers,
      products,
      invoices,
      payments,
      quotations,
      vendors,
      purchases,
      expenses,
      workOrders,
      stockMovements,
      documents,
    ] = await Promise.all([
      prisma.customer.findMany(),
      prisma.product.findMany(),
      prisma.invoice.findMany(),
      prisma.payment.findMany(),
      prisma.quotation.findMany(),
      prisma.vendor.findMany(),
      prisma.purchase.findMany(),
      prisma.expense.findMany(),
      prisma.workOrder.findMany(),
      prisma.stockMovement.findMany(),
      prisma.document.findMany(),
    ]);

    return NextResponse.json({
      customers,
      products,
      invoices,
      payments,
      quotations,
      vendors,
      purchases,
      expenses,
      workOrders,
      stockMovements,
      documents,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();



    // Real DB restore using transaction (destructive overwrite)
    await prisma.$transaction(async (tx) => {
      // Clear current lists
      await tx.document.deleteMany();
      await tx.stockMovement.deleteMany();
      await tx.workOrder.deleteMany();
      await tx.expense.deleteMany();
      await tx.purchase.deleteMany();
      await tx.vendor.deleteMany();
      await tx.payment.deleteMany();
      await tx.invoiceItem.deleteMany();
      await tx.invoice.deleteMany();
      await tx.quotation.deleteMany();
      await tx.product.deleteMany();
      await tx.customer.deleteMany();

      // Restore elements
      if (json.customers) await tx.customer.createMany({ data: json.customers });
      if (json.products) await tx.product.createMany({ data: json.products });
      if (json.quotations) await tx.quotation.createMany({ data: json.quotations });
      if (json.invoices) await tx.invoice.createMany({ data: json.invoices });
      if (json.payments) await tx.payment.createMany({ data: json.payments });
      if (json.vendors) await tx.vendor.createMany({ data: json.vendors });
      if (json.purchases) await tx.purchase.createMany({ data: json.purchases });
      if (json.expenses) await tx.expense.createMany({ data: json.expenses });
      if (json.workOrders) await tx.workOrder.createMany({ data: json.workOrders });
      if (json.stockMovements) await tx.stockMovement.createMany({ data: json.stockMovements });
      if (json.documents) await tx.document.createMany({ data: json.documents });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
