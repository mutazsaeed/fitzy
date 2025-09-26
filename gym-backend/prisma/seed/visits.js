/* eslint-disable */

/**
 * Seed for Visits (آخر 20 يوم)
 * - يولّد زيارات لكل نادي بأعداد مختلفة/يوم
 * - يوزّعها على الفروع والمستخدمين بدون كسر القيد uniq_user_gym_per_day
 */

function atNoon(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12); }

/** @param {import('@prisma/client').PrismaClient} prisma */
async function seedVisits(prisma) {
  // users + gyms + branches
  const users = await prisma.user.findMany({ select: { id: true } });
  const gyms = await prisma.gym.findMany({
    select: { id: true, name: true, branches: { select: { id: true, name: true } } },
  });

  if (users.length === 0 || gyms.length === 0) {
    console.log('ℹ️ Seed(visits): skipped (no users or gyms)');
    return;
  }

  // سياسة الأعداد/يوم لكل نادي (حسب الاسم إن وُجد وإلا افتراضي)
  const perGymDaily = new Map();
  for (const g of gyms) {
    let count = 10; // افتراضي
    if (/fit house/i.test(g.name)) count = 25;
    if (/iron club/i.test(g.name)) count = 15;
    if (/power zone/i.test(g.name)) count = 8;
    perGymDaily.set(g.id, count);
  }

  // الفترة: آخر 20 يوم (شاملة اليوم)
  const today = new Date(); today.setHours(0,0,0,0);
  const start = new Date(today); start.setDate(start.getDate() - 19);

  const data = [];
  for (let d = 0; d < 20; d++) {
    const day = new Date(start); day.setDate(start.getDate() + d);
    for (const gym of gyms) {
      const target = perGymDaily.get(gym.id) || 10;
      const branches = gym.branches.length ? gym.branches : [{ id: null }];
      for (let k = 0; k < target; k++) {
        // اختَر مستخدمًا بطريقة تضمن عدم تكرار (user,gym,day)
        const user = users[(d * 37 + k) % users.length]; // توزيع بسيط
        const branch = branches[(d * 13 + k) % branches.length];
        data.push({
          userId: user.id,
          gymId: gym.id,
          branchId: branch.id ?? null,
          visitDate: atNoon(day), // @db.Date: التاريخ فقط يخزن
          // status/method افتراضيات من الـ schema
        });
      }
    }
  }

  if (data.length > 0) {
    await prisma.visit.createMany({
      data,
      skipDuplicates: true, // يحترم القيد uniq_user_gym_per_day
    });
  }

  console.log(`✅ Seed(visits): inserted ~${data.length} (skipping duplicates if any)`);
}

module.exports = { seedVisits };
