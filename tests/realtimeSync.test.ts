import test from 'node:test';
import assert from 'node:assert';
import express from 'express';
import { setupApiRoutes, realtimeStore } from '../serverApi.js';

test('Real-time API and Cross-Device Synchronization', async (t) => {
  const app = express();
  app.use(express.json());
  setupApiRoutes(app);

  const server = app.listen(0);
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 3000;
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(() => {
    server.close();
  });

  await t.test('1. GET /api/live-status returns initial state', async () => {
    const res = await fetch(`${baseUrl}/api/live-status`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.status, 'ok');
    assert.ok(Array.isArray(body.users));
    assert.ok(Array.isArray(body.pendingDeposits));
  });

  await t.test('2. POST /api/users registers user from device and updates live store', async () => {
    const testUser = {
      phoneNumber: '0799001122',
      username: 'Device2_Player',
      balance: 500,
      joinedAt: Date.now(),
      initialBonusClaimed: true,
      totalDepositedDemo: 0,
      totalWithdrawnDemo: 0,
    };

    const res = await fetch(`${baseUrl}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser),
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.user.phoneNumber, '0799001122');

    // Verify user is visible in live status for admin panel
    const statusRes = await fetch(`${baseUrl}/api/live-status`);
    const statusBody = await statusRes.json();
    const found = statusBody.users.find((u: any) => u.phoneNumber === '0799001122');
    assert.ok(found, 'New user from another device should be present in live users list');
    assert.strictEqual(found.username, 'Device2_Player');
  });

  await t.test('3. POST /api/users/:phone/funds adds funds to user', async () => {
    const res = await fetch(`${baseUrl}/api/users/0799001122/funds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 250 }),
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.user.balance, 750);
  });

  await t.test('4. POST /api/deposits and approval works across devices', async () => {
    const depRes = await fetch(`${baseUrl}/api/deposits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: '0799001122',
        username: 'Device2_Player',
        amount: 300,
        code: 'QKTEST1234',
      }),
    });
    assert.strictEqual(depRes.status, 200);
    const depBody = await depRes.json();
    assert.strictEqual(depBody.success, true);
    const depositId = depBody.deposit.id;

    // Approve deposit via admin endpoint
    const appRes = await fetch(`${baseUrl}/api/deposits/${depositId}/approve`, {
      method: 'POST',
    });
    assert.strictEqual(appRes.status, 200);
    const appBody = await appRes.json();
    assert.strictEqual(appBody.success, true);
    assert.strictEqual(appBody.updatedUser.balance, 1050);
  });
});
