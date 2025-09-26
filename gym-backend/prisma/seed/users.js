/* eslint-disable */
const bcrypt = require('bcrypt');

const USERS = [
  { name: 'Ali Hassan',   email: 'ali@example.local',   phone: '0550000001', age: 26, gender: 'male',   city: 'Riyadh',  password: 'User123!' },
  { name: 'Sara Ahmed',   email: 'sara@example.local',  phone: '0550000002', age: 24, gender: 'female', city: 'Jeddah',  password: 'User123!' },
  { name: 'Fahad Nasser', email: 'fahad@example.local', phone: '0550000003', age: 31, gender: 'male',   city: 'Dammam',  password: 'User123!' },
  { name: 'Noura Saleh',  email: 'noura@example.local', phone: '0550000004', age: 29, gender: 'female', city: 'Riyadh',  password: 'User123!' },
  { name: 'Mona Tariq',   email: 'mona@example.local',  phone: '0550000005', age: 22, gender: 'female', city: 'Khobar',  password: 'User123!' },
  { name: 'Yousef Adel',  email: 'yousef@example.local',phone: '0550000006', age: 34, gender: 'male',   city: 'Jeddah',  password: 'User123!' },
  { name: 'Huda Sami',    email: 'huda@example.local',  phone: '0550000007', age: 27, gender: 'female', city: 'Riyadh',  password: 'User123!' },
  { name: 'Majed Omar',   email: 'majed@example.local', phone: '0550000008', age: 28, gender: 'male',   city: 'Madinah', password: 'User123!' },
  { name: 'Lama Rayan',   email: 'lama@example.local',  phone: '0550000009', age: 23, gender: 'female', city: 'Jeddah',  password: 'User123!' },
  { name: 'Salem Waleed', email: 'salem@example.local', phone: '0550000010', age: 30, gender: 'male',   city: 'Riyadh',  password: 'User123!' },
];

function assertUnique(arr, key) {
  const s = new Set();
  for (const it of arr) {
    if (s.has(it[key])) throw new Error(`Duplicate ${key}: ${it[key]}`);
    s.add(it[key]);
  }
}

async function seedUsers(prisma) {
  assertUnique(USERS, 'email');
  assertUnique(USERS, 'phone');

  for (const u of USERS) {
    const hash = await bcrypt.hash(u.password, 10);
    await prisma.user.upsert({
      where: { email: u.email.toLowerCase() },
      update: {
        name: u.name,
        phone: u.phone,
        age: u.age,
        gender: u.gender,
        city: u.city,
      },
      create: {
        name: u.name,
        email: u.email.toLowerCase(),
        phone: u.phone,
        age: u.age,
        gender: u.gender,
        city: u.city,
        password: hash,
      },
    });
  }
  console.log(`✅ Seed(users): upserted ${USERS.length} users`);
}

module.exports = { seedUsers };
