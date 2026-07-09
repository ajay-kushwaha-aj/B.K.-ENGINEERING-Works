import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mockDb, useMockDb } from "@/lib/mock-db";
import { getCurrentUser, hasSiteAccess } from "@/lib/api-auth";

export async function GET(request: Request) {
  try {
    const requester = await getCurrentUser(request);
    if (!requester) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");
    const statusFilter = searchParams.get("status"); // e.g. "PENDING"

    if (useMockDb()) {
      let issues = mockDb.getMaterialIssues();
      if (requester.role === "ADMIN") {
        if (statusFilter) {
          issues = issues.filter(m => m.approvalStatus === statusFilter);
        }
        if (siteId) {
          issues = issues.filter(m => m.siteId === siteId);
        }
        // Map product details
        const mapped = issues.map(issue => ({
          ...issue,
          product: mockDb.getProductById(issue.productId),
          site: mockDb.getSiteById(issue.siteId)
        }));
        return NextResponse.json(mapped);
      }

      // Site Manager: siteId is mandatory
      if (!siteId) {
        return NextResponse.json({ error: "siteId is required" }, { status: 400 });
      }

      const site = mockDb.getSiteById(siteId);
      if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 });

      // Permission check
      const allowed = await hasSiteAccess(requester.id, requester.role, site.contractId, siteId, "viewProgress");
      if (!allowed) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const filtered = issues.filter(m => m.siteId === siteId);
      const mapped = filtered.map(issue => ({
        ...issue,
        product: mockDb.getProductById(issue.productId),
        site: site
      }));
      return NextResponse.json(mapped);
    }

    // Postgres path
    if (requester.role === "ADMIN") {
      const issues = await prisma.materialIssue.findMany({
        where: {
          ...(statusFilter && { approvalStatus: statusFilter as any }),
          ...(siteId && { siteId })
        },
        include: {
          product: true,
          site: true
        },
        orderBy: { createdAt: "desc" }
      });
      return NextResponse.json(issues);
    }

    // Site Manager
    if (!siteId) {
      return NextResponse.json({ error: "siteId is required" }, { status: 400 });
    }

    const site = await prisma.site.findUnique({ where: { id: siteId } });
    if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 });

    const allowed = await hasSiteAccess(requester.id, requester.role, site.contractId, siteId, "viewProgress");
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const issues = await prisma.materialIssue.findMany({
      where: { siteId },
      include: {
        product: true,
        site: true
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(issues);
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
    const { siteId, productId, qty, reason } = json;

    if (!siteId || !productId || qty === undefined) {
      return NextResponse.json({ error: "siteId, productId, and qty are required" }, { status: 400 });
    }

    // Load site to get contractId for permission check
    let contractId = "";
    if (useMockDb()) {
      const site = mockDb.getSiteById(siteId);
      if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 });
      contractId = site.contractId;
    } else {
      const site = await prisma.site.findUnique({ where: { id: siteId } });
      if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 });
      contractId = site.contractId;
    }

    // Check material request permission
    const allowed = await hasSiteAccess(requester.id, requester.role, contractId, siteId, "materialRequest");
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden: You do not have permission to request materials for this site" }, { status: 403 });
    }

    if (useMockDb()) {
      const newIssue = mockDb.addMaterialIssue({
        siteId,
        productId,
        qty: Number(qty),
        reason: reason || null,
        createdByUserId: requester.id,
        createdByName: requester.name
      });
      return NextResponse.json(newIssue);
    }

    // Postgres path
    const newIssue = await prisma.materialIssue.create({
      data: {
        siteId,
        productId,
        qty: Number(qty),
        reason: reason || null,
        approvalStatus: "PENDING",
        createdByUserId: requester.id,
        createdByName: requester.name
      }
    });

    return NextResponse.json(newIssue);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/material-issues?id=...
// Admin approves or rejects material requests
export async function PUT(request: Request) {
  try {
    const requester = await getCurrentUser(request);
    if (!requester || requester.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const json = await request.json();
    const { status } = json; // APPROVED or REJECTED

    if (!id || !status || !["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "id and valid status (APPROVED/REJECTED) are required" }, { status: 400 });
    }

    if (useMockDb()) {
      const updated = mockDb.updateMaterialIssueStatus(id, status);
      if (!updated) return NextResponse.json({ error: "Material request not found" }, { status: 404 });
      return NextResponse.json(updated);
    }

    // Postgres path: Execute transaction to deduct stock on approval
    const existing = await prisma.materialIssue.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Material request not found" }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const issue = await tx.materialIssue.update({
        where: { id },
        data: { approvalStatus: status as any }
      });

      if (status === "APPROVED") {
        // Create stock movement out
        await tx.stockMovement.create({
          data: {
            productId: issue.productId,
            type: "OUT",
            qty: issue.qty,
            reason: `Material Issue Approval ${issue.id} at site ${issue.siteId}`
          }
        });

        // Deduct from product stockQty
        await tx.product.update({
          where: { id: issue.productId },
          data: {
            stockQty: { decrement: issue.qty }
          }
        });
      }
      return issue;
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
