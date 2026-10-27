import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { api } from '../src/lib/api.js';

const originalFetch = globalThis.fetch;
after(() => {
  globalThis.fetch = originalFetch;
  api.setCsrfToken('');
});

test('API requests include cookies and CSRF on write methods', async () => {
  let captured;
  globalThis.fetch = async (_path, options) => {
    captured = options;
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  api.setCsrfToken('csrf-test-token');
  await api.get('/api/me');
  assert.equal(captured.credentials, 'include');
  assert.equal(captured.headers.get('X-CSRF'), null);
  await api.post('/api/items', { title_en: 'Test' });
  assert.equal(captured.credentials, 'include');
  assert.equal(captured.headers.get('X-CSRF'), 'csrf-test-token');
  assert.equal(captured.headers.get('Content-Type'), 'application/json');
});
