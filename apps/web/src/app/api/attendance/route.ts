import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasSiteAccess } from "@/lib/api-auth";

// GET /api/attendance?date=YYYY-MM-DD&siteId=...
// Returns all active workers with their attendance status for the selected date and site
export async function GET(request: Request) {
  try {
    const requester = await getCurrentUser(request);
    if (!requester) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const siteId = searchParams.get("siteId");
    const targetDate = dateParam ? new Date(dateParam) : new Date();

    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);

    // If siteId is specified, check permission
    if (siteId) {
      const site = await prisma.site.findUnique({ where: { id: siteId } });
      if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 });
      const contractId = site.contractId;

      const allowed = await hasSiteAccess(requester.id, requester.role, contractId, siteId, "viewProgress");
      if (!allowed) {
        return NextResponse.json({ error: "Forbidden: You do not have permission to view attendance for this site" }, { status: 403 });
      }
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
        },
        ...(siteId && { siteId })
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
// Bulk saves attendance logs for a specific date and site
export async function POST(request: Request) {
  try {
    const requester = await getCurrentUser(request);
    if (!requester) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { date, logs, siteId } = body; // date: YYYY-MM-DD, logs: [{ workerId, status, overtimeHours, notes }], siteId: string
    
    if (!date || !Array.isArray(logs)) {
      return NextResponse.json({ error: "Missing date or logs array" }, { status: 400 });
    }

    // Check site permissions if siteId is present
    if (siteId) {
      const site = await prisma.site.findUnique({ where: { id: siteId } });
      if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 });
      const contractId = site.contractId;

      const allowed = await hasSiteAccess(requester.id, requester.role, contractId, siteId, "attendance");
      if (!allowed) {
        return NextResponse.json({ error: "Forbidden: You do not have permission to mark attendance for this site" }, { status: 403 });
      }
    }

    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);



    // PostgreSQL path
    const queries = logs.map(async (log) => {
      // Find if record exists for worker on this day (and site if filtered)
      const existing = await prisma.attendance.findFirst({
        where: {
          workerId: log.workerId,
          date: {
            gte: startOfDay,
            lte: endOfDay
          },
          ...(siteId && { siteId })
        }
      });

      if (existing) {
        return prisma.attendance.update({
          where: { id: existing.id },
          data: {
            status: log.status,
            overtimeHours: log.overtimeHours || 0,
            notes: log.notes || null,
            siteId: siteId || null,
            createdByUserId: requester.id,
            createdByName: requester.name
          }
        });
      } else {
        return prisma.attendance.create({
          data: {
            workerId: log.workerId,
            date: startOfDay,
            status: log.status,
            overtimeHours: log.overtimeHours || 0,
            notes: log.notes || null,
            siteId: siteId || null,
            createdByUserId: requester.id,
            createdByName: requester.name
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
