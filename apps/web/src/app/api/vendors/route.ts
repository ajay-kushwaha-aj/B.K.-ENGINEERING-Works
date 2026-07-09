import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mockDb, useMockDb } from "@/lib/mock-db";

export async function GET() {
  try {
    if (useMockDb()) {
      return NextResponse.json(mockDb.getVendors());
    }
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

    if (useMockDb()) {
      const vendor = mockDb.addVendor({
        name,
        gstin: gstin || null,
        phone: phone || null,
        email: email || null,
        address: address || null,
        bankDetails: bankDetails || null,
      });
      return NextResponse.json(vendor, { status: 201 });
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
