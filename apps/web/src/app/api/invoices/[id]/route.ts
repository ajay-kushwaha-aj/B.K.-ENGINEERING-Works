import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
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
