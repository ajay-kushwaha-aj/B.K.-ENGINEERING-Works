import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { useMockDb, mockDb } from "@/lib/mock-db";

// GET /api/attendance?date=YYYY-MM-DD
// Returns all active workers with their attendance status for the selected date
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const targetDate = dateParam ? new Date(dateParam) : new Date();

    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);

    if (useMockDb()) {
      const workers = mockDb.getWorkers().filter(w => w.status === "ACTIVE");
      const attendance = mockDb.getAttendanceForDate(targetDate);
      
      const result = workers.map(worker => {
        const record = attendance.find(a => a.workerId === worker.id);
        return {
          worker,
          attendance: record || null
        };
      });
      return NextResponse.json(result);
    }

    // PostgreSQL path
    const workers = await prisma.worker.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" }
    });

    const attendance = await prisma.attendance.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    const result = workers.map(worker => {
      const record = attendance.find(a => a.workerId === worker.id);
      return {
        worker,
        attendance: record || null
      };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/attendance
// Bulk saves attendance logs for a specific date
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, logs } = body; // date: YYYY-MM-DD, logs: [{ workerId, status, overtimeHours, notes }]
    
    if (!date || !Array.isArray(logs)) {
      return NextResponse.json({ error: "Missing date or logs array" }, { status: 400 });
    }

    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);

    if (useMockDb()) {
      for (const log of logs) {
        mockDb.saveAttendance({
          workerId: log.workerId,
          date: targetDate.toISOString(),
          status: log.status,
          overtimeHours: log.overtimeHours || 0,
          notes: log.notes || null
        });
      }
      return NextResponse.json({ message: "Attendance saved successfully in mock database" });
    }

    // PostgreSQL path
    const queries = logs.map(async (log) => {
      // Find if record exists for worker on this day
      const existing = await prisma.attendance.findFirst({
        where: {
          workerId: log.workerId,
          date: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      });

      if (existing) {
        return prisma.attendance.update({
          where: { id: existing.id },
          data: {
            status: log.status,
            overtimeHours: log.overtimeHours || 0,
            notes: log.notes || null
          }
        });
      } else {
        return prisma.attendance.create({
          data: {
            workerId: log.workerId,
            date: startOfDay,
            status: log.status,
            overtimeHours: log.overtimeHours || 0,
            notes: log.notes || null
          }
        });
      }
    });

    await Promise.all(queries);

    return NextResponse.json({ message: "Attendance sheet updated successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
