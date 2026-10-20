import { UserAccount, PendingDeposit } from '../types';

export interface LiveStatusResponse {
  status: string;
  version: number;
  timestamp: number;
  users: UserAccount[];
  pendingDeposits: PendingDeposit[];
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

  async syncUserToServer(user: UserAccount): Promise<boolean> {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });
      return res.ok;
    } catch (err) {
      console.warn('User server sync failed:', err);
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
      const res = await fetch(`/api/users/${phoneNumber}/funds`, {
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
