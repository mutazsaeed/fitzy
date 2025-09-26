/**
 * Seed for Gyms & Branches
 * - لا نعتمد على فريد @unique للاسم في Gym، فنستخدم findFirst ثم create/update
 * - الفروع Branch عندها قيد @@unique([gymId, name]) فنستخدم upsert بـ where.gymId_name
 */
const GYMS = [
  {
    name: 'Fit House',
    gender: 'mixed',
    category: 'premium',
    visitPrice: 15,
    address: 'Riyadh, King Fahd Rd',
    latitude: 24.7136,
    longitude: 46.6753,
    services: ['Weights', 'Cardio', 'Classes'],
    images: ['fit-house-1.jpg', 'fit-house-2.jpg'],
    workingHours: {
      mon: '06:00-23:00',
      tue: '06:00-23:00',
      wed: '06:00-23:00',
      thu: '06:00-23:00',
      fri: '14:00-23:00',
      sat: '08:00-23:00',
      sun: '08:00-23:00',
    },
    branches: [
      { name: 'Central', address: 'Olaya St', latitude: 24.692, longitude: 46.685, isActive: true },
      { name: 'North',   address: 'Al Malqa', latitude: 24.824, longitude: 46.624, isActive: true },
    ],
  },
  {
    name: 'Iron Club',
    gender: 'male',
    category: 'standard',
    visitPrice: 12.5,
    address: 'Jeddah, Corniche',
    latitude: 21.5433,
    longitude: 39.1728,
    services: ['Weights', 'Cardio'],
    images: ['iron-club-1.jpg'],
    workingHours: {
      mon: '07:00-23:00',
      tue: '07:00-23:00',
      wed: '07:00-23:00',
      thu: '07:00-23:00',
      fri: '15:00-23:00',
      sat: '08:00-23:00',
      sun: '08:00-23:00',
    },
    branches: [
      { name: 'Seaside', address: 'Corniche Rd', latitude: 21.60, longitude: 39.12, isActive: true },
      { name: 'Downtown', address: 'Al Balad', latitude: 21.48, longitude: 39.19, isActive: true },
    ],
  },
  {
    name: 'Power Zone',
    gender: 'female',
    category: 'boutique',
    visitPrice: 20,
    address: 'Dammam, King Saud Rd',
    latitude: 26.4207,
    longitude: 50.0888,
    services: ['Classes', 'Yoga', 'Cardio'],
    images: ['power-zone-1.jpg'],
    workingHours: {
      mon: '08:00-22:00',
      tue: '08:00-22:00',
      wed: '08:00-22:00',
      thu: '08:00-22:00',
      fri: '16:00-22:00',
      sat: '09:00-22:00',
      sun: '09:00-22:00',
    },
    branches: [
      { name: 'East',  address: 'Dhahran St', latitude: 26.31, longitude: 50.15, isActive: true },
      { name: 'West',  address: 'Qatif Rd',   latitude: 26.52, longitude: 50.02, isActive: true },
    ],
  },
];

/** @param {import('@prisma/client').PrismaClient} prisma */
async function seedGyms(prisma) {
  let gymCreated = 0, gymUpdated = 0, branchUpserts = 0;

  for (const g of GYMS) {
    // ابحث عن النادي بالاسم (نفترض الاسم فريد ضمن بياناتنا)
    const existing = await prisma.gym.findFirst({ where: { name: g.name } });

    let gym;
    if (existing) {
      gym = await prisma.gym.update({
        where: { id: existing.id },
        data: {
          gender: g.gender,
          category: g.category,
          visitPrice: g.visitPrice,
          address: g.address,
          latitude: g.latitude,
          longitude: g.longitude,
          services: g.services,
          images: g.images,
          workingHours: g.workingHours,
        },
      });
      gymUpdated++;
    } else {
      gym = await prisma.gym.create({
        data: {
          name: g.name,
          gender: g.gender,
          category: g.category,
          visitPrice: g.visitPrice,
          address: g.address,
          latitude: g.latitude,
          longitude: g.longitude,
          services: g.services ?? [],
          images: g.images ?? [],
          workingHours: g.workingHours ?? {},
        },
      });
      gymCreated++;
    }

    // فروع النادي — نستخدم upsert على القيد المركّب @@unique([gymId, name])
    for (const b of g.branches ?? []) {
      await prisma.branch.upsert({
        where: { gymId_name: { gymId: gym.id, name: b.name } }, // يعتمد على @@unique([gymId, name])
        update: {
          address: b.address,
          latitude: b.latitude ?? null,
          longitude: b.longitude ?? null,
          isActive: b.isActive ?? true,
          workingHours: g.workingHours ?? null,
        },
        create: {
          gymId: gym.id,
          name: b.name,
          address: b.address ?? null,
          latitude: b.latitude ?? null,
          longitude: b.longitude ?? null,
          isActive: b.isActive ?? true,
          workingHours: g.workingHours ?? null,
        },
      });
      branchUpserts++;
    }
  }

  console.log(`✅ Seed(gyms): created=${gymCreated}, updated=${gymUpdated}, branchesUpserted=${branchUpserts}`);
}

module.exports = { seedGyms };
