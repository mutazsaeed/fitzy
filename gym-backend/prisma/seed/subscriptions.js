/* eslint-disable */

/**
 * Seed for Subscription "plans" (Basic/Standard/Premium)
 * يربط الخطط بكل الأندية، ويوزّع المستخدمين على الخطط بنسبة بسيطة.
 */

const PLANS = [
  { name: 'Basic',    gender: 'mixed',  level: 'basic',    price: 199, duration: 30, promoImage: null },
  { name: 'Standard', gender: 'mixed',  level: 'standard', price: 299, duration: 30, promoImage: null },
  { name: 'Premium',  gender: 'mixed',  level: 'premium',  price: 399, duration: 30, promoImage: null },
];

/** @param {import('@prisma/client').PrismaClient} prisma */
async function seedSubscriptions(prisma) {
  // 1) احضر كل الأندية لربطها بالخطط
  const gyms = await prisma.gym.findMany({ select: { id: true } });

  // 2) أنشئ/حدّث الخطط بالاسم (نفترض الاسم فريد ضمن بياناتنا)
  const planRecords = [];
  for (const p of PLANS) {
    const existing = await prisma.subscription.findFirst({ where: { name: p.name } });
    let plan;
    if (existing) {
      plan = await prisma.subscription.update({
        where: { id: existing.id },
        data: {
          gender: p.gender,
          level: p.level,
          price: p.price,
          duration: p.duration,
          promoImage: p.promoImage,
          gyms: { set: gyms.map(g => ({ id: g.id })) }, // اربط بكل الأندية
        },
      });
    } else {
      plan = await prisma.subscription.create({
        data: {
          name: p.name,
          gender: p.gender,
          level: p.level,
          price: p.price,
          duration: p.duration,
          promoImage: p.promoImage,
          gyms: { connect: gyms.map(g => ({ id: g.id })) },
        },
      });
    }
    planRecords.push(plan);
  }

  // 3) وزّع المستخدمين على الخطط (set حتى لو أعدنا التشغيل)
  const users = await prisma.user.findMany({ select: { id: true } });
  if (users.length > 0) {
    for (let i = 0; i < users.length; i++) {
      const plan = planRecords[i % planRecords.length];
      await prisma.user.update({
        where: { id: users[i].id },
        data: { subscriptions: { set: [{ id: plan.id }] } },
      });
    }
  }

  console.log(`✅ Seed(subscriptions): plans=${planRecords.length}, usersAssigned=${users.length}`);
}

module.exports = { seedSubscriptions };
