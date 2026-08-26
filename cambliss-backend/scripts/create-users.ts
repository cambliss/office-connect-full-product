import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash("Password123!", 10);
  
  // create admin
  const adminEmail = "newadmin@camblissstudio.com";
  let admin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        email: adminEmail,
        firstName: "New",
        lastName: "Admin",
        passwordHash,
        isPlatformUser: true,
        organizationId: null
      }
    });
    console.log("Created admin:", admin.email);
  } else {
    await prisma.user.update({
      where: { email: adminEmail },
      data: { passwordHash }
    });
    console.log("Updated admin password:", admin.email);
  }

  // ensure default org
  let defaultOrg = await prisma.organization.findFirst({
    where: { name: "Cambliss Enterprise Demo" }
  });
  if (!defaultOrg) {
    defaultOrg = await prisma.organization.create({
      data: { name: "Cambliss Enterprise Demo" }
    });
  }

  const clientRole = await prisma.role.upsert({
    where: { name: "CLIENT" },
    update: {},
    create: { name: "CLIENT" }
  });

  // create user
  const userEmail = "newuser@camblissstudio.com";
  let user = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: userEmail,
        firstName: "New",
        lastName: "User",
        passwordHash,
        isPlatformUser: false,
        organizationId: defaultOrg.id
      }
    });
    console.log("Created user:", user.email);
  } else {
    await prisma.user.update({
      where: { email: userEmail },
      data: { passwordHash, organizationId: defaultOrg.id }
    });
    console.log("Updated user password:", user.email);
  }

  const membership = await prisma.organizationUser.findFirst({
    where: { userId: user.id, organizationId: defaultOrg.id }
  });
  if (!membership) {
    await prisma.organizationUser.create({
      data: {
        userId: user.id,
        organizationId: defaultOrg.id,
        roleId: clientRole.id
      }
    });
  }
}

main().catch(console.error).finally(() => {
  prisma.$disconnect();
  pool.end();
});
