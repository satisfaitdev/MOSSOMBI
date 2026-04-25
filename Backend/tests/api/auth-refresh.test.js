import test from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
const { startServer } = await import('../../src/index.js');

let server;
let baseUrl;

function readSetCookies(res) {
  if (typeof res.headers.getSetCookie === 'function') {
    return res.headers.getSetCookie();
  }
  const single = res.headers.get('set-cookie');
  return single ? [single] : [];
}

function mergeCookies(existing, setCookies) {
  const jar = new Map(existing);
  for (const raw of setCookies) {
    const firstPart = String(raw).split(';')[0];
    const idx = firstPart.indexOf('=');
    if (idx === -1) continue;
    const name = firstPart.slice(0, idx).trim();
    const value = firstPart.slice(idx + 1).trim();
    jar.set(name, value);
  }
  return jar;
}

function cookieHeader(cookieJar) {
  return Array.from(cookieJar.entries())
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('; ');
}

test.before(async () => {
  const started = await startServer({ port: 0, hostname: '127.0.0.1', logStartup: false });
  server = started.server;
  baseUrl = started.baseUrl;
});

test.after(async () => {
  if (!server) return;
  server.closeIdleConnections?.();
  server.closeAllConnections?.();
  await new Promise((resolve) => server.close(resolve));
});

test('POST /api/v1/auth/refresh requires refresh_token', async () => {
  const res = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', connection: 'close' },
    body: JSON.stringify({}),
  });

  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.success, false);
});

test('auth flow: register -> login -> refresh -> logout revokes refresh token', async () => {
  let cookies = new Map();

  const nonce = Math.random().toString(16).slice(2);
  const email = `test_${nonce}@example.com`;
  const password = `TestPwd_${nonce}`;
  const phone = `+24206${String(Math.floor(Math.random() * 1e8)).padStart(8, '0')}`;

  // register
  const registerRes = await fetch(`${baseUrl}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', connection: 'close' },
    body: JSON.stringify({
      phone,
      password,
      full_name: 'Test User',
      email,
      country_code: 'CG',
    }),
  });

  assert.equal(registerRes.status, 200);
  cookies = mergeCookies(cookies, readSetCookies(registerRes));
  const registerBody = await registerRes.json();
  assert.equal(registerBody.success, true);
  assert.ok(registerBody.data?.access_token);
  assert.ok(cookies.get('refresh_token'));

  // login
  const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', connection: 'close' },
    body: JSON.stringify({ email, password }),
  });

  assert.equal(loginRes.status, 200);
  cookies = mergeCookies(cookies, readSetCookies(loginRes));
  const loginBody = await loginRes.json();
  assert.equal(loginBody.success, true);
  const refreshToken1 = cookies.get('refresh_token');
  assert.ok(refreshToken1);

  // refresh (rotation)
  const refreshRes = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      connection: 'close',
      cookie: cookieHeader(cookies),
    },
    body: JSON.stringify({}),
  });

  assert.equal(refreshRes.status, 200);
  cookies = mergeCookies(cookies, readSetCookies(refreshRes));
  const refreshBody = await refreshRes.json();
  assert.equal(refreshBody.success, true);
  const refreshToken2 = cookies.get('refresh_token');
  assert.ok(refreshToken2);
  assert.notEqual(refreshToken2, refreshToken1);

  // logout (revoke current refresh)
  const logoutRes = await fetch(`${baseUrl}/api/v1/auth/logout`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      connection: 'close',
      cookie: cookieHeader(cookies),
    },
    body: JSON.stringify({}),
  });

  assert.equal(logoutRes.status, 200);
  cookies = mergeCookies(cookies, readSetCookies(logoutRes));
  const logoutBody = await logoutRes.json();
  assert.equal(logoutBody.success, true);

  // refresh without cookie/token should fail (cookie cleared on logout)
  const refreshAfterLogout = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      connection: 'close',
      cookie: cookieHeader(cookies),
    },
    body: JSON.stringify({}),
  });

  assert.equal(refreshAfterLogout.status, 400);
  const refreshAfterLogoutBody = await refreshAfterLogout.json();
  assert.equal(refreshAfterLogoutBody.success, false);

  // verify revocation: old refresh token should now be rejected
  const refreshWithOldToken = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      connection: 'close',
      cookie: cookieHeader(cookies),
    },
    body: JSON.stringify({ refresh_token: refreshToken2 }),
  });

  assert.equal(refreshWithOldToken.status, 401);
  const refreshWithOldTokenBody = await refreshWithOldToken.json();
  assert.equal(refreshWithOldTokenBody.success, false);
});
