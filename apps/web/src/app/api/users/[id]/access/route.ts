import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mockDb, useMockDb } from "@/lib/mock-db";
import { getCurrentUser } from "@/lib/api-auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const requester = await getCurrentUser(request);
    if (!requester || requester.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { id: userId } = await params;

    if (useMockDb()) {
      const accesses = mockDb.getSiteAccessByUser(userId);
      return NextResponse.json(accesses);
    }

    const accesses = await prisma.siteAccess.findMany({
      where: { userId },
      include: {
        contract: true,
        site: true
      }
    });

    return NextResponse.json(accesses);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const requester = await getCurrentUser(request);
    if (!requester || requester.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { id: userId } = await params;
    const json = await request.json();
    const { contractId, siteId, permissions } = json;

    if (!contractId) {
      return NextResponse.json({ error: "contractId is required" }, { status: 400 });
    }

    const defaultPerms = {
      attendance: false,
      measurement: false,
      materialRequest: false,
      viewProgress: true,
      ...(permissions || {})
    };

    if (useMockDb()) {
      // Remove any existing for this exact contract & site combination to prevent duplicate keys
      const existing = mockDb.getSiteAccessByUser(userId);
      const duplicate = existing.find(a => a.contractId === contractId && a.siteId === (siteId || null));
      if (duplicate) {
        mockDb.deleteSiteAccess(duplicate.id);
      }

      const newAccess = mockDb.addSiteAccess({
        userId,
        contractId,
        siteId: siteId || null,
        permissions: defaultPerms,
        grantedBy: requester.id
      });

      return NextResponse.json(newAccess);
    }

    // Postgres path
    // Remove duplicate unique constraints first if any
    await prisma.siteAccess.deleteMany({
      where: {
        userId,
        contractId,
        siteId: siteId || null
      }
    });

    const newAccess = await prisma.siteAccess.create({
      data: {
        userId,
        contractId,
        siteId: siteId || null,
        permissions: defaultPerms,
        grantedBy: requester.id
      }
    });

    return NextResponse.json(newAccess);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const requester = await getCurrentUser(request);
    if (!requester || requester.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const accessId = searchParams.get("accessId");

    if (!accessId) {
      return NextResponse.json({ error: "accessId query parameter is required" }, { status: 400 });
    }

    if (useMockDb()) {
      const deleted = mockDb.deleteSiteAccess(accessId);
      return NextResponse.json({ success: deleted });
    }

    await prisma.siteAccess.delete({
      where: { id: accessId }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
