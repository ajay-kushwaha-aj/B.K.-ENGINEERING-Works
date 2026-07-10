import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();

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

async function main() {
  const usersToSeed = [
    { email: "admin@bk.com", name: "Owner Admin", role: "ADMIN" as const },
    { email: "bksinghakbk9890@gmail.com", name: "Birendra Singh Admin", role: "ADMIN" as const },
  ];

  const customEmail = process.env.ADMIN_EMAIL;
  if (customEmail && !usersToSeed.some(u => u.email.toLowerCase() === customEmail.toLowerCase())) {
    usersToSeed.push({
      email: customEmail.toLowerCase(),
      name: process.env.ADMIN_NAME || "Custom Admin",
      role: "ADMIN" as const,
    });
  }

  for (const u of usersToSeed) {
    console.log(`Seeding user: ${u.email}`);
    let supabaseId = "";

    if (supabaseAdmin) {
      try {
        // List users to check if this email already exists in Supabase Auth
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) throw listError;

        const existingAuthUser = users.find(
          (user) => user.email?.toLowerCase() === u.email.toLowerCase()
        );

        if (existingAuthUser) {
          supabaseId = existingAuthUser.id;
          console.log(`User ${u.email} already exists in Supabase Auth (ID: ${supabaseId}). Updating password to default...`);
          const defaultPassword = process.env.ADMIN_PASSWORD || "Bk@$Eng8808";
          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(supabaseId, {
            password: defaultPassword,
            user_metadata: { name: u.name },
          });
          if (updateError) throw updateError;
          console.log(`Successfully updated password for existing user in Supabase Auth.`);
        } else {
          // Create the user in Supabase Auth with a default password
          const defaultPassword = process.env.ADMIN_PASSWORD || "Bk@$Eng8808";
          console.log(`Creating user ${u.email} in Supabase Auth...`);
          const { data: { user }, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: u.email.toLowerCase(),
            password: defaultPassword,
            email_confirm: true,
            user_metadata: { name: u.name },
          });

          if (createError) throw createError;
          if (user) {
            supabaseId = user.id;
            console.log(`Successfully created user in Supabase Auth (ID: ${supabaseId})`);
          }
        }
      } catch (authErr: any) {
        console.error(`Warning: Supabase Auth operations failed for ${u.email}:`, authErr.message || authErr);
      }
    }

    // Default to dynamic ID if Supabase creation failed or was skipped
    if (!supabaseId) {
      const existingDbUser = await prisma.user.findUnique({
        where: { email: u.email.toLowerCase() }
      });
      supabaseId = existingDbUser?.id || `usr_${Date.now()}`;
    }

    // Check if an existing DB user exists with a different ID
    const existingDbUser = await prisma.user.findUnique({
      where: { email: u.email.toLowerCase() }
    });

    if (existingDbUser && existingDbUser.id !== supabaseId) {
      console.log(`Database ID mismatch for ${u.email} (DB: ${existingDbUser.id}, Supabase: ${supabaseId}). Re-creating user...`);
      try {
        await prisma.user.delete({
          where: { email: u.email.toLowerCase() }
        });
      } catch (delErr: any) {
        console.warn(`Could not delete user ${u.email} (might have relations):`, delErr.message || delErr);
      }
    }

    // Upsert into public.User table
    const dbUser = await prisma.user.upsert({
      where: { email: u.email.toLowerCase() },
      update: {
        name: u.name,
        status: "ACTIVE",
        role: u.role,
      },
      create: {
        id: supabaseId,
        email: u.email.toLowerCase(),
        name: u.name,
        role: u.role,
        status: "ACTIVE",
      },
    });
    console.log("Seeded database user profile successfully:", dbUser);
  }
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
