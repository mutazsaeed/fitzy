/* eslint-disable */
const bcrypt = require('bcrypt');

/** @param {import('@prisma/client').PrismaClient} prisma */
async function seedAdmins(prisma) {
  const admins = [
    { name: 'FitZy Owner',   email: 'owner@fitzy.local',   password: 'Admin123!', role: 'OWNER' },
    { name: 'FitZy Manager', email: 'manager@fitzy.local', password: 'Admin123!', role: 'MANAGER' },
  ];

  for (const a of admins) {
    const hash = await bcrypt.hash(a.password, 10);
    await prisma.admin.upsert({
      where: { email: a.email.toLowerCase() },
      update: {
        name: a.name,
        role: a.role,
      },
      create: {
        name: a.name,
        email: a.email.toLowerCase(),
        password: hash,
        role: a.role,
      },
    });
  }

  console.log(`✅ Seed(admins): upserted ${admins.length} admins`);
}

module.exports = { seedAdmins };