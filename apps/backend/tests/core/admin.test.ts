import { describe, it, expect, beforeEach } from 'bun:test';
import { AdminService } from '../../src/core/admin/service';
import { getDb } from '../../src/infra/database/client';
import { developers } from '../../src/infra/database/schema';
import { sql } from 'drizzle-orm';

describe('AdminService', () => {
  let adminService: AdminService;
  let db: any;

  beforeEach(async () => {
    db = await getDb();
    await db.delete(developers);
    
    // Seed some developers with different timestamps
    for (let i = 1; i <= 25; i++) {
      const id = i.toString().padStart(3, '0');
      await db.insert(developers).values({
        id: `dev-${id}`,
        email: `dev${id}@example.com`,
        createdAt: new Date(Date.now() - i * 1000), // Ensures different timestamps
      });
    }

    adminService = new AdminService(db);
  });

  it('should list items with cursor pagination', async () => {
    // 1. Fetch first page
    const page1 = await adminService.listDevelopers({ limit: 10 });
    expect(page1.items.length).toBe(10);
    expect(page1.nextCursor).not.toBeNull();

    // 2. Fetch second page
    const page2 = await adminService.listDevelopers({ limit: 10, cursor: page1.nextCursor });
    expect(page2.items.length).toBe(10);
    expect(page2.items[0].id).not.toBe(page1.items[9].id);
    expect(page2.nextCursor).not.toBeNull();

    // 3. Fetch third page (last 5 items)
    const page3 = await adminService.listDevelopers({ limit: 10, cursor: page2.nextCursor });
    expect(page3.items.length).toBe(5);
    expect(page3.nextCursor).toBeNull();
  });
});
