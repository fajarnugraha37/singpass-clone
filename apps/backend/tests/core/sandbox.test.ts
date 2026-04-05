import { describe, it, expect, beforeEach } from 'bun:test';
import { SandboxService } from '../../src/core/sandbox/service';
import { getDb } from '../../src/infra/database/client';
import { users, myinfoProfiles } from '../../src/infra/database/schema';
import { eq } from 'drizzle-orm';

describe('SandboxService', () => {
  let sandboxService: SandboxService;
  let db: any;

  beforeEach(async () => {
    db = await getDb();
    await db.delete(myinfoProfiles);
    await db.delete(users);
    
    sandboxService = new SandboxService(db);
  });

  it('should create a sandbox user with mock data', async () => {
    const user = await sandboxService.createUser({
      nric: 'S1234567A',
      generateMockData: true,
    });

    expect(user.nric).toBe('S1234567A');
    expect(user.id).toBeDefined();

    const profile = await db.query.myinfoProfiles.findFirst({
      where: eq(myinfoProfiles.userId, user.id),
    });
    expect(profile).toBeDefined();
    expect(profile.data.uinfin.value).toBe('S1234567A');
  });

  it('should list sandbox users', async () => {
    await sandboxService.createUser({ nric: 'S1', generateMockData: true });
    await sandboxService.createUser({ nric: 'S2', generateMockData: true });

    const result = await sandboxService.listUsers({ limit: 10 });
    expect(result.items.length).toBe(2);
  });
});
