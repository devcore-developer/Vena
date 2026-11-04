import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Deleting mock free resources...");
  
  const deleted = await prisma.freeResource.deleteMany({
    where: {
      slug: { 
        in: [
          "ecg-interpretation-basics", 
          "introduction-to-pharmacology"
        ] 
      }
    }
  });
  
  console.log(`✅ Deleted ${deleted.count} mock resources.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });