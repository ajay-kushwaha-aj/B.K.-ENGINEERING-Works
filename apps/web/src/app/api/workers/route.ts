import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { WorkerSchema } from "shared";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const department = searchParams.get("department") || "";
    const designation = searchParams.get("designation") || "";

    

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
