import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: productId } = await params;
    
    const movements = await prisma.stockMovement.findMany({
      where: { productId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(movements);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: productId } = await params;
    const json = await request.json();
    const { type, qty, reason } = json;

    if (!type || qty === undefined) {
      return NextResponse.json({ error: "type and qty are required" }, { status: 400 });
    }

    

    // Real DB
    const move = await prisma.$transaction(async (tx) => {
      const created = await tx.stockMovement.create({
        data: {
          productId,
          type,
          qty: Number(qty),
          reason: reason || null,
        },
      });

      const movementVal = Number(qty);
      let increment = 0;
      if (type === "IN" || type === "OPENING" || type === "ADJUSTMENT") {
        increment = movementVal;
      } else if (type === "OUT") {
        increment = -movementVal;
      }

      await tx.product.update({
        where: { id: productId },
        data: {
          stockQty: { increment },
        },
      });

      return created;
    });

    return NextResponse.json(move, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
