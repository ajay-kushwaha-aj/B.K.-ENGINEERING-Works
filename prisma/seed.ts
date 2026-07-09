import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
    console.log(`Seeding user profile: ${u.email}`);
    const admin = await prisma.user.upsert({
      where: { email: u.email.toLowerCase() },
      update: {
        name: u.name,
        status: "ACTIVE",
        role: u.role,
      },
      create: {
        email: u.email.toLowerCase(),
        name: u.name,
        role: u.role,
        status: "ACTIVE",
      },
    });
    console.log("Seeded successfully:", admin);
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
