import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    

    // Postgres path
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        siteAccess: {
          include: {
            contract: true,
            site: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const json = await request.json();
    const { email, name, phone, avatar } = json;

    if (!email) {
      return NextResponse.json({ error: "Email is required to update profile" }, { status: 400 });
    }

    const updatedUser = await (prisma.user as any).upsert({
      where: { email: email.toLowerCase() },
      update: {
        ...(name && { name }),
        ...(phone !== undefined && { phone }),
        ...(avatar !== undefined && { avatar }),
      },
      create: {
        email: email.toLowerCase(),
        name: name || "User",
        phone: phone || null,
        avatar: avatar || null,
        role: "ADMIN"
      }
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
