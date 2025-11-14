import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const crafts = [
    { name: 'Insulator', craftImage: 'U+1F9E4' },
    { name: 'Carpenter', craftImage: 'U+1F6E0 U+FE0F' },
    { name: 'Iron Worker', craftImage: 'U+1F468 U+200D U+1F3ED' },
    { name: 'Boiler maker', craftImage: 'U+1F321 U+FE0F' },
    { name: 'Pipefitter', craftImage: 'U+1F9F0' },
    { name: 'Electrician', craftImage: 'U+26A1' },
    { name: 'Glazer', craftImage: 'U+1FA9F' },
    { name: 'Plumber', craftImage: 'U+1F468 U+1F3FB U+200D U+1F527' },
    { name: 'Roofer', craftImage: 'U+1F3E0' },
    { name: 'Labor', craftImage: 'U+1F9BA' },
    { name: 'Drywaller', craftImage: 'U+1F9F1' },
    { name: 'Concrete', craftImage: 'U+1F3D7 U+FE0F' },
    { name: 'Mason', craftImage: 'U+1F528' },
    { name: 'Elevator mechanic', craftImage: 'U+1F6D7' },
    { name: 'Millwright', craftImage: 'U+2699 U+FE0F' },
    { name: 'Sheetmetal worker', craftImage: 'U+1F4CF' },
    { name: 'HVAC', craftImage: 'U+1F525' },
  ];

  for (const craft of crafts) {
    await prisma.craft.upsert({
      where: { name: craft.name },
      update: {},
      create: craft,
    });
  }

  console.log('Crafts seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
