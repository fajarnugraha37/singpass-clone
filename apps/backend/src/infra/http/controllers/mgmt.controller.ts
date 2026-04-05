import type { Context } from 'hono';
import { setCookie, deleteCookie } from 'hono/cookie';
import { IAMService } from '../../../core/iam/service';
import { ClientService } from '../../../core/clients/service';
import { AdminService } from '../../../core/admin/service';
import { SessionService } from '../../../core/sessions/service';
import { SandboxService } from '../../../core/sandbox/service';

export const requestOtp = (iamService: IAMService) => {
  return async (c: Context) => {
    const { email } = await c.req.json();
    await iamService.requestOtp(email);
    return c.json({ success: true });
  };
};

export const registerDeveloper = (iamService: IAMService) => {
  return async (c: Context) => {
    const { email } = await c.req.json();
    const dev = await iamService.registerDeveloper(email);
    return c.json(dev, 201);
  };
};

export const verifyOtp = (iamService: IAMService) => {
  return async (c: Context) => {
    const { email, code } = await c.req.json();
    const result = await iamService.verifyOtp(email, code);

    const isProd = process.env.NODE_ENV === 'production';
    setCookie(c, 'vibe_mgmt_session', result.token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'Strict' : 'Lax',
      maxAge: 8 * 3600, // 8 hours
      path: '/',
    });

    return c.json({ user: result.user });
  };
};

export const logout = () => {
  return async (c: Context) => {
    const isProd = process.env.NODE_ENV === 'production';
    deleteCookie(c, 'vibe_mgmt_session', { 
      path: '/',
      secure: isProd,
      sameSite: isProd ? 'Strict' : 'Lax',
    });
    return c.json({ success: true });
  };
};

export const getMe = () => {
  return async (c: Context) => {
    const user = c.get('user');
    return c.json({ user });
  };
};

export const getMyClients = (clientService: ClientService) => {
  return async (c: Context) => {
    const user = c.get('user');
    const clients = await clientService.getDeveloperClients(user.sub);
    return c.json({ items: clients, nextCursor: null });
  };
};

export const createClient = (clientService: ClientService) => {
  return async (c: Context) => {
    const user = c.get('user');
    const data = await c.req.json();
    const client = await clientService.createClient(user.sub, data);
    return c.json(client);
  };
};

export const updateClient = (clientService: ClientService) => {
  return async (c: Context) => {
    const user = c.get('user');
    const clientId = c.req.param('clientId')!;
    const data = await c.req.json();
    const client = await clientService.updateClient(user.sub, clientId, data);
    return c.json(client);
  };
};

export const toggleClientStatus = (clientService: ClientService) => {
  return async (c: Context) => {
    const user = c.get('user');
    const clientId = c.req.param('clientId')!;
    const { isActive } = await c.req.json();
    const client = await clientService.toggleClientStatus(user.sub, clientId, isActive);
    return c.json(client);
  };
};

export const rotateClientSecret = (clientService: ClientService) => {
  return async (c: Context) => {
    const user = c.get('user');
    const clientId = c.req.param('clientId')!;
    const newSecret = await clientService.rotateSecret(user.sub, clientId);
    return c.json({ newSecret });
  };
};

export const deleteClient = (clientService: ClientService) => {
  return async (c: Context) => {
    const user = c.get('user');
    const clientId = c.req.param('clientId')!;
    await clientService.deleteClient(user.sub, clientId);
    return c.json({ success: true });
  };
};

export const getMySessions = (sessionService: SessionService) => {
  return async (c: Context) => {
    const user = c.get('user');
    const cursor = c.req.query('cursor');
    const limit = parseInt(c.req.query('limit') || '20');
    const result = await sessionService.listDeveloperSessions(user.sub, { cursor, limit });
    return c.json(result);
  };
};

export const revokeMySession = (sessionService: SessionService) => {
  return async (c: Context) => {
    const user = c.get('user');
    const sessionId = c.req.param('sessionId')!;
    await sessionService.revokeSession(sessionId, user.sub);
    return c.json({ success: true });
  };
};

// Admin Methods
export const getAllDevelopers = (adminService: AdminService) => {
  return async (c: Context) => {
    const cursor = c.req.query('cursor');
    const limit = parseInt(c.req.query('limit') || '20');
    const result = await adminService.listDevelopers({ cursor, limit });
    return c.json(result);
  };
};

export const getAllClients = (adminService: AdminService) => {
  return async (c: Context) => {
    const cursor = c.req.query('cursor');
    const limit = parseInt(c.req.query('limit') || '20');
    const result = await adminService.listClients({ cursor, limit });
    return c.json(result);
  };
};

export const getAllSessions = (adminService: AdminService) => {
  return async (c: Context) => {
    const cursor = c.req.query('cursor');
    const limit = parseInt(c.req.query('limit') || '20');
    const result = await adminService.listSessions({ cursor, limit });
    return c.json(result);
  };
};

export const revokeSession = (sessionService: SessionService) => {
  return async (c: Context) => {
    const sessionId = c.req.param('sessionId')!;
    await sessionService.revokeSession(sessionId);
    return c.json({ success: true });
  };
};

// Sandbox Methods
export const listSandboxUsers = (sandboxService: SandboxService) => {
  return async (c: Context) => {
    const cursor = c.req.query('cursor');
    const limit = parseInt(c.req.query('limit') || '20');
    const result = await sandboxService.listUsers({ cursor, limit });
    return c.json(result);
  };
};

export const createSandboxUser = (sandboxService: SandboxService) => {
  return async (c: Context) => {
    const data = await c.req.json();
    const user = await sandboxService.createUser(data);
    return c.json(user);
  };
};

export const deleteSandboxUser = (sandboxService: SandboxService) => {
  return async (c: Context) => {
    const userId = c.req.param('userId')!;
    await sandboxService.deleteUser(userId);
    return c.json({ success: true });
  };
};

export const toggleSandboxUserStatus = (sandboxService: SandboxService) => {
  return async (c: Context) => {
    const userId = c.req.param('userId')!;
    const { status } = await c.req.json();
    const user = await sandboxService.toggleSandboxUserStatus(userId, status);
    return c.json(user);
  };
};

export const resetSandboxUserPassword = (sandboxService: SandboxService) => {
  return async (c: Context) => {
    const userId = c.req.param('userId')!;
    const { newPassword } = await c.req.json();
    const generatedPassword = await sandboxService.resetSandboxUserPassword(userId, newPassword);
    return c.json({ success: true, password: generatedPassword });
  };
};


