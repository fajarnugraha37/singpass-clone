import { db } from './client';
import { users, myinfoProfiles } from './schema';
import { createEmptyMyinfoPerson } from '../../core/domain/myinfo-person';
import { faker } from '@faker-js/faker';
import NRIC from 'singapore-nric';
import { MyinfoChildBirthRecord } from '@vibe/shared/index';
import { eq } from 'drizzle-orm';

async function seed() {
  console.log('🌱 Seeding Myinfo mock users...');

  // Configuration for seeding
  const SEED_COUNT = 10;
  const passwordHash = await Bun.password.hash('test1234');

  for (let i = 0; i < SEED_COUNT; i++) {
    // 1. Generate random identity
    const isMale = faker.datatype.boolean();
    const firstName = faker.person.firstName(isMale ? 'male' : 'female');
    const lastName = faker.person.lastName();
    const fullName = `${firstName} ${lastName} TAN`.toUpperCase();
    const nric = NRIC.Generate().toString();
    const email = faker.internet.email({ firstName, lastName }).toLowerCase();

    // Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.nric, nric),
    });

    let userId: string;

    if (existingUser) {
      console.log(`User ${nric} already exists. Skipping user creation.`);
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
      console.log(`✅ [${i + 1}/${SEED_COUNT}] Created user: ${fullName} (${nric})`);
    }

    // 2. Create Myinfo profile for the user
    const person = createEmptyMyinfoPerson(userId);

    // Personal Data
    person.uinfin.value = nric;
    person.name.value = fullName;
    person.sex.value = isMale ? 'M' : 'F';
    person.race.value = faker.helpers.arrayElement(['CH', 'ML', 'IN', 'OT']);
    person.dob.value = faker.date.birthdate({ min: 18, max: 65, mode: 'age' }).toISOString().split('T')[0];
    person.residentialstatus.value = faker.helpers.arrayElement(['C', 'P', 'F']);
    person.nationality.value = 'SG';
    person.birthcountry.value = 'SG';
    person.email.value = email;

    if (person.mobileno) {
      person.mobileno.prefix.value = '+';
      person.mobileno.areacode.value = '65';
      person.mobileno.nbr.value = faker.string.numeric(8);
    }

    const block = faker.location.buildingNumber();
    const street = faker.location.street().toUpperCase();
    const building = faker.company.name().toUpperCase() + ' BUIDLING';
    const postal = faker.location.zipCode('######');

    if (person.regadd) {
      person.regadd.type = 'SG';
      person.regadd.block.value = block;
      person.regadd.building.value = building;
      person.regadd.floor.value = faker.string.numeric(2);
      person.regadd.unit.value = faker.string.numeric(3);
      person.regadd.street.value = street;
      person.regadd.postal.value = postal;
      person.regadd.country = { code: 'SG', desc: 'SINGAPORE' };
    }

    // Finance Data
    if (person.finance) {
      person.finance['cpfbalances.oa'].value = parseFloat(faker.finance.amount({ min: 10000, max: 100000 }));
      person.finance['cpfbalances.ma'].value = parseFloat(faker.finance.amount({ min: 5000, max: 50000 }));
      person.finance['cpfbalances.ra'].value = 0;
      person.finance['cpfbalances.sa'].value = parseFloat(faker.finance.amount({ min: 5000, max: 60000 }));

      person.finance.cpfcontributions = Array.from({ length: 3 }).map((_, idx) => {
        const date = faker.date.recent();
        return {
          date: { value: date.toISOString().split('T')[0], source: '1', classification: 'C', lastupdated: '2024-03-18' },
          amount: { value: parseFloat(faker.finance.amount({ min: 500, max: 3000 })), source: '1', classification: 'C', lastupdated: '2024-03-18' },
          employer: { value: faker.company.name().toUpperCase(), source: '1', classification: 'C', lastupdated: '2024-03-18' },
          month: { value: `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`, source: '1', classification: 'C', lastupdated: '2024-03-18' },
        };
      }).sort((a, b) => a.date.value!.localeCompare(b.date.value!));

      person.finance['noa-basic'].amount.value = parseFloat(faker.finance.amount({ min: 30000, max: 150000 }));
      person.finance['noa-basic'].yearofassessment.value = '2023';
      
      person.finance.noa = {
        amount: { value: person.finance['noa-basic'].amount.value, source: '1', classification: 'C', lastupdated: '2024-03-18' },
        yearofassessment: { value: '2023', source: '1', classification: 'C', lastupdated: '2024-03-18' },
        employment: { value: person.finance['noa-basic'].amount.value * 0.8, source: '1', classification: 'C', lastupdated: '2024-03-18' },
        trade: { value: 0, source: '1', classification: 'C', lastupdated: '2024-03-18' },
        rent: { value: 0, source: '1', classification: 'C', lastupdated: '2024-03-18' },
        interest: { value: person.finance['noa-basic'].amount.value * 0.05, source: '1', classification: 'C', lastupdated: '2024-03-18' },
        taxclearance: { value: 'N', source: '1', classification: 'C', lastupdated: '2024-03-18' },
        taxcategory: { value: 'INCOME TAX', source: '1', classification: 'C', lastupdated: '2024-03-18' },
      };
      
      person.finance.noahistory = [person.finance.noa];
      person.finance.ownerprivate.value = faker.helpers.arrayElement(['Y', 'N']);
    }

    // Vehicle Data
    person.vehicles = [
      {
        vehicleno: { value: `SBA${faker.string.numeric(4)}${faker.string.alpha(1).toUpperCase()}`, source: '1', classification: 'C', lastupdated: '2024-03-18' },
        type: { value: 'PRIVATE MOTOR CAR', source: '1', classification: 'C', lastupdated: '2024-03-18' },
        make: { value: 'TOYOTA', source: '1', classification: 'C', lastupdated: '2024-03-18' },
        model: { value: 'COROLLA', source: '1', classification: 'C', lastupdated: '2024-03-18' },
      }
    ];

    // Family Data
    if (person.family) {
      const isMarried = faker.datatype.boolean();
      person.family.marital.value = isMarried ? '2' : '1';
      person.family.marriagedate.value = isMarried ? faker.date.past({ years: 10 }).toISOString().split('T')[0] : null;

      if (isMarried && faker.datatype.boolean()) {
        person.family.childrenbirthrecords = Array.from({ length: faker.number.int({ min: 1, max: 3 }) }).map(() => ({
          birthcertno: { value: NRIC.Generate().toString(), source: '1', classification: 'C', lastupdated: '2024-03-18' },
          name: { value: `${faker.person.firstName().toUpperCase()} ${lastName} TAN`, source: '1', classification: 'C', lastupdated: '2024-03-18' },
          dob: { value: faker.date.past({ years: 15 }).toISOString().split('T')[0], source: '1', classification: 'C', lastupdated: '2024-03-18' },
          sex: { value: faker.helpers.arrayElement(['M', 'F']), source: '1', classification: 'C', lastupdated: '2024-03-18' },
          lifestatus: { value: '1', source: '1', classification: 'C', lastupdated: '2024-03-18' }
        } satisfies MyinfoChildBirthRecord));
      }
    }

    // Education Data
    if (person.education) {
      person.education.employment.value = 'PRIVATE SECTOR';
      person.education.occupation.value = 'SOFTWARE ENGINEER';
      person.education.academicqualifications = [
        {
          qualification: { value: 'BACHELOR OF SCIENCE', source: '1', classification: 'C', lastupdated: '2024-03-18' },
          school: { value: 'NATIONAL UNIVERSITY OF SINGAPORE', source: '1', classification: 'C', lastupdated: '2024-03-18' },
          yearofgraduation: { value: '2020', source: '1', classification: 'C', lastupdated: '2024-03-18' },
        }
      ];
    }

    // Property Data
    if (person.property) {
      person.property.hdbownership = [
        {
          noofowners: { value: 1, source: '1', classification: 'C', lastupdated: '2024-03-18' },
          address: { ...person.regadd },
          hdbtype: { value: '4-ROOM', source: '1', classification: 'C', lastupdated: '2024-03-18' },
          leasecommencementdate: { value: '2021-01-01', source: '1', classification: 'C', lastupdated: '2024-03-18' },
        }
      ];
    }
    // Check if profile exists
    const existingProfile = await db.query.myinfoProfiles.findFirst({
      where: (profiles, { eq }) => eq(profiles.userId, userId),
    });

    if (existingProfile) {
      await db.update(myinfoProfiles)
        .set({ data: person, updatedAt: new Date() })
        // .where((p, { eq }) => eq(p.userId, userId))
        .where(eq(myinfoProfiles.id, userId));
    } else {
      await db.insert(myinfoProfiles).values({
        userId,
        data: person,
      });
    }
  }

  console.log('✨ Seeding complete!');
}

seed().catch(console.error);
