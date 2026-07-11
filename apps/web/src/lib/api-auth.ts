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
    console.log("[DEBUG api-auth] Incoming Authorization header:", authHeader ? `${authHeader.substring(0, 15)}...` : "None");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("[DEBUG api-auth] Invalid or missing Bearer token");
      return null;
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      console.log("[DEBUG api-auth] Token string is empty");
      return null;
    }

    // Real Supabase Auth Flow
    console.log("[DEBUG api-auth] Verifying token with Supabase auth...");
    const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token);
    if (error) {
      console.error("[DEBUG api-auth] Supabase auth.getUser error:", error);
      return null;
    }
    if (!supabaseUser || !supabaseUser.email) {
      console.log("[DEBUG api-auth] Supabase returned no user or email");
      return null;
    }
    console.log("[DEBUG api-auth] Supabase user verified:", supabaseUser.email);

    // Load DB Profile
    const userProfile = await prisma.user.findUnique({
      where: { email: supabaseUser.email },
    });

    if (!userProfile) {
      console.log("[DEBUG api-auth] User profile not found in Prisma DB for email:", supabaseUser.email);
      return null;
    }
    if (userProfile.status === "INACTIVE") {
      console.log("[DEBUG api-auth] User account status is INACTIVE for:", supabaseUser.email);
      return null;
    }

    console.log("[DEBUG api-auth] Authenticated user loaded:", userProfile.email, "Role:", userProfile.role);
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
  permission: "attendance" | "measurement" | "materialRequest" | "viewProgress" | "laborDeployment" | "workerManagement" | "expenseRecording" | "documentUpload"
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
