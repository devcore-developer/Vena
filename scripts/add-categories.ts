import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  // Basic Sciences
  { name: "Anatomy", slug: "anatomy" },
  { name: "Physiology", slug: "physiology" },
  { name: "Histology", slug: "histology" },
  { name: "Biochemistry", slug: "biochemistry" },
  { name: "Pathology", slug: "pathology" },
  { name: "Pharmacology", slug: "pharmacology" },
  { name: "Microbiology", slug: "microbiology" },
  { name: "Parasitology", slug: "parasitology" },
  { name: "Community Medicine", slug: "community-medicine" },
  { name: "Forensic Medicine", slug: "forensic-medicine" },
  // Internal Medicine
  { name: "Internal Medicine", slug: "internal-medicine" },
  { name: "Cardiology", slug: "cardiology" },
  { name: "Endocrinology", slug: "endocrinology" },
  { name: "Gastroenterology", slug: "gastroenterology" },
  { name: "Hepatology", slug: "hepatology" },
  { name: "Nephrology", slug: "nephrology" },
  { name: "Pulmonology", slug: "pulmonology" },
  { name: "Rheumatology", slug: "rheumatology" },
  { name: "Neurology", slug: "neurology" },
  { name: "Psychiatry", slug: "psychiatry" },
  // Surgery
  { name: "General Surgery", slug: "general-surgery" },
  { name: "Orthopedics", slug: "orthopedics" },
  { name: "Neurosurgery", slug: "neurosurgery" },
  { name: "Cardiothoracic Surgery", slug: "cardiothoracic-surgery" },
  { name: "Urology", slug: "urology" },
  { name: "Plastic Surgery", slug: "plastic-surgery" },
  { name: "Pediatric Surgery", slug: "pediatric-surgery" },
  // Other
  { name: "Pediatrics", slug: "pediatrics" },
  { name: "Neonatology", slug: "neonatology" },
  { name: "Obstetrics & Gynecology", slug: "obstetrics-gynecology" },
  { name: "ENT", slug: "ent" },
  { name: "Ophthalmology", slug: "ophthalmology" },
  { name: "Dermatology", slug: "dermatology" },
  { name: "Emergency Medicine", slug: "emergency-medicine" },
  { name: "Anesthesiology", slug: "anesthesiology" },
  { name: "Radiology", slug: "radiology" },
  { name: "Clinical Pathology", slug: "clinical-pathology" },
  { name: "Hematology", slug: "hematology" },
];

async function main() {
  console.log("Adding categories...");

  for (const cat of categories) {
    await prisma.courseCategory.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name },
      create: cat,
    });
  }

  const count = await prisma.courseCategory.count();
  console.log(`✅ Done! Total categories: ${count}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());