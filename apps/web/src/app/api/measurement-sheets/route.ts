import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasSiteAccess } from "@/lib/api-auth";

export async function GET(request: Request) {
  try {
    const requester = await getCurrentUser(request);
    if (!requester) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");

    if (!siteId) {
      return NextResponse.json({ error: "siteId is required" }, { status: 400 });
    }

    // Load site to get contractId for permission check
    let contractId = "";
    
      const site = await prisma.site.findUnique({ where: { id: siteId } });
      if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 });
      contractId = site.contractId;
    

    // Enforce site-wise permission check
    const allowed = await hasSiteAccess(requester.id, requester.role, contractId, siteId, "viewProgress");
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden: You do not have access to this site's details" }, { status: 403 });
    }

    

    // Postgres path
    const sheets = await prisma.measurementSheet.findMany({
      where: { siteId },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(sheets);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const requester = await getCurrentUser(request);
    if (!requester) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();
    const { siteId, boqItem, description, qty, rate } = json;

    if (!siteId || !boqItem || qty === undefined || rate === undefined) {
      return NextResponse.json({ error: "siteId, boqItem, qty, and rate are required" }, { status: 400 });
    }

    // Load site to get contractId for permission check
    let contractId = "";
    
      const site = await prisma.site.findUnique({ where: { id: siteId } });
      if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 });
      contractId = site.contractId;
    

    // Enforce site-wise permission check for editing measurements
    const allowed = await hasSiteAccess(requester.id, requester.role, contractId, siteId, "measurement");
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden: You do not have permission to log measurements for this site" }, { status: 403 });
    }

    

    // Postgres path
    const newSheet = await prisma.measurementSheet.create({
      data: {
        siteId,
        boqItem,
        description: description || null,
        qty: Number(qty),
        rate: Number(rate),
        amount: Number(qty) * Number(rate),
        createdByUserId: requester.id,
        createdByName: requester.name
      }
    });

    return NextResponse.json(newSheet);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
