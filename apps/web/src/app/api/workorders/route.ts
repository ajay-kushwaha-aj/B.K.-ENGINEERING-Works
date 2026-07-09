import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    

    const where: any = {};
    if (status) where.status = status;

    const wos = await prisma.workOrder.findMany({
      where,
      orderBy: { woNumber: "desc" },
    });
    // Hydrate customer data client-side or resolve here
    const hydrated = await Promise.all(
      wos.map(async (w) => {
        const customer = await prisma.customer.findUnique({ where: { id: w.customerId } });
        return { ...w, customer };
      })
    );

    return NextResponse.json(hydrated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { customerId, siteName, location, startDate, completionDate, projectManager, description, estimatedCost } = json;

    if (!customerId || !siteName) {
      return NextResponse.json({ error: "customerId and siteName are required" }, { status: 400 });
    }

    

    const wo = await prisma.$transaction(async (tx) => {
      const currentYear = new Date().getFullYear();
      const latest = await tx.workOrder.findFirst({
        where: { woNumber: { startsWith: `WO-${currentYear}-` } },
        orderBy: { woNumber: "desc" },
      });
      let nextSeq = 1;
      if (latest) {
        const parts = latest.woNumber.split("-");
        const lastSeq = parseInt(parts[2], 10);
        if (!isNaN(lastSeq)) nextSeq = lastSeq + 1;
      }
      const woNumber = `WO-${currentYear}-${String(nextSeq).padStart(6, "0")}`;

      return tx.workOrder.create({
        data: {
          woNumber,
          customerId,
          siteName,
          location: location || null,
          startDate: startDate ? new Date(startDate) : null,
          completionDate: completionDate ? new Date(completionDate) : null,
          projectManager: projectManager || null,
          description: description || null,
          status: "OPEN",
          estimatedCost: estimatedCost ? Number(estimatedCost) : null,
          actualCost: null,
        },
      });
    });

    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    return NextResponse.json({ ...wo, customer }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
