import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mockDb, useMockDb } from "@/lib/mock-db";
import { getCurrentUser } from "@/lib/api-auth";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase admin client for invites if credentials are present
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

export async function GET(request: Request) {
  try {
    const requester = await getCurrentUser(request);
    if (!requester || requester.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    if (useMockDb()) {
      const users = mockDb.getUsers();
      // Map to include siteAccess relations
      const mapped = users.map(u => ({
        ...u,
        siteAccess: mockDb.getSiteAccessByUser(u.id)
      }));
      return NextResponse.json(mapped);
    }

    const users = await prisma.user.findMany({
      include: {
        siteAccess: {
          include: {
            contract: true,
            site: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(users);
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
    const { email, name, phone, role } = json;

    if (!email || !name) {
      return NextResponse.json({ error: "Email and Name are required" }, { status: 400 });
    }

    const targetRole = role === "ADMIN" ? "ADMIN" : "SITE_MANAGER";

    if (useMockDb()) {
      // Check duplicate
      const existing = mockDb.getUserByEmail(email);
      if (existing) {
        return NextResponse.json({ error: "User already exists with this email" }, { status: 400 });
      }

      const newUser = mockDb.addUser({
        email,
        name,
        phone: phone || null,
        role: targetRole,
        status: "ACTIVE",
        createdById: requester.id
      });
      return NextResponse.json(newUser);
    }

    // Check duplicate in DB
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "User already exists with this email" }, { status: 400 });
    }

    let supabaseId = `usr_${Date.now()}`;

    // Invite user via Supabase Auth if config is present
    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: { name, phone },
        redirectTo: `${new URL(request.url).origin}/login`
      });

      if (error) {
        return NextResponse.json({ error: `Supabase invite failed: ${error.message}` }, { status: 400 });
      }

      if (data.user) {
        supabaseId = data.user.id;
      }
    }

    // Save to Prisma User table
    const newUser = await prisma.user.create({
      data: {
        id: supabaseId,
        email,
        name,
        phone: phone || null,
        role: targetRole,
        status: "ACTIVE",
        createdById: requester.id
      }
    });

    return NextResponse.json(newUser);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
