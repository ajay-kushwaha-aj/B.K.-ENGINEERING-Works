import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mockDb, useMockDb } from "@/lib/mock-db";

export async function GET() {
  try {
    if (useMockDb()) {
      const purchases = mockDb.getPurchases().map((p) => ({
        ...p,
        vendor: mockDb.getVendorById(p.vendorId),
      }));
      return NextResponse.json(purchases);
    }
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

    if (useMockDb()) {
      const purchase = mockDb.addPurchase({
        vendorId,
        purchaseDate: purchaseDate || new Date().toISOString().split("T")[0],
        items,
        gstTotal: Number(gstTotal),
        grandTotal: Number(grandTotal),
        paymentStatus: paymentStatus || "UNPAID",
      });
      return NextResponse.json({ ...purchase, vendor: mockDb.getVendorById(vendorId) }, { status: 201 });
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
