import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  { name: "Anatomy", slug: "anatomy" },
  { name: "Physiology", slug: "physiology" },
  { name: "Biochemistry", slug: "biochemistry" },
  { name: "Histology", slug: "histology" },
  { name: "Pathology", slug: "pathology" },
  { name: "Pharmacology", slug: "pharmacology" },
  { name: "Microbiology", slug: "microbiology" },
  { name: "Parasitology", slug: "parasitology" },
  { name: "Forensic Medicine", slug: "forensic-medicine" },
  { name: "Community Medicine", slug: "community-medicine" },
  { name: "Internal Medicine", slug: "internal-medicine" },
  { name: "Surgery", slug: "surgery" },
  { name: "Pediatrics", slug: "pediatrics" },
  { name: "Obstetrics & Gynecology", slug: "obstetrics-gynecology" },
  { name: "Cardiology", slug: "cardiology" },
  { name: "Neurology", slug: "neurology" },
  { name: "Psychiatry", slug: "psychiatry" },
  { name: "Dermatology", slug: "dermatology" },
  { name: "Ophthalmology", slug: "ophthalmology" },
  { name: "ENT (Ear, Nose, Throat)", slug: "ent" },
  { name: "Orthopedics", slug: "orthopedics" },
  { name: "Urology", slug: "urology" },
  { name: "Radiology", slug: "radiology" },
  { name: "Anesthesiology", slug: "anesthesiology" },
  { name: "Oncology", slug: "oncology" },
  { name: "Emergency Medicine", slug: "emergency-medicine" },
  { name: "Family Medicine", slug: "family-medicine" },
];

async function main() {
  console.log("🌱 Seeding medical categories...\n");

  for (const cat of categories) {
    await prisma.courseCategory.upsert({
      where: { slug: cat.slug },
      create: { name: cat.name, slug: cat.slug },
      update: { name: cat.name },
    });
    console.log(`  ✓ ${cat.name}`);
  }

  console.log(`\n✅ ${categories.length} categories seeded!`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });