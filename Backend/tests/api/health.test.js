import test from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
const { startServer } = await import('../../src/index.js');

let server;
let baseUrl;

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

test('GET /health returns healthy', async () => {
  const res = await fetch(`${baseUrl}/health`, {
    headers: { connection: 'close' },
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.success, true);
  assert.equal(body.status, 'healthy');
});
