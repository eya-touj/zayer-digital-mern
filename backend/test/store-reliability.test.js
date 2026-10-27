const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const storePath = require.resolve('../src/utils/store');

test('production writes fail with 503 while MongoDB is unavailable', async () => {
  const previousEnvironment = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  delete require.cache[storePath];
  const store = require(storePath);
  try {
    await assert.rejects(store.create('messages', { body: 'must not be persisted locally' }), (error) => error.status === 503);
  } finally {
    if (previousEnvironment === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousEnvironment;
    delete require.cache[storePath];
  }
});

test('invalid local JSON is preserved under a corrupt filename and raises an explicit error', () => {
  const originalRead = fs.readFileSync;
  const originalMkdir = fs.mkdirSync;
  const originalRename = fs.renameSync;
  const originalError = console.error;
  let preservedPath = '';
  fs.mkdirSync = () => {};
  fs.readFileSync = (filePath, ...args) => String(filePath).endsWith('local-db.json') ? '{invalid json' : originalRead.call(fs, filePath, ...args);
  fs.renameSync = (_source, destination) => { preservedPath = destination; };
  console.error = () => {};
  delete require.cache[storePath];
  const store = require(storePath);
  try {
    assert.throws(() => store.loadLocalDb(), /Local JSON data is invalid/);
    assert.match(preservedPath, /\.corrupt-\d+$/);
  } finally {
    fs.readFileSync = originalRead;
    fs.mkdirSync = originalMkdir;
    fs.renameSync = originalRename;
    console.error = originalError;
    delete require.cache[storePath];
  }
});

test('local write queue continues after a failed write', async () => {
  const originalRead = fs.readFileSync;
  const originalMkdir = fs.mkdirSync;
  const originalWriteSync = fs.writeFileSync;
  const originalWrite = fs.promises.writeFile;
  const originalRename = fs.promises.rename;
  const originalRenameSync = fs.renameSync;
  let writes = 0;
  fs.mkdirSync = () => {};
  fs.readFileSync = (filePath, ...args) => String(filePath).endsWith('local-db.json') ? '{}' : originalRead.call(fs, filePath, ...args);
  fs.writeFileSync = () => {};
  fs.renameSync = () => {};
  fs.promises.writeFile = async () => {
    writes += 1;
    if (writes === 1) throw new Error('simulated file write failure');
  };
  fs.promises.rename = async () => {};
  delete require.cache[storePath];
  const store = require(storePath);
  try {
    await assert.rejects(store.saveLocalDb(), /simulated file write failure/);
    await store.saveLocalDb();
    assert.equal(writes, 2);
  } finally {
    fs.readFileSync = originalRead;
    fs.mkdirSync = originalMkdir;
    fs.writeFileSync = originalWriteSync;
    fs.promises.writeFile = originalWrite;
    fs.promises.rename = originalRename;
    fs.renameSync = originalRenameSync;
    delete require.cache[storePath];
  }
});

test('portfolio defaults include requested projects and discovery finds deployed site folders', () => {
  const store = require(storePath);
  const links = new Set(store.PORTFOLIO_SEEDS.map((project) => project.link_url));
  assert.equal(links.has('/portfolio/sites/crystal-rent-car/index.html'), true);
  assert.equal(links.has('/portfolio/sites/nessrinou-shoes/index.html'), true);
  assert.equal(links.has('/portfolio/sites/see-you-store/index.html'), true);
  assert.equal(links.has('https://coin-de-beaut-by-yosr.ai.studio'), true);
  assert.equal(links.has('https://gym-time-fitness-club.ai.studio'), true);

  const discoveredLinks = new Set(store.discoverPortfolioSites().map((project) => project.link_url));
  assert.equal(discoveredLinks.has('/portfolio/sites/crystal-rent-car/index.html'), true);
  assert.equal(discoveredLinks.has('/portfolio/sites/nessrinou-shoes/index.html'), true);
  assert.equal(discoveredLinks.has('/portfolio/sites/see-you-store/index.html'), true);
});
