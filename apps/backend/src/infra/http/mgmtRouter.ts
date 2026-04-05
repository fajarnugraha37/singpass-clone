import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { rbac } from '../../infra/middleware/rbac';
import * as mgmtController from './controllers/mgmt.controller';
import { IAMService } from '../../core/iam/service';
import { ClientService } from '../../core/clients/service';
import { SandboxService } from '../../core/sandbox/service';
import { AdminService } from '../../core/admin/service';
import { SessionService } from '../../core/sessions/service';
import {
  RequestOtpSchema,
  VerifyOtpSchema,
  CreateClientSchema,
  UpdateClientSchema,
  CursorPaginationSchema,
  CreateSandboxUserSchema,
  ToggleSandboxUserStatusSchema,
  ResetSandboxUserPasswordSchema
} from '@vibe/shared/contracts/mgmt';

export const createMgmtRouter = (
  iamService: IAMService,
  clientService: ClientService,
  adminService: AdminService,
  sessionService: SessionService,
  sandboxService: SandboxService
) => {
  const mgmt = new Hono()
    // Public Auth Routes
    .post('/auth/request-otp', zValidator('json', RequestOtpSchema), mgmtController.requestOtp(iamService))
    .post('/auth/verify-otp', zValidator('json', VerifyOtpSchema), mgmtController.verifyOtp(iamService))
    .post('/auth/logout', mgmtController.logout())

    // Developer Routes (Protected)
    .route('/', new Hono().use('*', rbac('developer'))
      .get('/me', mgmtController.getMe())
      .get('/me/clients', mgmtController.getMyClients(clientService))
      .post('/me/clients', zValidator('json', CreateClientSchema), mgmtController.createClient(clientService))
      .post('/me/clients/:clientId/rotate-secret', mgmtController.rotateClientSecret(clientService))
      .delete('/me/clients/:clientId', mgmtController.deleteClient(clientService))
    )

    // Admin Routes (Protected)
    .route('/', new Hono().use('*', rbac('admin'))
      .get('/admin/developers', zValidator('query', CursorPaginationSchema), mgmtController.getAllDevelopers(adminService))
      .get('/admin/clients', zValidator('query', CursorPaginationSchema), mgmtController.getAllClients(adminService))
      .get('/admin/sessions', zValidator('query', CursorPaginationSchema), mgmtController.getAllSessions(adminService))
      .delete('/admin/sessions/:sessionId', mgmtController.revokeSession(sessionService))

      // Sandbox Routes
      .get('/admin/sandbox/users', zValidator('query', CursorPaginationSchema), mgmtController.listSandboxUsers(sandboxService))
      .post('/admin/sandbox/users', zValidator('json', CreateSandboxUserSchema), mgmtController.createSandboxUser(sandboxService))
      .patch('/admin/sandbox/users/:userId/status', zValidator('json', ToggleSandboxUserStatusSchema), mgmtController.toggleSandboxUserStatus(sandboxService))
      .post('/admin/sandbox/users/:userId/reset-password', zValidator('json', ResetSandboxUserPasswordSchema), mgmtController.resetSandboxUserPassword(sandboxService))
      .delete('/admin/sandbox/users/:userId', mgmtController.deleteSandboxUser(sandboxService))
    );

  return mgmt;
};

