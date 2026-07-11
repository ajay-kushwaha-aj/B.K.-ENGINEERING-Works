import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/api-auth";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const requester = await getCurrentUser(request);
    if (!requester) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contract = await prisma.contract.findUnique({
      where: { id },
      include: { sites: true }
    });

    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    return NextResponse.json(contract);
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
    const { name, contractNumber, description } = json;

    if (!name || !contractNumber) {
      return NextResponse.json({ error: "Name and Contract Number are required" }, { status: 400 });
    }

    // Check duplicate contract number
    const duplicate = await prisma.contract.findFirst({
      where: {
        contractNumber,
        id: { not: id }
      }
    });
    if (duplicate) {
      return NextResponse.json({ error: "Contract number is already in use by another contract" }, { status: 400 });
    }

    const updated = await prisma.contract.update({
      where: { id },
      data: {
        name,
        contractNumber,
        description: description || null
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

    // Get all site IDs for this contract
    const sites = await prisma.site.findMany({ where: { contractId: id } });
    const siteIds = sites.map(s => s.id);

    // Perform safety cleanup transaction
    await prisma.$transaction(async (tx) => {
      // 1. Delete site access records for these sites or contract
      await tx.siteAccess.deleteMany({
        where: {
          OR: [
            { contractId: id },
            { siteId: { in: siteIds } }
          ]
        }
      });

      // 2. Clear attendance site association
      await tx.attendance.updateMany({
        where: { siteId: { in: siteIds } },
        data: { siteId: null }
      });

      // 3. Delete other site dependencies
      await tx.measurementSheet.deleteMany({ where: { siteId: { in: siteIds } } });
      await tx.materialIssue.deleteMany({ where: { siteId: { in: siteIds } } });
      await tx.laborDeployment.deleteMany({ where: { siteId: { in: siteIds } } });

      // 4. Delete the sites
      await tx.site.deleteMany({ where: { contractId: id } });

      // 5. Delete the contract
      await tx.contract.delete({ where: { id } });
    });

    return NextResponse.json({ message: "Contract deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
