import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mockDb, useMockDb } from "@/lib/mock-db";
import { WorkerSchema } from "shared";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (useMockDb()) {
      const worker = mockDb.getWorkerById(id);
      if (!worker) {
        return NextResponse.json({ error: "Worker not found" }, { status: 404 });
      }
      return NextResponse.json(worker);
    }

    const worker = await prisma.worker.findUnique({
      where: { id },
    });

    if (!worker) {
      return NextResponse.json({ error: "Worker not found" }, { status: 404 });
    }

    return NextResponse.json(worker);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const json = await request.json();
    const result = WorkerSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json({ error: result.error.format() }, { status: 400 });
    }

    const data = result.data;

    if (useMockDb()) {
      const updated = mockDb.updateWorker(id, {
        name: data.name,
        fatherName: data.fatherName || null,
        designation: data.designation,
        department: data.department || null,
        phone: data.phone,
        email: data.email || null,
        address: data.address || null,
        aadharNumber: data.aadharNumber || null,
        panNumber: data.panNumber || null,
        photoUrl: data.photoUrl || null,
        idProofUrl: data.idProofUrl || null,
        joiningDate: new Date(data.joiningDate).toISOString(),
        status: data.status as any,
        salaryType: data.salaryType as any,
        basicSalary: Number(data.basicSalary),
        bankName: data.bankName || null,
        bankAccount: data.bankAccount || null,
        ifsc: data.ifsc || null,
        upiId: data.upiId || null,
      });
      if (!updated) {
        return NextResponse.json({ error: "Worker not found" }, { status: 404 });
      }
      return NextResponse.json(updated);
    }

    const worker = await prisma.worker.update({
      where: { id },
      data: {
        name: data.name,
        fatherName: data.fatherName,
        designation: data.designation,
        department: data.department,
        phone: data.phone,
        email: data.email,
        address: data.address,
        aadharNumber: data.aadharNumber,
        panNumber: data.panNumber,
        photoUrl: data.photoUrl,
        idProofUrl: data.idProofUrl,
        joiningDate: new Date(data.joiningDate),
        status: data.status as any,
        salaryType: data.salaryType as any,
        basicSalary: data.basicSalary,
        bankName: data.bankName,
        bankAccount: data.bankAccount,
        ifsc: data.ifsc,
        upiId: data.upiId,
      },
    });

    return NextResponse.json(worker);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (useMockDb()) {
      const success = mockDb.deleteWorker(id);
      if (!success) {
        return NextResponse.json({ error: "Worker not found" }, { status: 404 });
      }
      return NextResponse.json({ message: "Worker deleted successfully" });
    }

    // Wrap in a transaction to clean up attendance and salary slips
    await prisma.$transaction(async (tx) => {
      await tx.attendance.deleteMany({ where: { workerId: id } });
      await tx.salarySlip.deleteMany({ where: { workerId: id } });
      await tx.worker.delete({ where: { id } });
    });

    return NextResponse.json({ message: "Worker deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
