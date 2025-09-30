const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedUserSubscriptions() {
  const users = await prisma.user.findMany({ orderBy: { id: 'asc' } });
  const plans = await prisma.subscription.findMany({ orderBy: { id: 'asc' } });
  if (!users.length || !plans.length) {
    console.log('ℹ️ Seed(user-subscriptions): skipped (no users or plans)');
    return;
  }

  const start = new Date(); start.setDate(1); start.setHours(0,0,0,0);
  const end = new Date(start); end.setMonth(end.getMonth() + 1);

  const keepUnsubscribed = 2;
  const cutoff = Math.max(0, users.length - keepUnsubscribed);

  for (let i = 0; i < cutoff; i++) {
    const u = users[i];
    const plan = plans[i % plans.length];
    await prisma.userSubscription.upsert({
      where: { userId_startDate_endDate: { userId: u.id, startDate: start, endDate: end } },
      update: {},
      create: {
        userId: u.id,
        subscriptionId: plan.id,
        startDate: start,
        endDate: end,
        visitLimit: 12,
        status: 'ACTIVE',
      },
    });
  }

  console.log(`✅ Seed(user-subscriptions): upserted=${cutoff}, unsubscribed=${users.length - cutoff}`);
}

module.exports = { seedUserSubscriptions };