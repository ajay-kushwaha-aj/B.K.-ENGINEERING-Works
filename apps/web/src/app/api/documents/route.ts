import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");

    

    const where: any = {};
    if (customerId) where.customerId = customerId;

    const docs = await prisma.document.findMany({
      where,
      orderBy: { uploadedAt: "desc" },
    });
    return NextResponse.json(docs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { customerId, type, fileName, fileUrl } = json;

    if (!type || !fileName || !fileUrl) {
      return NextResponse.json({ error: "type, fileName, and fileUrl are required" }, { status: 400 });
    }

    

    const doc = await prisma.document.create({
      data: {
        customerId: customerId || null,
        type,
        fileName,
        fileUrl,
      },
    });
    return NextResponse.json(doc, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    

    await prisma.document.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
