import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AttendanceSchema } from "shared";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workerId } = await params;
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get("month") || "", 10);
    const year = parseInt(searchParams.get("year") || "", 10);

    if (isNaN(month) || isNaN(year) || month < 1 || month > 12) {
      return NextResponse.json({ error: "Invalid month or year" }, { status: 400 });
    }

    

    // Calculate start and end date for filtering in PostgreSQL
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const records = await prisma.attendance.findMany({
      where: {
        workerId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: "asc" },
    });

    return NextResponse.json(records);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workerId } = await params;
    const json = await request.json();

    // Inject workerId before parsing
    const payload = { ...json, workerId };
    const result = AttendanceSchema.safeParse(payload);

    if (!result.success) {
      return NextResponse.json({ error: result.error.format() }, { status: 400 });
    }

    const data = result.data;

    

    // PostgreSQL Upsert logic:
    // First query if there is an existing attendance record for this worker on this date
    const targetDate = new Date(data.date);
    const dayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const dayEnd = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);

    const existing = await prisma.attendance.findFirst({
      where: {
        workerId: data.workerId,
        date: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
    });

    let savedRecord;
    if (existing) {
      savedRecord = await prisma.attendance.update({
        where: { id: existing.id },
        data: {
          status: data.status as any,
          overtimeHours: data.overtimeHours,
          notes: data.notes,
        },
      });
    } else {
      savedRecord = await prisma.attendance.create({
        data: {
          workerId: data.workerId,
          date: new Date(data.date),
          status: data.status as any,
          overtimeHours: data.overtimeHours,
          notes: data.notes,
        },
      });
    }

    return NextResponse.json(savedRecord, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
