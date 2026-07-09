import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mockDb, useMockDb } from "@/lib/mock-db";
import { getCurrentUser } from "@/lib/api-auth";

export async function GET(request: Request) {
  try {
    const requester = await getCurrentUser(request);
    if (!requester) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (useMockDb()) {
      const contracts = mockDb.getContracts();
      if (requester.role === "ADMIN") {
        return NextResponse.json(contracts);
      }

      // Filter for Site Manager
      const accesses = mockDb.getSiteAccessByUser(requester.id);
      const contractIds = Array.from(new Set(accesses.map(a => a.contractId)));
      const filtered = contracts.filter(c => contractIds.includes(c.id));
      return NextResponse.json(filtered);
    }

    // Postgres path
    if (requester.role === "ADMIN") {
      const contracts = await prisma.contract.findMany({
        orderBy: { createdAt: "desc" }
      });
      return NextResponse.json(contracts);
    }

    // Site Manager: join with SiteAccess
    const contracts = await prisma.contract.findMany({
      where: {
        siteAccess: {
          some: {
            userId: requester.id
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(contracts);
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
    const { name, contractNumber, description } = json;

    if (!name || !contractNumber) {
      return NextResponse.json({ error: "Name and Contract Number are required" }, { status: 400 });
    }

    if (useMockDb()) {
      // Check duplicate
      const duplicate = mockDb.getContracts().find(c => c.contractNumber === contractNumber);
      if (duplicate) {
        return NextResponse.json({ error: "Contract number already exists" }, { status: 400 });
      }

      const newCon = mockDb.addContract({
        name,
        contractNumber,
        description: description || null
      });
      return NextResponse.json(newCon);
    }

    // Postgres path
    const duplicate = await prisma.contract.findUnique({ where: { contractNumber } });
    if (duplicate) {
      return NextResponse.json({ error: "Contract number already exists" }, { status: 400 });
    }

    const newCon = await prisma.contract.create({
      data: {
        name,
        contractNumber,
        description: description || null
      }
    });

    return NextResponse.json(newCon);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
