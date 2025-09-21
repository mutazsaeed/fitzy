/* eslint-disable prettier/prettier */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.subscription.createMany({
    data: [
      {
        name: 'Basic Male',
        gender: 'male',
        level: 'basic',
        price: 100,
        duration: 1,
        promoImage: 'basic-male.png',
      },
      {
        name: 'Standard Male',
        gender: 'male',
        level: 'standard',
        price: 200,
        duration: 3,
        promoImage: 'standard-male.png',
      },
      {
        name: 'Premium Male',
        gender: 'male',
        level: 'premium',
        price: 400,
        duration: 6,
        promoImage: 'premium-male.png',
      },
      {
        name: 'Basic Female',
        gender: 'female',
        level: 'basic',
        price: 100,
        duration: 1,
        promoImage: 'basic-female.png',
      },
      {
        name: 'Standard Female',
        gender: 'female',
        level: 'standard',
        price: 200,
        duration: 3,
        promoImage: 'standard-female.png',
      },
      {
        name: 'Premium Female',
        gender: 'female',
        level: 'premium',
        price: 400,
        duration: 6,
        promoImage: 'premium-female.png',
      },
    ],
    skipDuplicates: true,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
