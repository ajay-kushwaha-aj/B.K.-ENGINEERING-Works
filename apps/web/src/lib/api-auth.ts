import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "SITE_MANAGER";
  status: "ACTIVE" | "INACTIVE";
}

/**
 * Extracts and verifies the authenticated user from the Request headers.
 * Supports both Mock and Supabase modes.
 */
export async function getCurrentUser(request: Request): Promise<AuthenticatedUser | null> {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7).trim();
    if (!token) return null;

    // Real Supabase Auth Flow
    const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token);
    if (error || !supabaseUser || !supabaseUser.email) {
      return null;
    }

    // Load DB Profile
    const userProfile = await prisma.user.findUnique({
      where: { email: supabaseUser.email },
    });

    if (!userProfile || userProfile.status === "INACTIVE") {
      return null;
    }

    return {
      id: userProfile.id,
      email: userProfile.email,
      name: userProfile.name,
      role: userProfile.role as "ADMIN" | "SITE_MANAGER",
      status: userProfile.status as "ACTIVE" | "INACTIVE",
    };
  } catch (err) {
    console.error("Auth helper error:", err);
    return null;
  }
}

/**
 * Validates whether a user has access to a specific Contract/Site with the given permission.
 */
export async function hasSiteAccess(
  userId: string,
  role: "ADMIN" | "SITE_MANAGER",
  contractId: string,
  siteId: string | null,
  permission: "attendance" | "measurement" | "materialRequest" | "viewProgress"
): Promise<boolean> {
  if (role === "ADMIN") return true;

  // Postgres path
  const match = await prisma.siteAccess.findFirst({
    where: {
      userId,
      contractId,
      OR: [
        { siteId: null },
        { siteId: siteId },
      ],
    },
  });

  if (!match) return false;

  const permissions = match.permissions as any;
  return !!permissions?.[permission];
}
