import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { WorkerSchema } from "shared";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    

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
