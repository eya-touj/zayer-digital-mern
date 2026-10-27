const { after, before, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
process.env.NODE_ENV = 'test';

const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const store = require('../src/utils/store');

const records = Object.fromEntries(Object.keys(store.COLLECTIONS).map((key) => [key, []]));
const admin = { id: 'admin-1', name: 'Test Admin', email: 'admin@zayerdigital.tn', active: true };
records.admins.push(admin);
const passwordHashPromise = bcrypt.hash('correct-horse-battery', 4);

store.findOne = async (resource, filter) => {
  if (resource === 'admins' && filter.email === admin.email) return { ...admin, passwordHash: await passwordHashPromise };
  return records[resource]?.find((row) => Object.entries(filter).every(([key, value]) => String(row[key]) === String(value))) || null;
};
store.findById = async (resource, id) => records[resource]?.find((row) => String(row.id) === String(id))
  || (resource === 'admins' && String(id) === admin.id ? admin : null);
store.list = async (resource, filter = {}, options = {}) => {
  let rows = (records[resource] || []).filter((row) => Object.entries(filter).every(([key, value]) => String(row[key]) === String(value)));
  if (options.q) rows = rows.filter((row) => options.searchFields.some((field) => String(row[field] || '').toLowerCase().includes(options.q.toLowerCase())));
  if (options.page !== undefined) {
    const page = Number(options.page) || 1;
    const limit = Number(options.limit) || 25;
    return { rows: rows.slice((page - 1) * limit, page * limit), total: rows.length, page, limit, pages: Math.ceil(rows.length / limit) };
  }
  return rows.slice(0, options.limit || 1000);
};
store.create = async (resource, values) => {
  const row = { ...values, id: `${resource}-${records[resource].length + 1}`, createdAt: new Date().toISOString() };
  records[resource].push(row);
  return { ...row };
};
store.update = async (resource, id, values) => {
  const row = records[resource]?.find((entry) => String(entry.id) === String(id));
  if (!row) return null;
  Object.assign(row, values);
  return { ...row };
};
store.remove = async (resource, id) => {
  const index = records[resource]?.findIndex((entry) => String(entry.id) === String(id));
  if (index === undefined || index < 0) return null;
  return records[resource].splice(index, 1)[0];
};

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api', require('../src/routes/cms.routes'));
app.use((error, _req, res, _next) => res.status(error.status || 500).json({ error: error.message }));
let server;
let baseUrl;
let cookieHeader;
let csrf;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  const response = await fetch(`${baseUrl}/api/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: admin.email, password: 'correct-horse-battery' }),
  });
  assert.equal(response.status, 200);
  const payload = await response.json();
  csrf = payload.csrf;
  cookieHeader = response.headers.getSetCookie().map((entry) => entry.split(';')[0]).join('; ');
});

after(async () => {
  if (server) {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});

test('admin resources require an authenticated session', async () => {
  const response = await fetch(`${baseUrl}/api/items?page=1&limit=10`);
  assert.equal(response.status, 401);
});

test('admin writes reject missing CSRF tokens', async () => {
  const response = await fetch(`${baseUrl}/api/serviceItems`, {
    method: 'POST',
    headers: { cookie: cookieHeader, 'content-type': 'application/json' },
    body: JSON.stringify({ label: 'Audit service' }),
  });
  assert.equal(response.status, 403);
});

test('portfolio project folder uploads require an authenticated CSRF-protected session', async () => {
  const anonymous = await fetch(`${baseUrl}/api/portfolio/upload-folder`, { method: 'POST' });
  assert.equal(anonymous.status, 401);

  const body = new FormData();
  body.append('slug', 'sample-site');
  body.append('paths', '[]');
  const noFiles = await fetch(`${baseUrl}/api/portfolio/upload-folder`, {
    method: 'POST',
    headers: { cookie: cookieHeader, 'x-csrf': csrf },
    body,
  });
  assert.equal(noFiles.status, 422);
  assert.equal((await noFiles.json()).error, 'project_files_required');
});

test('portfolio project folders preserve their paths and return the entry URL', async () => {
  const slug = `admin-upload-test-${crypto.randomUUID().slice(0, 8)}`;
  const rootFolder = slug;
  const body = new FormData();
  body.append('slug', slug);
  body.append('paths', JSON.stringify([`${rootFolder}/index.html`, `${rootFolder}/assets/site.css`]));
  body.append('files', new Blob(['<!doctype html><title>Project test</title>']), 'index.html');
  body.append('files', new Blob(['body { color: navy; }']), 'site.css');
  const projectDirectories = [
    path.resolve(__dirname, '../../frontend/public/portfolio/sites', slug),
    path.resolve(__dirname, '../uploads/portfolio-sites', slug),
    path.resolve('/var/www/zayer-mern/portfolio/sites', slug),
  ];
  const backendSitesRoot = path.resolve(__dirname, '../uploads/portfolio-sites');
  const backendSitesRootExisted = fs.existsSync(backendSitesRoot);
  if (process.env.PORTFOLIO_SITES_DIR) projectDirectories.push(path.resolve(process.env.PORTFOLIO_SITES_DIR, slug));
  const response = await fetch(`${baseUrl}/api/portfolio/upload-folder`, {
    method: 'POST',
    headers: { cookie: cookieHeader, 'x-csrf': csrf },
    body,
  });
  try {
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.deepEqual({ ok: result.ok, slug: result.slug, link_url: result.link_url, fileCount: result.fileCount }, {
      ok: true, slug, link_url: `/portfolio/sites/${slug}/index.html`, fileCount: 2,
    });
    for (const directory of projectDirectories.slice(0, 2)) {
      assert.equal(fs.existsSync(directory), true);
      assert.equal(fs.readFileSync(path.join(directory, 'index.html'), 'utf8'), '<!doctype html><title>Project test</title>');
      assert.equal(fs.readFileSync(path.join(directory, 'assets', 'site.css'), 'utf8'), 'body { color: navy; }');
    }
  } finally {
    await Promise.all(projectDirectories.map((directory) => fs.promises.rm(directory, { recursive: true, force: true })));
    if (!backendSitesRootExisted) await fs.promises.rmdir(backendSitesRoot).catch((error) => {
      if (error.code !== 'ENOENT' && error.code !== 'ENOTEMPTY') throw error;
    });
  }
});

test('service CRUD and server-side pagination succeed with CSRF', async () => {
  const create = await fetch(`${baseUrl}/api/serviceItems`, {
    method: 'POST',
    headers: { cookie: cookieHeader, 'x-csrf': csrf, 'content-type': 'application/json' },
    body: JSON.stringify({ label: 'Audit service', label_en: 'Audit service', label_fr: 'Service test', price: 250, visible: true }),
  });
  const createPayload = await create.json();
  assert.equal(create.status, 200, JSON.stringify(createPayload));
  const { id } = createPayload;

  const list = await fetch(`${baseUrl}/api/serviceItems?page=1&limit=1&q=Audit`, { headers: { cookie: cookieHeader } });
  assert.equal(list.status, 200);
  const page = await list.json();
  assert.equal(page.total, 1);
  assert.equal(page.rows[0].id, id);

  const update = await fetch(`${baseUrl}/api/serviceItems/${id}`, {
    method: 'PATCH',
    headers: { cookie: cookieHeader, 'x-csrf': csrf, 'content-type': 'application/json' },
    body: JSON.stringify({ price: 300 }),
  });
  assert.equal(update.status, 200);

  const remove = await fetch(`${baseUrl}/api/serviceItems/${id}`, {
    method: 'DELETE',
    headers: { cookie: cookieHeader, 'x-csrf': csrf },
  });
  assert.equal(remove.status, 204);
});

test('invalid resource data is rejected before persistence', async () => {
  const cases = [
    ['/api/items', { page: 'home' }],
    ['/api/jobs', { dept: 'Design' }],
    ['/api/portfolioItems', { title: 'Project', tab_type: 'invalid' }],
    ['/api/portfolioItems', { title: 'Project without link', tab_type: 'web' }],
    ['/api/serviceItems', { label: 'Service', price: -1 }],
    ['/api/components', { page: 'home', title: 'Empty component' }],
    ['/api/contactBoxes', { label: '', value: '' }],
    ['/api/socialItems', { label: '' }],
    ['/api/settings', { skey: '', value_fr: 'Invalide' }],
    ['/api/blocks', { bkey: 'home.title', page: 'unknown' }],
  ];
  for (const [path, body] of cases) {
    const response = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: { cookie: cookieHeader, 'x-csrf': csrf, 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    assert.equal(response.status, 422, `${path} should reject invalid fields`);
  }
});

test('admin responses omit password hashes and protect the final active account', async () => {
  const response = await fetch(`${baseUrl}/api/admins?page=1&limit=10`, { headers: { cookie: cookieHeader } });
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.rows.length, 1);
  assert.equal(Object.hasOwn(result.rows[0], 'passwordHash'), false);

  const disable = await fetch(`${baseUrl}/api/admins/${admin.id}`, {
    method: 'PATCH',
    headers: { cookie: cookieHeader, 'x-csrf': csrf, 'content-type': 'application/json' },
    body: JSON.stringify({ active: false }),
  });
  assert.equal(disable.status, 409);

  const weakPassword = await fetch(`${baseUrl}/api/admins`, {
    method: 'POST',
    headers: { cookie: cookieHeader, 'x-csrf': csrf, 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Another admin', email: 'other@zayerdigital.tn', password: 'short' }),
  });
  assert.equal(weakPassword.status, 422);
});
