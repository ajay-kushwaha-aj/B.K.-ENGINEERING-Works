import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mockDb, useMockDb } from "@/lib/mock-db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get("month") || "", 10);
    const year = parseInt(searchParams.get("year") || "", 10);

    if (isNaN(month) || isNaN(year) || month < 1 || month > 12) {
      return NextResponse.json({ error: "Invalid month or year parameters" }, { status: 400 });
    }

    if (useMockDb()) {
      const slips = mockDb.getSalarySlips().filter(s => s.month === month && s.year === year);
      
      let totalBasic = 0;
      let totalOvertime = 0;
      let totalAllowances = 0;
      let totalBonus = 0;
      let totalDeductions = 0;
      let totalNetPay = 0;
      let totalPaid = 0;
      let totalPending = 0;

      const breakdown = slips.map(s => {
        const worker = mockDb.getWorkerById(s.workerId);
        
        const basic = Number(s.basicSalary);
        const overtime = Number(s.overtimeAmount);
        const allowances = Number(s.allowances);
        const bonus = Number(s.bonus);
        const deductions = Number(s.deductions);
        const net = Number(s.netPay);

        totalBasic += basic;
        totalOvertime += overtime;
        totalAllowances += allowances;
        totalBonus += bonus;
        totalDeductions += deductions;
        totalNetPay += net;

        if (s.paymentStatus === "PAID") {
          totalPaid += net;
        } else if (s.paymentStatus === "PARTIAL") {
          // In mock mode we can treat partial as paid/pending splits or full pending.
          // Let's assume half paid or treat full pending.
          totalPaid += net / 2;
          totalPending += net / 2;
        } else {
          totalPending += net;
        }

        return {
          id: s.id,
          slipNumber: s.slipNumber,
          workerId: s.workerId,
          workerName: worker?.name || "Unknown",
          designation: worker?.designation || "Unknown",
          salaryType: worker?.salaryType || "MONTHLY",
          daysPresent: Number(s.daysPresent),
          daysAbsent: Number(s.daysAbsent),
          basicSalary: basic,
          netPay: net,
          paymentStatus: s.paymentStatus,
          paymentDate: s.paymentDate,
          paymentMode: s.paymentMode,
        };
      });

      return NextResponse.json({
        month,
        year,
        summary: {
          totalBasic,
          totalOvertime,
          totalAllowances,
          totalBonus,
          totalDeductions,
          totalNetPay,
          totalPaid,
          totalPending,
          slipCount: slips.length,
        },
        breakdown,
      });
    }

    // PostgreSQL path
    const slips = await prisma.salarySlip.findMany({
      where: {
        month,
        year,
      },
      include: {
        worker: true,
      },
    });

    let totalBasic = 0;
    let totalOvertime = 0;
    let totalAllowances = 0;
    let totalBonus = 0;
    let totalDeductions = 0;
    let totalNetPay = 0;
    let totalPaid = 0;
    let totalPending = 0;

    const breakdown = slips.map(s => {
      const basic = Number(s.basicSalary);
      const overtime = Number(s.overtimeAmount);
      const allowances = Number(s.allowances);
      const bonus = Number(s.bonus);
      const deductions = Number(s.deductions);
      const net = Number(s.netPay);

      totalBasic += basic;
      totalOvertime += overtime;
      totalAllowances += allowances;
      totalBonus += bonus;
      totalDeductions += deductions;
      totalNetPay += net;

      if (s.paymentStatus === "PAID") {
        totalPaid += net;
      } else if (s.paymentStatus === "PARTIAL") {
        totalPaid += net / 2; // approximation
        totalPending += net / 2;
      } else {
        totalPending += net;
      }

      return {
        id: s.id,
        slipNumber: s.slipNumber,
        workerId: s.workerId,
        workerName: s.worker?.name || "Unknown",
        designation: s.worker?.designation || "Unknown",
        salaryType: s.worker?.salaryType || "MONTHLY",
        daysPresent: Number(s.daysPresent),
        daysAbsent: Number(s.daysAbsent),
        basicSalary: basic,
        netPay: net,
        paymentStatus: s.paymentStatus,
        paymentDate: s.paymentDate,
        paymentMode: s.paymentMode,
      };
    });

    return NextResponse.json({
      month,
      year,
      summary: {
        totalBasic,
        totalOvertime,
        totalAllowances,
        totalBonus,
        totalDeductions,
        totalNetPay,
        totalPaid,
        totalPending,
        slipCount: slips.length,
      },
      breakdown,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
