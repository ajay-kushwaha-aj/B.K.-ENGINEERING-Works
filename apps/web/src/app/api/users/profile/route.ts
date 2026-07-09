import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mockDb, useMockDb } from "@/lib/mock-db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (useMockDb()) {
      // Return predefined fallback or check mockDb
      if (email.toLowerCase() === "admin@bk.com") {
        return NextResponse.json({
          id: "usr_admin",
          email: "admin@bk.com",
          name: "Owner Admin",
          role: "ADMIN",
          status: "ACTIVE"
        });
      }

      if (email.toLowerCase() === "manager@bk.com") {
        return NextResponse.json({
          id: "usr_manager",
          email: "manager@bk.com",
          name: "Site Manager A",
          role: "SITE_MANAGER",
          status: "ACTIVE"
        });
      }

      const user = mockDb.getUserByEmail(email);
      if (!user) {
        return NextResponse.json({ error: "User profile not found in mock database" }, { status: 404 });
      }
      return NextResponse.json(user);
    }

    // Postgres path
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
