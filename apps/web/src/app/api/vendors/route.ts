import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    
    const vendors = await prisma.vendor.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(vendors);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { name, gstin, phone, email, address, bankDetails } = json;

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    

    const vendor = await prisma.vendor.create({
      data: {
        name,
        gstin: gstin || null,
        phone: phone || null,
        email: email || null,
        address: address || null,
        bankDetails: bankDetails || null,
      },
    });

    return NextResponse.json(vendor, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
