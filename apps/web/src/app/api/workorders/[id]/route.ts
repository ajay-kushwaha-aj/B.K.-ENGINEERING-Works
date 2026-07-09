import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mockDb, useMockDb } from "@/lib/mock-db";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const json = await request.json();
    const { status, actualCost, completionDate } = json;

    if (useMockDb()) {
      const updated = mockDb.updateWorkOrder(id, {
        ...(status && { status }),
        ...(actualCost !== undefined && { actualCost: actualCost ? Number(actualCost) : null }),
        ...(completionDate !== undefined && { completionDate: completionDate || null }),
      });
      if (!updated) return NextResponse.json({ error: "Work order not found" }, { status: 404 });
      return NextResponse.json({ ...updated, customer: mockDb.getCustomerById(updated.customerId) });
    }

    const data: any = {};
    if (status) data.status = status;
    if (actualCost !== undefined) data.actualCost = actualCost ? Number(actualCost) : null;
    if (completionDate !== undefined) data.completionDate = completionDate ? new Date(completionDate) : null;

    const updated = await prisma.workOrder.update({
      where: { id },
      data,
    });
    const customer = await prisma.customer.findUnique({ where: { id: updated.customerId } });
    return NextResponse.json({ ...updated, customer });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
