import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mockDb, useMockDb } from "@/lib/mock-db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");

    if (useMockDb()) {
      let docs = mockDb.getDocuments();
      if (customerId) docs = docs.filter((d) => d.customerId === customerId);
      return NextResponse.json(docs);
    }

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

    if (useMockDb()) {
      const doc = mockDb.addDocument({
        customerId: customerId || null,
        type,
        fileName,
        fileUrl,
      });
      return NextResponse.json(doc, { status: 201 });
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

    if (useMockDb()) {
      const deleted = mockDb.deleteDocument(id);
      if (!deleted) return NextResponse.json({ error: "Document not found" }, { status: 404 });
      return NextResponse.json({ success: true });
    }

    await prisma.document.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
