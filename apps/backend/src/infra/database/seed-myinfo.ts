import { db } from './client';
import { users, myinfoProfiles } from './schema';
import { createEmptyMyinfoPerson } from '../../core/domain/myinfo-person';

async function seed() {
  console.log('🌱 Seeding Myinfo mock users...');

  // 1. Create a mock user
  const nric = 'S1234567A';
  const passwordHash = await Bun.password.hash('test1234');

  // Check if user exists
  const existingUser = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.nric, nric),
  });

  let userId: string;

  if (existingUser) {
    console.log(`User ${nric} already exists. Updating password.`);
    await db.update(users).set({ passwordHash }).where((u, { eq }) => eq(u.id, existingUser.id));
    userId = existingUser.id;
  } else {
    const [user] = await db.insert(users).values({
      nric,
      name: 'JOHN DOE TAN',
      email: 'john.doe@example.com',
      mobileno: '+6591234567',
      passwordHash,
    }).returning();
    userId = user.id;
    console.log(`✅ Created user: ${user.name} (${user.nric})`);
  }

  // 2. Create Myinfo profile for the user
  const person = createEmptyMyinfoPerson(userId);
  
  // Personal Data
  person.uinfin.value = nric;
  person.name.value = 'JOHN DOE TAN';
  person.sex.value = 'M';
  person.race.value = 'CH';
  person.dob.value = '1990-01-01';
  person.residentialstatus.value = 'C';
  person.nationality.value = 'SG';
  person.birthcountry.value = 'SG';
  person.email.value = 'john.doe@example.com';
  person.mobileno = {
    prefix: { value: '+' },
    areacode: { value: '65' },
    nbr: { value: '91234567' },
  };
  person.regadd = {
    type: { value: 'SG' },
    block: { value: '123' },
    building: { value: 'MYINFO TOWERS' },
    floor: { value: '10' },
    unit: { value: '101' },
    street: { value: 'SINGAPORE STREET' },
    postal: { value: '123456' },
    country: { value: 'SG' },
  };

  // Finance Data
  if (person.finance) {
    person.finance['cpfbalances.oa'].value = 50000.50;
    person.finance['cpfbalances.ma'].value = 30000.25;
    person.finance['cpfbalances.ra'].value = 0;
    person.finance['cpfbalances.sa'].value = 20000.75;
    person.finance.cpfcontributions = [
      { date: { value: '2024-02-01' }, amount: { value: 1200.50 } as any, employer: { value: 'MOCK CORP' } },
      { date: { value: '2024-01-01' }, amount: { value: 1200.50 } as any, employer: { value: 'MOCK CORP' } },
    ] as any;
    person.finance['noa-basic'] = {
      amount: { value: 80000 } as any,
      yearofassessment: { value: '2023' },
    };
    person.finance.ownerprivate.value = 'N';
  }

  // Family Data
  if (person.family) {
    person.family.marital.value = '2'; // Married
    person.family.marriagedate.value = '2015-05-20';
    person.family.childrenbirthrecords = [
      { birthcertno: { value: 'T1234567A' }, name: { value: 'BABY DOE' }, dob: { value: '2020-01-01' }, sex: { value: 'M' }, lifestatus: { value: '1' } }
    ];
  }

  // Check if profile exists
  const existingProfile = await db.query.myinfoProfiles.findFirst({
    where: (profiles, { eq }) => eq(profiles.userId, userId),
  });

  if (existingProfile) {
    console.log(`Profile for ${nric} already exists. Updating data.`);
    await db.update(myinfoProfiles).set({ data: person }).where((p, { eq }) => eq(p.userId, userId));
  } else {
    await db.insert(myinfoProfiles).values({
      userId,
      data: person,
    });
    console.log(`✅ Created Myinfo profile for ${nric}`);
  }

  console.log('✨ Seeding complete!');
}

seed().catch(console.error);
