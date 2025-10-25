import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { readFileSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();

// Load seed data from JSON files
const vehiclesData = JSON.parse(
  readFileSync(join(__dirname, "../seed-data/vehicles.json"), "utf-8")
);
const serviceCentersData = JSON.parse(
  readFileSync(join(__dirname, "../seed-data/service-centers.json"), "utf-8")
);

// Constants (will use from @motorghar-platform/constants once integrated)
const BCRYPT_SALT_ROUNDS = 12;
const DEFAULT_LANGUAGE = "en";

async function main() {
  console.log("🌱 Starting database seeding...");

  // 1. Create Bootstrap Admin User
  console.log("👤 Creating admin user...");

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error("ADMIN_PASSWORD environment variable is required for seeding");
  }

  const adminPasswordHash = await bcrypt.hash(adminPassword, BCRYPT_SALT_ROUNDS);

  const admin = await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL || "admin@motorghar.com" },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL || "admin@motorghar.com",
      passwordHash: adminPasswordHash,
      name: process.env.ADMIN_NAME || "MotorGhar Admin",
      role: "ADMIN",
      lang: DEFAULT_LANGUAGE,
    },
  });
  console.log(`✅ Admin user created: ${admin.email}`);

  // 2. Seed Vehicle Catalog from JSON
  console.log("🚗 Seeding vehicle catalog from JSON...");

  for (const vehicle of vehiclesData) {
    await prisma.vehicleCatalog.create({
      data: vehicle,
    });
  }
  console.log(`✅ Created ${vehiclesData.length} vehicle catalog entries`);

  // 3. Seed Service Centers from JSON
  console.log("🔧 Seeding service centers from JSON...");

  for (const center of serviceCentersData) {
    await prisma.serviceCenter.create({
      data: center,
    });
  }
  console.log(`✅ Created ${serviceCentersData.length} service centers`);

  console.log("✅ Database seeding completed successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Error during seeding:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
