import { UserAccount, PendingDeposit } from '../types';

export interface LiveStatusResponse {
  status: string;
  version: number;
  timestamp: number;
  users: UserAccount[];
  pendingDeposits: PendingDeposit[];
}

export interface AuthResponse {
  success: boolean;
  user?: UserAccount;
  error?: string;
}

export const realtimeClient = {
  async fetchLiveStatus(): Promise<LiveStatusResponse | null> {
    try {
      const res = await fetch('/api/live-status', {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.warn('Realtime sync fetch failed:', err);
      return null;
    }
  },

  async registerUser(params: {
    phoneNumber: string;
    username: string;
    password?: string;
  }): Promise<AuthResponse> {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Registration failed' };
      }
      return { success: true, user: data.user };
    } catch (err: any) {
      console.warn('Registration network request failed, falling back to local mode:', err);
      return { success: false, error: 'Network error connecting to server' };
    }
  },

  async loginUser(params: {
    phoneNumber: string;
    password?: string;
  }): Promise<AuthResponse> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Login failed' };
      }
      return { success: true, user: data.user };
    } catch (err: any) {
      console.warn('Login network request failed, falling back to local mode:', err);
      return { success: false, error: 'Network error connecting to server' };
    }
  },

  async syncUserToServer(user: UserAccount, password?: string): Promise<boolean> {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...user, password }),
      });
      return res.ok;
    } catch (err) {
      console.warn('User server sync failed:', err);
      return false;
    }
  },

  async deleteUser(phoneNumber: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(phoneNumber)}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch (err) {
      console.warn('Delete user failed:', err);
      return false;
    }
  },

  async clearAllUsers(): Promise<boolean> {
    try {
      const res = await fetch('/api/admin/clear-all-users', {
        method: 'POST',
      });
      return res.ok;
    } catch (err) {
      console.warn('Clear all users failed:', err);
      return false;
    }
  },

  async submitDeposit(deposit: PendingDeposit): Promise<boolean> {
    try {
      const res = await fetch('/api/deposits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deposit),
      });
      return res.ok;
    } catch (err) {
      console.warn('Deposit server sync failed:', err);
      return false;
    }
  },

  async approveDeposit(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/deposits/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      return res.ok;
    } catch (err) {
      console.warn('Approve deposit failed:', err);
      return false;
    }
  },

  async rejectDeposit(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/deposits/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      return res.ok;
    } catch (err) {
      console.warn('Reject deposit failed:', err);
      return false;
    }
  },

  async adminCreditUser(phoneNumber: string, amount: number): Promise<boolean> {
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(phoneNumber)}/funds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      return res.ok;
    } catch (err) {
      console.warn('Admin credit failed:', err);
      return false;
    }
  },

  subscribeToEvents(onEvent: (event: { type: string; data?: any; users?: UserAccount[]; pendingDeposits?: PendingDeposit[] }) => void): () => void {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
      return () => {};
    }

    try {
      const source = new EventSource('/api/events');
      source.onmessage = (e) => {
        try {
          const parsed = JSON.parse(e.data);
          onEvent(parsed);
        } catch {}
      };
      source.onerror = () => {
        // SSE will attempt to reconnect automatically
      };
      return () => {
        source.close();
      };
    } catch {
      return () => {};
    }
  },
};
