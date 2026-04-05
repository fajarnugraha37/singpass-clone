import { eq, desc, or, lt, and } from 'drizzle-orm';
import { users, myinfoProfiles } from '../../infra/database/schema';
import { faker } from '@faker-js/faker';
import NRIC from 'singapore-nric';
import { createEmptyMyinfoPerson } from '../domain/myinfo-person';

export class SandboxService {
  constructor(private db: any) {}

  async listUsers(pagination: { cursor?: string; limit: number }): Promise<any> {
    const { cursor, limit } = pagination;
    
    let whereClause = undefined;
    if (cursor) {
      const [createdAt, id] = JSON.parse(Buffer.from(cursor, 'base64').toString());
      whereClause = or(
        lt(users.createdAt, new Date(createdAt)),
        and(eq(users.createdAt, new Date(createdAt)), lt(users.id, id))
      );
    }

    const items = await this.db.query.users.findMany({
      where: whereClause,
      limit: limit + 1,
      orderBy: [desc(users.createdAt), desc(users.id)],
    });

    let nextCursor = null;
    if (items.length > limit) {
      items.pop();
      const lastItem = items[items.length - 1];
      nextCursor = Buffer.from(JSON.stringify([lastItem.createdAt.toISOString(), lastItem.id])).toString('base64');
    }

    return { items, nextCursor };
  }

  async createUser(data: { nric: string; password?: string; generateMockData: boolean }): Promise<any> {
    const passwordHash = await Bun.password.hash(data.password || 'test1234');
    const nric = data.nric || NRIC.Generate().toString();

    // Generate high-fidelity MyInfo data
    const isMale = faker.datatype.boolean();
    const firstName = faker.person.firstName(isMale ? 'male' : 'female');
    const lastName = faker.person.lastName();
    const fullName = `${firstName} ${lastName} TAN`.toUpperCase();
    const email = faker.internet.email({ firstName, lastName }).toLowerCase();

    const [user] = await this.db.insert(users).values({
      nric,
      name: fullName,
      email,
      mobileno: `+65${faker.string.numeric(8)}`,
      passwordHash,
    }).returning();

    const person = createEmptyMyinfoPerson(user.id);
    person.uinfin.value = nric;
    person.name.value = fullName;
    person.sex.value = isMale ? 'M' : 'F';
    person.dob.value = faker.date.birthdate({ min: 18, max: 65, mode: 'age' }).toISOString().split('T')[0];
    person.residentialstatus.value = faker.helpers.arrayElement(['C', 'P', 'F']);
    person.nationality.value = 'SG';
    person.birthcountry.value = 'SG';
    person.email.value = email;

    await this.db.insert(myinfoProfiles).values({
      userId: user.id,
      data: person,
    });

    return user;
  }

  async deleteUser(userId: string): Promise<void> {
    await this.db.delete(myinfoProfiles).where(eq(myinfoProfiles.userId, userId));
    await this.db.delete(users).where(eq(users.id, userId));
  }
}
