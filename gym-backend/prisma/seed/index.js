/* eslint-disable */
const { PrismaClient } = require('@prisma/client');
const { seedUsers } = require('./users');
const { seedGyms } = require('./gyms');
const { seedSubscriptions } = require('./subscriptions');
const { seedVisits } = require('./visits');
const { seedAdmins } = require('./admins');
const { seedUserSubscriptions } = require('./user-subscriptions');

const prisma = new PrismaClient();

async function main(target = 'all') {
  if (target === 'all' || target === 'users') {
    await seedUsers(prisma);
  }
  if (target === 'all' || target === 'gyms') {
    await seedGyms(prisma);
  }
  if (target === 'all' || target === 'admins') {
    await seedAdmins(prisma);
  }
  if (target === 'all' || target === 'subs' || target === 'subscriptions') {
    await seedSubscriptions(prisma);
  }
  if (target === 'all' || target === 'user-subs' || target === 'userSubscriptions') {
    await seedUserSubscriptions();
  }
  if (target === 'all' || target === 'visits') {
    await seedVisits(prisma);
  }
  console.log('✅ Seed finished:', target);
}

main(process.argv[2] || process.env.SEED_TARGET || 'all')
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
