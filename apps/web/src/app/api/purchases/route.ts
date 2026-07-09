import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    
    const purchases = await prisma.purchase.findMany({
      include: { vendor: true },
      orderBy: { purchaseDate: "desc" },
    });
    return NextResponse.json(purchases);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { vendorId, purchaseDate, items, gstTotal, grandTotal, paymentStatus } = json;

    if (!vendorId || !items || gstTotal === undefined || grandTotal === undefined) {
      return NextResponse.json({ error: "vendorId, items, gstTotal, and grandTotal are required" }, { status: 400 });
    }

    

    // Real DB Path
    const purchase = await prisma.$transaction(async (tx) => {
      const created = await tx.purchase.create({
        data: {
          vendorId,
          purchaseDate: new Date(purchaseDate || new Date()),
          items,
          gstTotal: Number(gstTotal),
          grandTotal: Number(grandTotal),
          paymentStatus: paymentStatus || "UNPAID",
        },
        include: { vendor: true },
      });

      // Stock IN movements for items
      const parsedItems = Array.isArray(items) ? items : JSON.parse(items);
      for (const item of parsedItems) {
        if (item.productId) {
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              type: "IN",
              qty: Number(item.qty),
              reason: `Purchase Entry ${created.id}`,
            },
          });

          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQty: { increment: Number(item.qty) },
            },
          });
        }
      }

      return created;
    });

    return NextResponse.json(purchase, { status: 201 });
  } catch (error: any) {
    console.error("Purchase save error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
