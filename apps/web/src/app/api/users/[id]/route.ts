import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mockDb, useMockDb } from "@/lib/mock-db";
import { getCurrentUser } from "@/lib/api-auth";
import { createClient } from "@supabase/supabase-js";

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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const requester = await getCurrentUser(request);
    if (!requester || requester.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const json = await request.json();
    const { name, phone, role, status } = json;

    if (useMockDb()) {
      const existing = mockDb.getUserById(id);
      if (!existing) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const updated = mockDb.updateUser(id, {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(role !== undefined && { role }),
        ...(status !== undefined && { status }),
      });

      return NextResponse.json(updated);
    }

    // Postgres path
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update Supabase Auth if status changes and client is active
    if (supabaseAdmin && status !== undefined) {
      if (status === "INACTIVE") {
        // Deactivate in Supabase (ban login)
        await supabaseAdmin.auth.admin.updateUserById(id, { ban_duration: "876000h" }); // Ban for 100 years
      } else {
        // Reactivate in Supabase (unban)
        await supabaseAdmin.auth.admin.updateUserById(id, { ban_duration: "none" });
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(role !== undefined && { role }),
        ...(status !== undefined && { status }),
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
