import { getDb, db } from '../infra/database/client';
import { users, myinfoProfiles, developers } from '../infra/database/schema';
import { createEmptyMyinfoPerson } from '../core/domain/myinfo-person';
import { faker } from '@faker-js/faker';
import NRIC from 'singapore-nric';
import { MyinfoChildBirthRecord } from '@vibe/shared/index';
import { eq } from 'drizzle-orm';

async function seed() {
  console.log('🌱 Starting full environment hydration...');
  await getDb();

  const passwordHash = await Bun.password.hash('test1234');

  // 1. Seed Developers & Admins
  console.log('👥 Seeding Developer and Admin accounts...');
  const devAccounts = [
    { email: 'admin@example.com', role: 'admin' as const },
    { email: 'developer@example.com', role: 'developer' as const },
  ];

  for (const account of devAccounts) {
    const existing = await db.query.developers.findFirst({
      where: (devs: any, { eq }: any) => eq(devs.email, account.email),
    });

    if (existing) {
      console.log(`Developer ${account.email} already exists. Skipping.`);
    } else {
      await db.insert(developers).values({
        email: account.email,
        role: account.role,
        status: 'active',
      });
      console.log(`✅ Created ${account.role}: ${account.email}`);
    }
  }

  // 2. Seed Singpass Sandbox Users
  console.log('👤 Seeding Singpass Sandbox users...');
  const SEED_COUNT = 10;

  for (let i = 0; i < SEED_COUNT; i++) {
    const isMale = faker.datatype.boolean();
    const firstName = faker.person.firstName(isMale ? 'male' : 'female');
    const lastName = faker.person.lastName();
    const fullName = `${firstName} ${lastName} TAN`.toUpperCase();
    const nric = NRIC.Generate().toString();
    const email = faker.internet.email({ firstName, lastName }).toLowerCase();

    const existingUser = await db.query.users.findFirst({
      where: (users: any, { eq }: any) => eq(users.nric, nric),
    });

    let userId: string;

    if (existingUser) {
      console.log(`User ${nric} already exists. Skipping.`);
      userId = existingUser.id;
    } else {
      const [user] = await db.insert(users).values({
        nric,
        name: fullName,
        email,
        mobileno: `+65${faker.string.numeric(8)}`,
        passwordHash,
      }).returning();
      userId = user.id;
      console.log(`✅ [${i + 1}/${SEED_COUNT}] Created sandbox user: ${fullName} (${nric})`);
    }

    // Create Myinfo profile
    const person = createEmptyMyinfoPerson(userId);
    person.uinfin.value = nric;
    person.name.value = fullName;
    person.sex.value = isMale ? 'M' : 'F';
    person.dob.value = faker.date.birthdate({ min: 18, max: 65, mode: 'age' }).toISOString().split('T')[0];
    person.residentialstatus.value = faker.helpers.arrayElement(['C', 'P', 'F']);
    person.nationality.value = 'SG';
    person.birthcountry.value = 'SG';
    person.email.value = email;

    const existingProfile = await db.query.myinfoProfiles.findFirst({
      where: (profiles: any, { eq }: any) => eq(profiles.userId, userId),
    });

    if (!existingProfile) {
      await db.insert(myinfoProfiles).values({
        userId,
        data: person,
      });
    }
  }

  console.log('✨ Environment hydration complete!');
}

seed().catch(console.error);
