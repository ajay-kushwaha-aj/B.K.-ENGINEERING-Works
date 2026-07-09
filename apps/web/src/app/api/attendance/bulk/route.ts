import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mockDb, useMockDb } from "@/lib/mock-db";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { date } = json;

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }

    if (useMockDb()) {
      const count = mockDb.bulkMarkPresent(date);
      return NextResponse.json({ count });
    }

    // PostgreSQL path:
    // Get all ACTIVE workers
    const activeWorkers = await prisma.worker.findMany({
      where: { status: "ACTIVE" },
    });

    const dayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const dayEnd = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);

    let count = 0;

    for (const worker of activeWorkers) {
      const existing = await prisma.attendance.findFirst({
        where: {
          workerId: worker.id,
          date: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
      });

      if (existing) {
        await prisma.attendance.update({
          where: { id: existing.id },
          data: {
            status: "PRESENT",
            overtimeHours: 0,
            notes: "Bulk marked present",
          },
        });
      } else {
        await prisma.attendance.create({
          data: {
            workerId: worker.id,
            date: new Date(date),
            status: "PRESENT",
            overtimeHours: 0,
            notes: "Bulk marked present",
          },
        });
      }
      count++;
    }

    return NextResponse.json({ count });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
