import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasSiteAccess } from "@/lib/api-auth";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const requester = await getCurrentUser(request);
    if (!requester) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const site = await prisma.site.findUnique({
      where: { id },
      include: { contract: true }
    });

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    return NextResponse.json(site);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const requester = await getCurrentUser(request);
    if (!requester || requester.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const json = await request.json();
    const { name, location, contractId } = json;

    if (!name || !contractId) {
      return NextResponse.json({ error: "Name and Contract ID are required" }, { status: 400 });
    }

    const updated = await prisma.site.update({
      where: { id },
      data: {
        name,
        location: location || null,
        contractId
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const requester = await getCurrentUser(request);
    if (!requester || requester.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Delete site access for this site
      await tx.siteAccess.deleteMany({ where: { siteId: id } });

      // 2. Clear attendance site association
      await tx.attendance.updateMany({
        where: { siteId: id },
        data: { siteId: null }
      });

      // 3. Delete sheets, issues, and deployments
      await tx.measurementSheet.deleteMany({ where: { siteId: id } });
      await tx.materialIssue.deleteMany({ where: { siteId: id } });
      await tx.laborDeployment.deleteMany({ where: { siteId: id } });

      // 4. Delete site
      await tx.site.delete({ where: { id } });
    });

    return NextResponse.json({ message: "Site deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
