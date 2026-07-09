import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SalarySlipSchema } from "shared";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workerId = searchParams.get("workerId") || "";
    const month = searchParams.get("month") ? parseInt(searchParams.get("month") || "", 10) : null;
    const year = searchParams.get("year") ? parseInt(searchParams.get("year") || "", 10) : null;
    const paymentStatus = searchParams.get("paymentStatus") || "";

    

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
