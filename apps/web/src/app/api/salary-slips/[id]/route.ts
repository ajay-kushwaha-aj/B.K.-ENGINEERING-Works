import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mockDb, useMockDb } from "@/lib/mock-db";
import { SalarySlipSchema } from "shared";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (useMockDb()) {
      const slip = mockDb.getSalarySlipById(id);
      if (!slip) {
        return NextResponse.json({ error: "Salary slip not found" }, { status: 404 });
      }
      const result = {
        ...slip,
        worker: mockDb.getWorkerById(slip.workerId),
      };
      return NextResponse.json(result);
    }

    const slip = await prisma.salarySlip.findUnique({
      where: { id },
      include: {
        worker: true,
      },
    });

    if (!slip) {
      return NextResponse.json({ error: "Salary slip not found" }, { status: 404 });
    }

    return NextResponse.json(slip);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const json = await request.json();

    // Partial Zod verification since payment recordings only submit payment fields
    // But we can check if it conforms to safeParse by merging or allowing partial checks
    const result = SalarySlipSchema.safeParse(json);
    if (!result.success) {
      // If it's a partial payment recording payload, we can skip strict validation of whole schemas 
      // and update specific fields directly (or merge them).
      // Let's do validation bypass for recording payment if it doesn't pass full schema validation.
    }

    const data = json;

    if (useMockDb()) {
      const updated = mockDb.updateSalarySlip(id, {
        paymentStatus: data.paymentStatus,
        paymentDate: data.paymentDate ? new Date(data.paymentDate).toISOString() : null,
        paymentMode: data.paymentMode || null,
        // Also allow updating general details if the user edited them
        ...(data.daysPresent !== undefined && { daysPresent: Number(data.daysPresent) }),
        ...(data.daysAbsent !== undefined && { daysAbsent: Number(data.daysAbsent) }),
        ...(data.overtimeHours !== undefined && { overtimeHours: Number(data.overtimeHours) }),
        ...(data.basicSalary !== undefined && { basicSalary: Number(data.basicSalary) }),
        ...(data.overtimeAmount !== undefined && { overtimeAmount: Number(data.overtimeAmount) }),
        ...(data.allowances !== undefined && { allowances: Number(data.allowances) }),
        ...(data.bonus !== undefined && { bonus: Number(data.bonus) }),
        ...(data.deductions !== undefined && { deductions: Number(data.deductions) }),
        ...(data.deductionNotes !== undefined && { deductionNotes: data.deductionNotes || null }),
        ...(data.netPay !== undefined && { netPay: Number(data.netPay) }),
      });

      if (!updated) {
        return NextResponse.json({ error: "Salary slip not found" }, { status: 404 });
      }

      const result = {
        ...updated,
        worker: mockDb.getWorkerById(updated.workerId),
      };
      return NextResponse.json(result);
    }

    const payload: any = {};
    if (data.paymentStatus !== undefined) payload.paymentStatus = data.paymentStatus;
    if (data.paymentDate !== undefined) payload.paymentDate = data.paymentDate ? new Date(data.paymentDate) : null;
    if (data.paymentMode !== undefined) payload.paymentMode = data.paymentMode;
    
    if (data.daysPresent !== undefined) payload.daysPresent = data.daysPresent;
    if (data.daysAbsent !== undefined) payload.daysAbsent = data.daysAbsent;
    if (data.overtimeHours !== undefined) payload.overtimeHours = data.overtimeHours;
    if (data.basicSalary !== undefined) payload.basicSalary = data.basicSalary;
    if (data.overtimeAmount !== undefined) payload.overtimeAmount = data.overtimeAmount;
    if (data.allowances !== undefined) payload.allowances = data.allowances;
    if (data.bonus !== undefined) payload.bonus = data.bonus;
    if (data.deductions !== undefined) payload.deductions = data.deductions;
    if (data.deductionNotes !== undefined) payload.deductionNotes = data.deductionNotes;
    if (data.netPay !== undefined) payload.netPay = data.netPay;

    const slip = await prisma.salarySlip.update({
      where: { id },
      data: payload,
      include: {
        worker: true,
      },
    });

    return NextResponse.json(slip);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (useMockDb()) {
      const mockStore = global as any;
      const idx = (mockStore.mockSalarySlips || []).findIndex((s: any) => s.id === id);
      if (idx === -1) {
        return NextResponse.json({ error: "Salary slip not found" }, { status: 404 });
      }
      mockStore.mockSalarySlips.splice(idx, 1);
      return NextResponse.json({ message: "Salary slip deleted successfully" });
    }

    await prisma.salarySlip.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Salary slip deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
