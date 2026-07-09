import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mockDb, useMockDb } from "@/lib/mock-db";
import { ProductSchema } from "shared";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    if (useMockDb()) {
      const all = mockDb.getProducts();
      const filtered = all.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase()) || 
        (p.hsnCode && p.hsnCode.includes(search))
      );
      return NextResponse.json(filtered);
    }

    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { hsnCode: { contains: search, mode: "insensitive" } },
        ],
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(products);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const result = ProductSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json({ error: result.error.format() }, { status: 400 });
    }

    if (useMockDb()) {
      const added = mockDb.addProduct(result.data as any);
      return NextResponse.json(added, { status: 201 });
    }

    const product = await prisma.product.create({
      data: result.data as any,
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
