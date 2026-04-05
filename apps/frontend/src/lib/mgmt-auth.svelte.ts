import { client } from './rpc';

export interface User {
  id: string;
  email: string;
  role: 'developer' | 'admin';
}

class MgmtAuthStore {
  user = $state<User | null>(null);
  loading = $state(false);
  error = $state<string | null>(null);

  async checkMe(redirectPath?: string, requiredRole?: 'developer' | 'admin') {
    this.loading = true;
    try {
      const res = await client.api.mgmt.me.$get();
      if (res.ok) {
        const data = await res.json();
        
        // Enforce role-based access on the client side
        if (requiredRole === 'admin' && data.user.role !== 'admin') {
          this.user = null;
          if (redirectPath) window.location.href = redirectPath;
          return;
        }
        
        this.user = data.user;
      } else {
        this.user = null;
        if (redirectPath) window.location.href = redirectPath;
      }
    } catch (e) {
      this.user = null;
      if (redirectPath) window.location.href = redirectPath;
    } finally {
      this.loading = false;
    }
  }

  async login(email: string, code: string) {
    this.loading = true;
    this.error = null;
    try {
      const res = await client.api.mgmt.auth['verify-otp'].$post({
        json: { email, code }
      });
      if (res.ok) {
        const data = await res.json();
        this.user = data.user;
        return true;
      } else {
        const data = await res.json() as any;
        this.error = data.message || 'Login failed';
        return false;
      }
    } catch (e: any) {
      this.error = e.message;
      return false;
    } finally {
      this.loading = false;
    }
  }

  async logout() {
    await client.api.mgmt.auth.logout.$post();
    this.user = null;
    window.location.href = '/developer/login';
  }
}

export const mgmtAuth = new MgmtAuthStore();
