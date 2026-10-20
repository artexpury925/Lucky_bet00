import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'store.json');

const INITIAL_USERS = [
  {
    phoneNumber: '0712345678',
    username: 'LuckyPlayer_254',
    balance: 500.0,
    joinedAt: Date.now() - 86400000,
    initialBonusClaimed: true,
    totalDepositedDemo: 0,
    totalWithdrawnDemo: 0,
  },
  {
    phoneNumber: '0722894102',
    username: 'Kiprotich_99',
    balance: 750.0,
    joinedAt: Date.now() - 43200000,
    initialBonusClaimed: true,
    totalDepositedDemo: 200,
    totalWithdrawnDemo: 0,
  },
  {
    phoneNumber: '0714529381',
    username: 'Amina_Bet',
    balance: 1200.0,
    joinedAt: Date.now() - 21600000,
    initialBonusClaimed: true,
    totalDepositedDemo: 500,
    totalWithdrawnDemo: 0,
  },
  {
    phoneNumber: '0799812401',
    username: 'Omondi_K',
    balance: 350.0,
    joinedAt: Date.now() - 10800000,
    initialBonusClaimed: true,
    totalDepositedDemo: 0,
    totalWithdrawnDemo: 0,
  },
];

const INITIAL_DEPOSITS = [
  {
    id: 'dep-101',
    phoneNumber: '0722894102',
    username: 'Kiprotich_99',
    amount: 200,
    code: 'QKF81920J1',
    timestamp: Date.now() - 120000,
    status: 'PENDING',
  },
  {
    id: 'dep-102',
    phoneNumber: '0714529381',
    username: 'Amina_Bet',
    amount: 300,
    code: 'QK9103982A',
    timestamp: Date.now() - 360000,
    status: 'PENDING',
  },
];

class RealtimeStore {
  constructor() {
    this.users = [...INITIAL_USERS];
    this.pendingDeposits = [...INITIAL_DEPOSITS];
    this.version = 1;
    this.sseClients = new Set();
    this.initStore();
  }

  initStore() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.users) && parsed.users.length > 0) {
          this.users = parsed.users;
        }
        if (Array.isArray(parsed.pendingDeposits)) {
          this.pendingDeposits = parsed.pendingDeposits;
        }
      } else {
        this.persist();
      }
    } catch (e) {
      console.warn('Could not read store.json, using in-memory store:', e.message);
    }
  }

  persist() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(
        DB_FILE,
        JSON.stringify(
          {
            users: this.users,
            pendingDeposits: this.pendingDeposits,
            version: this.version,
            updatedAt: Date.now(),
          },
          null,
          2
        )
      );
    } catch (e) {
      console.error('Failed to persist store.json:', e);
    }
  }

  broadcast(eventType, data) {
    this.version++;
    this.persist();
    const payload = JSON.stringify({
      type: eventType,
      data,
      users: this.users,
      pendingDeposits: this.pendingDeposits,
      version: this.version,
      timestamp: Date.now(),
    });
    for (const res of this.sseClients) {
      try {
        res.write(`data: ${payload}\n\n`);
      } catch (err) {
        this.sseClients.delete(res);
      }
    }
  }

  registerOrUpdateUser(account) {
    const idx = this.users.findIndex(u => u.phoneNumber === account.phoneNumber);
    let isNew = false;
    if (idx >= 0) {
      this.users[idx] = { ...this.users[idx], ...account };
    } else {
      isNew = true;
      this.users.unshift(account);
    }
    this.broadcast(isNew ? 'USER_REGISTERED' : 'USER_UPDATED', {
      user: account,
      isNew,
      totalUsers: this.users.length,
    });
    return { user: account, isNew };
  }

  addFunds(phone, amount) {
    const idx = this.users.findIndex(u => u.phoneNumber === phone);
    if (idx >= 0) {
      const u = this.users[idx];
      u.balance += amount;
      this.broadcast('USER_UPDATED', { user: u, amountAdded: amount });
      return u;
    }
    return null;
  }

  addDeposit(deposit) {
    this.pendingDeposits.unshift(deposit);
    this.broadcast('DEPOSIT_CREATED', { deposit, totalPending: this.pendingDeposits.length });
    return deposit;
  }

  approveDeposit(id) {
    const depIdx = this.pendingDeposits.findIndex(d => d.id === id);
    if (depIdx === -1) return null;
    const dep = this.pendingDeposits[depIdx];
    this.pendingDeposits.splice(depIdx, 1);

    // Credit user if exists
    const userIdx = this.users.findIndex(u => u.phoneNumber === dep.phoneNumber);
    let updatedUser = null;
    if (userIdx >= 0) {
      this.users[userIdx].balance += dep.amount;
      this.users[userIdx].totalDepositedDemo = (this.users[userIdx].totalDepositedDemo || 0) + dep.amount;
      updatedUser = this.users[userIdx];
    }

    this.broadcast('DEPOSIT_APPROVED', {
      depositId: id,
      deposit: dep,
      updatedUser,
    });
    return { deposit: dep, updatedUser };
  }

  rejectDeposit(id) {
    const depIdx = this.pendingDeposits.findIndex(d => d.id === id);
    if (depIdx === -1) return null;
    const dep = this.pendingDeposits[depIdx];
    this.pendingDeposits.splice(depIdx, 1);
    this.broadcast('DEPOSIT_REJECTED', { depositId: id });
    return dep;
  }
}

export const realtimeStore = new RealtimeStore();

export function setupApiRoutes(app) {
  // 1. Get Live State (for polling and initialization)
  app.get('/api/live-status', (req, res) => {
    res.json({
      status: 'ok',
      version: realtimeStore.version,
      timestamp: Date.now(),
      users: realtimeStore.users,
      pendingDeposits: realtimeStore.pendingDeposits,
    });
  });

  // 2. Real-time SSE Stream
  app.get('/api/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // Send initial snapshot
    const initial = JSON.stringify({
      type: 'INIT_SNAPSHOT',
      version: realtimeStore.version,
      users: realtimeStore.users,
      pendingDeposits: realtimeStore.pendingDeposits,
      timestamp: Date.now(),
    });
    res.write(`data: ${initial}\n\n`);

    realtimeStore.sseClients.add(res);

    // Keep connection alive with heartbeat comments every 20s
    const heartbeat = setInterval(() => {
      try {
        res.write(': heartbeat\n\n');
      } catch (e) {
        clearInterval(heartbeat);
      }
    }, 20000);

    req.on('close', () => {
      clearInterval(heartbeat);
      realtimeStore.sseClients.delete(res);
    });
  });

  // 3. User Registration / Sync from any device
  app.post('/api/users', (req, res) => {
    const user = req.body;
    if (!user || !user.phoneNumber) {
      return res.status(400).json({ error: 'Missing phoneNumber' });
    }
    const result = realtimeStore.registerOrUpdateUser(user);
    res.json({ success: true, ...result });
  });

  // 4. Admin Add Funds
  app.post('/api/users/:phone/funds', (req, res) => {
    const { phone } = req.params;
    const { amount } = req.body;
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    const updatedUser = realtimeStore.addFunds(phone, amount);
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true, user: updatedUser });
  });

  // 5. Submit Deposit Request from any device
  app.post('/api/deposits', (req, res) => {
    const deposit = req.body;
    if (!deposit || !deposit.phoneNumber || !deposit.amount) {
      return res.status(400).json({ error: 'Invalid deposit data' });
    }
    const saved = realtimeStore.addDeposit({
      id: deposit.id || 'dep-' + Date.now(),
      phoneNumber: deposit.phoneNumber,
      username: deposit.username || 'Player',
      amount: deposit.amount,
      code: deposit.code || 'QK' + Math.floor(10000000 + Math.random() * 90000000),
      timestamp: deposit.timestamp || Date.now(),
      status: 'PENDING',
    });
    res.json({ success: true, deposit: saved });
  });

  // 6. Admin Approve Deposit
  app.post('/api/deposits/:id/approve', (req, res) => {
    const { id } = req.params;
    const result = realtimeStore.approveDeposit(id);
    if (!result) {
      return res.status(404).json({ error: 'Deposit not found' });
    }
    res.json({ success: true, ...result });
  });

  // 7. Admin Reject Deposit
  app.post('/api/deposits/:id/reject', (req, res) => {
    const { id } = req.params;
    const result = realtimeStore.rejectDeposit(id);
    if (!result) {
      return res.status(404).json({ error: 'Deposit not found' });
    }
    res.json({ success: true, deposit: result });
  });
}
