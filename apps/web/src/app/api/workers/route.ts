import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mockDb, useMockDb } from "@/lib/mock-db";
import { WorkerSchema } from "shared";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const department = searchParams.get("department") || "";
    const designation = searchParams.get("designation") || "";

    if (useMockDb()) {
      let filtered = mockDb.getWorkers();
      if (search) {
        filtered = filtered.filter(w => 
          w.name.toLowerCase().includes(search.toLowerCase()) || 
          (w.designation && w.designation.toLowerCase().includes(search.toLowerCase())) ||
          (w.department && w.department.toLowerCase().includes(search.toLowerCase()))
        );
      }
      if (status) {
        filtered = filtered.filter(w => w.status === status);
      }
      if (department) {
        filtered = filtered.filter(w => w.department === department);
      }
      if (designation) {
        filtered = filtered.filter(w => w.designation === designation);
      }
      return NextResponse.json(filtered);
    }

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { designation: { contains: search, mode: "insensitive" } },
        { department: { contains: search, mode: "insensitive" } },
      ];
    }
    if (status) {
      where.status = status as any;
    }
    if (department) {
      where.department = department;
    }
    if (designation) {
      where.designation = designation;
    }

    const workers = await prisma.worker.findMany({
      where,
      orderBy: { name: "asc" },
    });

    return NextResponse.json(workers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const result = WorkerSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json({ error: result.error.format() }, { status: 400 });
    }

    const data = result.data;

    if (useMockDb()) {
      const added = mockDb.addWorker({
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
      return NextResponse.json(added, { status: 201 });
    }

    const worker = await prisma.worker.create({
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

    return NextResponse.json(worker, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
