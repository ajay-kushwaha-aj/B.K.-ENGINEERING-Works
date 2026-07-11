import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/api-auth";

export async function GET(request: Request) {
  try {
    const requester = await getCurrentUser(request);
    if (!requester) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const contractId = searchParams.get("contractId");

    

    // Postgres path
    if (requester.role === "ADMIN") {
      const sites = await prisma.site.findMany({
        where: contractId ? { contractId } : {},
        include: { contract: true },
        orderBy: { name: "asc" }
      });
      return NextResponse.json(sites);
    }

    // Site Manager
    const accesses = await prisma.siteAccess.findMany({
      where: { userId: requester.id }
    });

    // Check if they have global access for this contract
    const hasAllAccess = accesses.some(a => a.contractId === contractId && a.siteId === null);
    
    if (hasAllAccess && contractId) {
      const sites = await prisma.site.findMany({
        where: { contractId },
        include: { contract: true },
        orderBy: { name: "asc" }
      });
      return NextResponse.json(sites);
    }

    // Filter by specific sites
    const allowedSiteIds = accesses.map(a => a.siteId).filter(Boolean) as string[];
    const sites = await prisma.site.findMany({
      where: {
        id: { in: allowedSiteIds },
        ...(contractId && { contractId })
      },
      include: { contract: true },
      orderBy: { name: "asc" }
    });

    return NextResponse.json(sites);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const requester = await getCurrentUser(request);
    if (!requester || requester.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const json = await request.json();
    const { name, contractId, location } = json;

    if (!name || !contractId) {
      return NextResponse.json({ error: "Name and Contract ID are required" }, { status: 400 });
    }

    

    // Postgres path
    const newSite = await prisma.site.create({
      data: {
        name,
        contractId,
        location: location || null
      }
    });

    return NextResponse.json(newSite);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
