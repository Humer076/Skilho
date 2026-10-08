const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const count = await prisma.package.count();
    if (count > 0) {
      console.log('Packages already exist, skipping.');
      return;
    }

    await prisma.package.createMany({
      data: [
        {
          name: 'Normal',
          tier: 'NORMAL',
          priceRupees: 999,
          durationDays: 30,
          jobCredits: 3,
          featuredJobs: false,
          advancedSearch: false,
          priorityListing: false,
        },
        {
          name: 'Gold',
          tier: 'GOLD',
          priceRupees: 2999,
          durationDays: 30,
          jobCredits: 10,
          featuredJobs: true,
          advancedSearch: true,
          priorityListing: true,
        },
      ],
    });
    console.log('Seed packages created: Normal, Gold');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});