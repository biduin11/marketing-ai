/** Optional vector indexing; lexical retrieval uses the bundled files directly. */
import { prisma } from "@/lib/prisma";
import { HEAVY_SKILLS, seedSkill } from "@/lib/skill-seeding";

async function main() {
  for (const slug of HEAVY_SKILLS) {
    console.log(`${slug}: ${await seedSkill(slug)} chunks`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
