import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mockDb, useMockDb } from "@/lib/mock-db";
import { SalarySlipSchema } from "shared";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workerId = searchParams.get("workerId") || "";
    const month = searchParams.get("month") ? parseInt(searchParams.get("month") || "", 10) : null;
    const year = searchParams.get("year") ? parseInt(searchParams.get("year") || "", 10) : null;
    const paymentStatus = searchParams.get("paymentStatus") || "";

    if (useMockDb()) {
      let filtered = mockDb.getSalarySlips();
      if (workerId) {
        filtered = filtered.filter(s => s.workerId === workerId);
      }
      if (month) {
        filtered = filtered.filter(s => s.month === month);
      }
      if (year) {
        filtered = filtered.filter(s => s.year === year);
      }
      if (paymentStatus) {
        filtered = filtered.filter(s => s.paymentStatus === paymentStatus);
      }

      // Inject worker info for UI display
      const result = filtered.map(slip => ({
        ...slip,
        worker: mockDb.getWorkerById(slip.workerId),
      }));
      return NextResponse.json(result);
    }

    const where: any = {};
    if (workerId) {
      where.workerId = workerId;
    }
    if (month) {
      where.month = month;
    }
    if (year) {
      where.year = year;
    }
    if (paymentStatus) {
      where.paymentStatus = paymentStatus as any;
    }

    const slips = await prisma.salarySlip.findMany({
      where,
      include: {
        worker: true,
      },
      orderBy: { generatedAt: "desc" },
    });

    return NextResponse.json(slips);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const result = SalarySlipSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json({ error: result.error.format() }, { status: 400 });
    }

    const inputData = result.data;

    if (useMockDb()) {
      const added = mockDb.addSalarySlip({
        workerId: inputData.workerId,
        month: inputData.month,
        year: inputData.year,
        daysPresent: Number(inputData.daysPresent),
        daysAbsent: Number(inputData.daysAbsent),
        overtimeHours: Number(inputData.overtimeHours),
        basicSalary: Number(inputData.basicSalary),
        overtimeAmount: Number(inputData.overtimeAmount),
        allowances: Number(inputData.allowances),
        bonus: Number(inputData.bonus),
        deductions: Number(inputData.deductions),
        deductionNotes: inputData.deductionNotes || null,
        netPay: Number(inputData.netPay),
        paymentStatus: inputData.paymentStatus as any,
        paymentDate: inputData.paymentDate ? new Date(inputData.paymentDate).toISOString() : null,
        paymentMode: inputData.paymentMode as any || null,
      });
      // Append worker info to match DB payload
      const fullAdded = {
        ...added,
        worker: mockDb.getWorkerById(added.workerId),
      };
      return NextResponse.json(fullAdded, { status: 201 });
    }

    // PostgreSQL path using transaction for sequence safety:
    const salarySlip = await prisma.$transaction(async (tx) => {
      const formattedMonth = String(inputData.month).padStart(2, "0");
      const prefix = `BK-SAL-${inputData.year}-${formattedMonth}-`;

      const latest = await tx.salarySlip.findFirst({
        where: {
          slipNumber: {
            startsWith: prefix,
          },
        },
        orderBy: { slipNumber: "desc" },
      });

      let nextSeq = 1;
      if (latest) {
        const parts = latest.slipNumber.split("-");
        const lastSeq = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(lastSeq)) {
          nextSeq = lastSeq + 1;
        }
      }

      const formattedSeq = String(nextSeq).padStart(4, "0");
      const slipNumber = `${prefix}${formattedSeq}`;

      return tx.salarySlip.create({
        data: {
          slipNumber,
          workerId: inputData.workerId,
          month: inputData.month,
          year: inputData.year,
          daysPresent: inputData.daysPresent,
          daysAbsent: inputData.daysAbsent,
          overtimeHours: inputData.overtimeHours,
          basicSalary: inputData.basicSalary,
          overtimeAmount: inputData.overtimeAmount,
          allowances: inputData.allowances,
          bonus: inputData.bonus,
          deductions: inputData.deductions,
          deductionNotes: inputData.deductionNotes,
          netPay: inputData.netPay,
          paymentStatus: inputData.paymentStatus as any,
          paymentDate: inputData.paymentDate ? new Date(inputData.paymentDate) : null,
          paymentMode: inputData.paymentMode as any,
        },
        include: {
          worker: true,
        },
      });
    });

    return NextResponse.json(salarySlip, { status: 201 });
  } catch (error: any) {
    console.error("Salary slip generate error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
