import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mockDb, useMockDb } from "@/lib/mock-db";
import { CustomerSchema } from "shared";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    if (useMockDb()) {
      const all = mockDb.getCustomers();
      const filtered = all.filter(c => 
        c.name.toLowerCase().includes(search.toLowerCase()) || 
        (c.companyName && c.companyName.toLowerCase().includes(search.toLowerCase()))
      );
      return NextResponse.json(filtered);
    }

    const customers = await prisma.customer.findMany({
      where: {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { companyName: { contains: search, mode: "insensitive" } },
        ],
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(customers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const result = CustomerSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json({ error: result.error.format() }, { status: 400 });
    }

    if (useMockDb()) {
      const added = mockDb.addCustomer(result.data as any);
      return NextResponse.json(added, { status: 201 });
    }

    const customer = await prisma.customer.create({
      data: result.data as any,
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
