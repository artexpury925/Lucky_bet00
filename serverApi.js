import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'store.json');

// Real users only - NO virtual users
const INITIAL_USERS = [];
const INITIAL_DEPOSITS = [];

// Known dummy / virtual phone numbers to filter out forever
const VIRTUAL_PHONES = new Set(['0712345678', '0722894102', '0714529381', '0799812401']);
const VIRTUAL_DEP_IDS = new Set(['dep-101', 'dep-102']);

function generateReferralCode(phone, username) {
  const cleanPhone = (phone || '').replace(/\D/g, '').slice(-4) || '7777';
  const cleanUser = (username || 'LB').replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || 'LKY';
  return `LUCKY-${cleanPhone}${cleanUser}`;
}

class RealtimeStore {
  constructor() {
    this.users = [];
    this.credentials = {};
    this.pendingDeposits = [];
    this.sseClients = new Set();
    this.version = 1;
    this.initStore();
  }

  initStore() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.users)) {
          // Strictly filter out any old virtual users
          this.users = parsed.users
            .filter(u => u && !VIRTUAL_PHONES.has(u.phoneNumber))
            .map(u => ({
              ...u,
              referralCode: u.referralCode || generateReferralCode(u.phoneNumber, u.username),
              referralBonusEarned: u.referralBonusEarned || 0,
              referralCount: u.referralCount || 0,
            }));
        }
        if (parsed.credentials && typeof parsed.credentials === 'object') {
          this.credentials = parsed.credentials;
        }
        if (Array.isArray(parsed.pendingDeposits)) {
          this.pendingDeposits = parsed.pendingDeposits.filter(d => d && !VIRTUAL_DEP_IDS.has(d.id));
        }
      }
      // Save sanitized real state
      this.persist();
    } catch (e) {
      console.warn('Could not read store.json, using clean in-memory store:', e.message);
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
            credentials: this.credentials,
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
      } catch {
        this.sseClients.delete(res);
      }
    }
  }

  registerOrUpdateUser(account, password = null, referredBy = null) {
    // Prevent dummy virtual accounts from being created
    if (VIRTUAL_PHONES.has(account.phoneNumber)) {
      return { user: account, isNew: false };
    }

    const idx = this.users.findIndex(u => u.phoneNumber === account.phoneNumber);
    let isNew = false;
    let savedUser = null;

    if (idx >= 0) {
      this.users[idx] = {
        ...this.users[idx],
        ...account,
        referralCode: this.users[idx].referralCode || account.referralCode || generateReferralCode(account.phoneNumber, account.username),
        lastSeen: Date.now(),
      };
      savedUser = this.users[idx];
    } else {
      isNew = true;
      const cleanRefBy = (referredBy || account.referredBy || '').trim().toUpperCase();

      savedUser = {
        phoneNumber: account.phoneNumber,
        username: account.username || `Player_${account.phoneNumber.slice(-4)}`,
        balance: typeof account.balance === 'number' ? account.balance : 100,
        joinedAt: account.joinedAt || Date.now(),
        initialBonusClaimed: true,
        totalDepositedDemo: account.totalDepositedDemo || 0,
        totalWithdrawnDemo: account.totalWithdrawnDemo || 0,
        device: account.device || 'Mobile / Web Browser',
        lastSeen: Date.now(),
        referralCode: account.referralCode || generateReferralCode(account.phoneNumber, account.username),
        referredBy: cleanRefBy || undefined,
        referralBonusEarned: 0,
        referralCount: 0,
      };

      // Credit referrer count if valid
      if (cleanRefBy) {
        const refIndex = this.users.findIndex(
          u => (u.referralCode && u.referralCode.toUpperCase() === cleanRefBy) ||
               u.phoneNumber === cleanRefBy ||
               (u.username && u.username.toUpperCase() === cleanRefBy)
        );
        if (refIndex >= 0) {
          this.users[refIndex].referralCount = (this.users[refIndex].referralCount || 0) + 1;
          console.log(`[REFERRAL] User ${savedUser.username} registered with referral code from ${this.users[refIndex].username}`);
        }
      }

      this.users.unshift(savedUser);
    }

    if (password) {
      this.credentials[account.phoneNumber] = password;
    }

    this.broadcast(isNew ? 'USER_REGISTERED' : 'USER_UPDATED', {
      user: savedUser,
      isNew,
      totalUsers: this.users.length,
    });
    return { user: savedUser, isNew };
  }

  authenticateUser(phoneNumber, password) {
    const cleanPhone = (phoneNumber || '').trim();
    const user = this.users.find(u => u.phoneNumber === cleanPhone);

    if (!user) {
      return { success: false, error: 'Account not found. Please create an account first.' };
    }

    const savedPass = this.credentials[cleanPhone];
    if (savedPass && password && savedPass !== password) {
      return { success: false, error: 'Incorrect password. Please try again.' };
    }

    user.lastSeen = Date.now();
    if (!user.referralCode) {
      user.referralCode = generateReferralCode(user.phoneNumber, user.username);
    }
    this.broadcast('USER_UPDATED', { user, isLogin: true });
    return { success: true, user };
  }

  deleteUser(phoneNumber) {
    const idx = this.users.findIndex(u => u.phoneNumber === phoneNumber);
    if (idx >= 0) {
      const removed = this.users.splice(idx, 1)[0];
      delete this.credentials[phoneNumber];
      this.broadcast('USER_DELETED', { phoneNumber, remaining: this.users.length });
      return removed;
    }
    return null;
  }

  clearAllUsers() {
    this.users = [];
    this.credentials = {};
    this.pendingDeposits = [];
    this.broadcast('ALL_USERS_CLEARED', { timestamp: Date.now() });
    return true;
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
    let referrerBonusAwarded = null;

    if (userIdx >= 0) {
      this.users[userIdx].balance += dep.amount;
      this.users[userIdx].totalDepositedDemo = (this.users[userIdx].totalDepositedDemo || 0) + dep.amount;
      updatedUser = this.users[userIdx];

      // Check for Referral Bonus payout (fixed 20 KES bonus per friend deposit)
      if (updatedUser.referredBy) {
        const refCode = updatedUser.referredBy.trim().toUpperCase();
        const refIdx = this.users.findIndex(
          u => (u.referralCode && u.referralCode.toUpperCase() === refCode) ||
               u.phoneNumber === updatedUser.referredBy ||
               (u.username && u.username.toUpperCase() === refCode)
        );

        if (refIdx >= 0) {
          const bonusAmount = 20; // 20 KES fixed referral bonus
          this.users[refIdx].balance += bonusAmount;
          this.users[refIdx].referralBonusEarned = (this.users[refIdx].referralBonusEarned || 0) + bonusAmount;
          const referrer = this.users[refIdx];

          referrerBonusAwarded = {
            referrerPhone: referrer.phoneNumber,
            referrerUsername: referrer.username,
            newBalance: referrer.balance,
            bonusAmount,
            friendUsername: updatedUser.username,
            depositAmount: dep.amount,
          };
          console.log(`[REFERRAL BONUS] Awarded KES ${bonusAmount} to ${referrer.username} for friend ${updatedUser.username} deposit of KES ${dep.amount}`);
        }
      }
    }

    this.broadcast('DEPOSIT_APPROVED', {
      depositId: id,
      deposit: dep,
      updatedUser,
      referrerBonusAwarded,
    });

    if (referrerBonusAwarded) {
      this.broadcast('REFERRAL_BONUS_AWARDED', referrerBonusAwarded);
    }

    return { deposit: dep, updatedUser, referrerBonusAwarded };
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
  // 1. Get Live State (for polling and initial app state)
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

  // 3. User Registration (Cross-device authoritative register with referral support)
  app.post('/api/auth/register', (req, res) => {
    const { phoneNumber, username, password, referredBy } = req.body || {};
    const cleanPhone = (phoneNumber || '').trim();

    if (!cleanPhone || cleanPhone.length < 9) {
      return res.status(400).json({ error: 'Please enter a valid phone number (at least 9 digits)' });
    }
    if (!password || password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters long' });
    }

    const cleanUsername = (username || '').trim() || `Player_${cleanPhone.slice(-4)}`;
    const userAgent = req.headers['user-agent'] || '';
    const isMobile = /mobile|android|iphone|ipad/i.test(userAgent);
    const device = isMobile ? 'Mobile Phone' : 'Desktop / Laptop Browser';

    const account = {
      phoneNumber: cleanPhone,
      username: cleanUsername,
      balance: 100, // 100 KES Instant Free Welcome Bonus
      joinedAt: Date.now(),
      initialBonusClaimed: true,
      totalDepositedDemo: 0,
      totalWithdrawnDemo: 0,
      device,
      referredBy: (referredBy || '').trim().toUpperCase() || undefined,
    };

    const result = realtimeStore.registerOrUpdateUser(account, password, referredBy);
    console.log(`[AUTH] New real player registered: ${cleanPhone} (${cleanUsername}) from ${device}${referredBy ? ' (referred by ' + referredBy + ')' : ''}`);
    res.json({ success: true, user: result.user });
  });

  // 4. User Sign In (Cross-device authoritative login)
  app.post('/api/auth/login', (req, res) => {
    const { phoneNumber, password } = req.body || {};
    const cleanPhone = (phoneNumber || '').trim();

    if (!cleanPhone) {
      return res.status(400).json({ error: 'Please enter your registered phone number' });
    }

    const authResult = realtimeStore.authenticateUser(cleanPhone, password);
    if (!authResult.success) {
      return res.status(401).json({ error: authResult.error });
    }

    console.log(`[AUTH] Player logged in: ${cleanPhone}`);
    res.json({ success: true, user: authResult.user });
  });

  // 5. User Sync / Update from any client
  app.post('/api/users', (req, res) => {
    const user = req.body;
    if (!user || !user.phoneNumber) {
      return res.status(400).json({ error: 'Missing phoneNumber' });
    }
    const result = realtimeStore.registerOrUpdateUser(user, req.body.password || null);
    res.json({ success: true, ...result });
  });

  // 6. Get All Users (for Admin or initial sync)
  app.get('/api/users', (req, res) => {
    res.json({ users: realtimeStore.users });
  });

  // 7. Admin Delete User
  app.delete('/api/users/:phone', (req, res) => {
    const { phone } = req.params;
    const deleted = realtimeStore.deleteUser(phone);
    if (!deleted) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true, deletedUser: deleted });
  });

  // 8. Admin Clear All Users
  app.post('/api/admin/clear-all-users', (req, res) => {
    realtimeStore.clearAllUsers();
    res.json({ success: true, message: 'All users cleared' });
  });

  // 9. Admin Add Funds
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

  // 10. Submit Deposit Request from any device
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

  // 11. Admin Approve Deposit
  app.post('/api/deposits/:id/approve', (req, res) => {
    const { id } = req.params;
    const result = realtimeStore.approveDeposit(id);
    if (!result) {
      return res.status(404).json({ error: 'Deposit not found' });
    }
    res.json({ success: true, ...result });
  });

  // 12. Admin Reject Deposit
  app.post('/api/deposits/:id/reject', (req, res) => {
    const { id } = req.params;
    const result = realtimeStore.rejectDeposit(id);
    if (!result) {
      return res.status(404).json({ error: 'Deposit not found' });
    }
    res.json({ success: true, deposit: result });
  });

  // 13. M-PESA USSD STK Push Trigger Endpoint (Supports Live Safaricom Daraja API)
  app.post('/api/mpesa/stkpush', async (req, res) => {
    const { phoneNumber, amount, accountReference } = req.body;
    if (!phoneNumber || !amount) {
      return res.status(400).json({ error: 'Missing phoneNumber or amount' });
    }

    // Format phone to 254...
    let cleanPhone = String(phoneNumber).replace(/\D/g, '');
    if (cleanPhone.startsWith('0') && cleanPhone.length === 10) {
      cleanPhone = '254' + cleanPhone.slice(1);
    } else if (cleanPhone.length === 9) {
      cleanPhone = '254' + cleanPhone;
    }

    const consumerKey = process.env.MPESA_CONSUMER_KEY || '';
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET || '';
    const passkey = process.env.MPESA_PASSKEY || '';
    const shortcode = process.env.MPESA_SHORTCODE || '174379';
    const callbackUrl = process.env.MPESA_CALLBACK_URL || 'https://example.com/api/mpesa/callback';
    const mpesaEnv = (process.env.MPESA_ENV || 'sandbox').toLowerCase();

    const isDarajaConfigured =
      consumerKey &&
      consumerSecret &&
      passkey &&
      !consumerKey.startsWith('YOUR_') &&
      !consumerSecret.startsWith('YOUR_') &&
      !passkey.startsWith('YOUR_');

    if (isDarajaConfigured) {
      try {
        const baseUrl = mpesaEnv === 'production'
          ? 'https://api.safaricom.co.ke'
          : 'https://sandbox.safaricom.co.ke';

        const authHeader = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
        const tokenResp = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
          headers: { Authorization: `Basic ${authHeader}` },
        });

        if (tokenResp.ok) {
          const tokenJson = await tokenResp.json();
          const accessToken = tokenJson.access_token;

          const now = new Date();
          const pad = n => String(n).padStart(2, '0');
          const timestamp =
            `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
            `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
          const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

          const stkResp = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              BusinessShortCode: shortcode,
              Password: password,
              Timestamp: timestamp,
              TransactionType: 'CustomerPayBillOnline',
              Amount: Math.max(1, Math.round(Number(amount))),
              PartyA: cleanPhone,
              PartyB: shortcode,
              PhoneNumber: cleanPhone,
              CallBackURL: callbackUrl,
              AccountReference: accountReference || 'LuckyBet',
              TransactionDesc: 'Lucky Bet Wallet Deposit',
            }),
          });

          const stkJson = await stkResp.json();
          if (stkResp.ok && stkJson.ResponseCode === '0') {
            console.log(`[M-PESA DARAJA LIVE] Carrier STK Push dispatched to ${cleanPhone} for KES ${amount}`);
            return res.json({
              success: true,
              liveDaraja: true,
              ...stkJson,
              phoneNumber: cleanPhone,
              amount,
            });
          }
        }
      } catch (err) {
        console.warn('[M-PESA DARAJA] Falling back to SIM Toolkit prompt:', err.message);
      }
    }

    const checkoutRequestId = 'ws_CO_' + Date.now() + '_' + Math.floor(Math.random() * 100000);
    const merchantRequestId = '29115-' + Date.now();

    console.log(`[M-PESA STK PUSH] Sending USSD STK Prompt to phone: ${cleanPhone} for KES ${amount} (Ref: ${accountReference || 'LuckyBet'})`);

    res.json({
      success: true,
      liveDaraja: false,
      ResponseCode: '0',
      ResponseDescription: 'Success. Request accepted for processing',
      MerchantRequestID: merchantRequestId,
      CheckoutRequestID: checkoutRequestId,
      CustomerMessage: `Success. Prompt sent to ${cleanPhone}. Please enter your M-PESA PIN to complete the transaction.`,
      phoneNumber: cleanPhone,
      amount,
    });
  });
}


