const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { requireAuth, requireCsrf, issueSession, clearSession } = require('../middleware/auth');
const { upload, resumeUpload, uploadDirectory } = require('../middleware/upload');
const { projectFolderUpload, MAX_TOTAL_SIZE } = require('../middleware/projectUpload');
const store = require('../utils/store');
const { sanitizeMarkup, scopeCss, sanitizeComponentCss, plainText, safeUrl } = require('../utils/sanitizer');

const router = express.Router();
const asyncHandler = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'Too many login attempts. Try again later.' } });
const messageLimiter = rateLimit({ windowMs: 10 * 60 * 1000, limit: 5, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'Too many messages. Try again later.' } });
const resumeLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'Too many file uploads. Try again later.' } });
const projectUploadLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'Too many project uploads. Try again later.' } });
const acceptedAdminEmails = new Set(['contact@zayerdigital.tn', 'admin@zayerdigital.tn']);
const validPages = new Set(['home', 'services', 'about', 'careers', 'contact', 'formation', 'international', 'portfolio', 'devis']);

const editable = {
  items: ['page', 'section', 'sort_order', 'visible', 'title_en', 'title_fr', 'sub_en', 'sub_fr', 'text_en', 'text_fr', 'meta', 'image_url', 'link_url'],
  jobs: ['sort_order', 'visible', 'dept', 'dept_en', 'dept_fr', 'title_en', 'title_fr', 'location', 'location_en', 'location_fr', 'experience', 'experience_en', 'experience_fr', 'description_en', 'description_fr'],
  messages: ['status'],
  settings: ['skey', 'value_en', 'value_fr'],
  blocks: ['bkey', 'page', 'value_en', 'value_fr', 'href', 'src', 'alt', 'visible'],
  components: ['page', 'title', 'placement', 'sort_order', 'visible', 'html_en', 'html_fr', 'css'],
  portfolioItems: ['tab_type', 'title', 'title_en', 'title_fr', 'description_en', 'description_fr', 'media_url', 'link_url', 'category', 'category_en', 'category_fr', 'sort_order', 'visible'],
  contactBoxes: ['label', 'label_en', 'label_fr', 'value', 'value_en', 'value_fr', 'icon', 'visible', 'sort_order'],
  serviceItems: ['label', 'label_en', 'label_fr', 'description', 'description_en', 'description_fr', 'category_en', 'category_fr', 'price', 'visible', 'sort_order'],
  socialItems: ['label', 'label_en', 'label_fr', 'icon', 'url', 'visible', 'sort_order'],
};

const legacyResources = new Set(['public/content', 'public/message', 'login', 'logout', 'me', 'schema', 'upload', ...Object.keys(editable)]);
const isVisible = (row) => row.visible !== false && row.visible !== 0 && row.visible !== '0';
const boolValue = (value) => value === true || value === 1 || value === '1' || value === 'true';
const sortRows = (rows, fields) => rows.sort((left, right) => {
  for (const [key, direction] of fields) {
    const a = left[key] ?? '';
    const b = right[key] ?? '';
    if (a === b) continue;
    return (a > b ? 1 : -1) * direction;
  }
  return 0;
});

function cleanValues(resource, body) {
  const values = {};
  for (const key of editable[resource] || []) {
    if (!Object.prototype.hasOwnProperty.call(body, key)) continue;
    if (['sort_order', 'price'].includes(key) && !['number', 'string'].includes(typeof body[key])) {
      throw Object.assign(new Error(`invalid_${key}`), { status: 422 });
    }
    if (!['sort_order', 'price', 'visible'].includes(key) && body[key] !== null && typeof body[key] !== 'string') {
      throw Object.assign(new Error(`invalid_${key}`), { status: 422 });
    }
    values[key] = body[key];
  }
  if (Object.prototype.hasOwnProperty.call(values, 'visible')) {
    if (![true, false, 1, 0, '1', '0', 'true', 'false'].includes(values.visible)) {
      throw Object.assign(new Error('invalid_visible'), { status: 422 });
    }
    values.visible = boolValue(values.visible);
  }
  if (Object.prototype.hasOwnProperty.call(values, 'sort_order')) {
    const sortOrder = Number(values.sort_order);
    if (!Number.isInteger(sortOrder) || Math.abs(sortOrder) > 100000) throw Object.assign(new Error('invalid_sort_order'), { status: 422 });
    values.sort_order = sortOrder;
  }
  if (resource === 'components') {
    if ('html_en' in values) values.html_en = sanitizeMarkup(values.html_en);
    if ('html_fr' in values) values.html_fr = sanitizeMarkup(values.html_fr);
    if ('css' in values) values.css = sanitizeComponentCss(values.css);
    if ('title' in values) values.title = plainText(values.title, 160);
    if ('sort_order' in values) values.sort_order = Number(values.sort_order) || 0;
    if (values.page && !validPages.has(values.page)) throw Object.assign(new Error('invalid_page'), { status: 422 });
    if (values.placement && !['top', 'bottom'].includes(values.placement)) throw Object.assign(new Error('invalid_placement'), { status: 422 });
  }
  if (resource === 'blocks') {
    if ('value_en' in values) values.value_en = sanitizeMarkup(values.value_en);
    if ('value_fr' in values) values.value_fr = sanitizeMarkup(values.value_fr);
    if ('href' in values) values.href = safeUrl(values.href, 500);
    if ('src' in values) values.src = safeUrl(values.src, 500);
    if ('alt' in values) values.alt = plainText(values.alt, 255);
  }
  if (resource === 'items') {
    for (const field of ['page', 'section', 'title_en', 'title_fr', 'sub_en', 'sub_fr', 'text_en', 'text_fr', 'meta']) {
      if (field in values) values[field] = plainText(values[field], field.startsWith('text') ? 5000 : 255);
    }
    if ('image_url' in values) values.image_url = safeUrl(values.image_url);
    if ('link_url' in values) values.link_url = safeUrl(values.link_url);
  }
  if (resource === 'portfolioItems') {
    for (const field of ['tab_type', 'title', 'title_en', 'title_fr', 'category', 'category_en', 'category_fr']) {
      if (field in values) values[field] = plainText(values[field], field === 'tab_type' ? 30 : 255);
    }
    for (const field of ['description_en', 'description_fr']) if (field in values) values[field] = plainText(values[field], 2000);
    if ('media_url' in values) values.media_url = safeUrl(values.media_url);
    if ('link_url' in values) values.link_url = safeUrl(values.link_url);
    if ('tab_type' in values && !['creative', 'web', 'impact'].includes(values.tab_type)) throw Object.assign(new Error('invalid_tab'), { status: 422 });
    if ('title' in values && !values.title) throw Object.assign(new Error('invalid_title'), { status: 422 });
  }
  if (resource === 'serviceItems') {
    for (const field of ['label', 'label_en', 'label_fr', 'category_en', 'category_fr']) if (field in values) values[field] = plainText(values[field], 255);
    for (const field of ['description', 'description_en', 'description_fr']) if (field in values) values[field] = plainText(values[field], 1000);
    if ('price' in values && (!Number.isFinite(Number(values.price)) || Number(values.price) < 0)) throw Object.assign(new Error('invalid_price'), { status: 422 });
  }
  if (resource === 'contactBoxes') {
    for (const field of ['label', 'label_en', 'label_fr']) if (field in values) values[field] = plainText(values[field], 100);
    for (const field of ['value', 'value_en', 'value_fr']) if (field in values) values[field] = plainText(values[field], 255);
    if ('icon' in values) values.icon = plainText(values.icon, 30).toLowerCase();
  }
  if (resource === 'socialItems') {
    for (const field of ['label', 'label_en', 'label_fr']) if (field in values) values[field] = plainText(values[field], 100);
    if ('icon' in values) values.icon = plainText(values.icon, 30).toLowerCase();
    if ('url' in values) values.url = safeUrl(values.url, 500);
  }
  if (resource === 'jobs') {
    for (const field of ['dept', 'dept_en', 'dept_fr', 'title_en', 'title_fr', 'location', 'location_en', 'location_fr', 'experience', 'experience_en', 'experience_fr', 'description_en', 'description_fr']) {
      if (field in values) values[field] = plainText(values[field], field.startsWith('description') ? 5000 : 255);
    }
  }
  if (resource === 'settings') {
    if ('skey' in values) values.skey = plainText(values.skey, 120);
    if ('value_en' in values) values.value_en = plainText(values.value_en, 5000);
    if ('value_fr' in values) values.value_fr = plainText(values.value_fr, 5000);
  }
  return values;
}

function validateResource(resource, values, current = {}) {
  const merged = { ...current, ...values };
  const requiredByResource = {
    items: ['page', 'section'],
    jobs: ['title_en', 'title_fr'],
    portfolioItems: ['title', 'tab_type'],
    contactBoxes: ['label', 'value'],
    serviceItems: ['label'],
    socialItems: ['label'],
    components: ['page'],
    settings: ['skey'],
    blocks: ['bkey', 'page'],
  };
  for (const key of requiredByResource[resource] || []) {
    if (typeof merged[key] !== 'string' || !merged[key].trim()) {
      throw Object.assign(new Error(`required_${key}`), { status: 422 });
    }
    if (['items', 'blocks'].includes(resource) && !validPages.has(merged.page)) {
      throw Object.assign(new Error('invalid_page'), { status: 422 });
    }
  }
  if (resource === 'portfolioItems' && !['creative', 'web', 'impact'].includes(merged.tab_type)) {
    throw Object.assign(new Error('invalid_tab'), { status: 422 });
  }
  if (resource === 'portfolioItems' && merged.tab_type === 'web' && !String(merged.link_url || '').trim()) {
    throw Object.assign(new Error('required_link_url'), { status: 422 });
  }
  if (resource === 'components' && !merged.html_en && !merged.html_fr) {
    throw Object.assign(new Error('empty_component'), { status: 422 });
  }
  if (resource === 'settings' && merged.skey.startsWith('_')) {
    throw Object.assign(new Error('reserved_setting'), { status: 422 });
  }
}

async function findLegacyList(resource, query) {
  const filter = {};
  const allowedFilters = resource === 'items' ? ['page', 'section'] : resource === 'messages' ? ['kind', 'status'] : resource === 'components' ? ['page'] : [];
  for (const key of allowedFilters) if (query[key]) filter[key] = String(query[key]).slice(0, 120);
  const rows = await store.list(resource, filter, { limit: 500 });
  const order = {
    items: [['page', 1], ['section', 1], ['sort_order', 1], ['id', 1]],
    jobs: [['sort_order', 1], ['id', 1]],
    messages: [['createdAt', -1], ['id', -1]],
    settings: [['skey', 1]],
    blocks: [['page', 1], ['bkey', 1]],
    components: [['page', 1], ['sort_order', 1], ['id', 1]],
    portfolioItems: [['tab_type', 1], ['sort_order', 1], ['id', -1]],
    contactBoxes: [['sort_order', 1], ['id', 1]],
    serviceItems: [['sort_order', 1], ['id', 1]],
    socialItems: [['sort_order', 1], ['id', 1]],
  }[resource] || [['createdAt', -1]];
  sortRows(rows, order);
  if (resource === 'messages') return rows.map((row) => ({ ...row, created_at: row.created_at || row.createdAt || '' }));
  return rows;
}

const searchableFields = {
  items: ['page', 'section', 'title_en', 'title_fr', 'text_en', 'text_fr'],
  jobs: ['title_en', 'title_fr', 'dept', 'location_en', 'location_fr'],
  messages: ['name', 'email', 'phone', 'subject', 'body'],
  settings: ['skey', 'value_en', 'value_fr'],
  blocks: ['bkey', 'page', 'value_en', 'value_fr'],
  components: ['title', 'page', 'html_en', 'html_fr'],
  portfolioItems: ['title', 'title_en', 'title_fr', 'category_en', 'category_fr'],
  contactBoxes: ['label_en', 'label_fr', 'value_en', 'value_fr'],
  serviceItems: ['label_en', 'label_fr', 'category_en', 'category_fr'],
  socialItems: ['label_en', 'label_fr', 'url'],
};
const sortableFields = new Set(['createdAt', 'sort_order', 'page', 'section', 'title', 'title_en', 'title_fr', 'name', 'email', 'status', 'skey', 'bkey', 'category', 'price']);

async function paginatedResource(resource, query) {
  const filter = {};
  const allowedFilters = resource === 'items' ? ['page', 'section'] : resource === 'messages' ? ['kind', 'status'] : resource === 'components' ? ['page'] : [];
  for (const key of allowedFilters) {
    const filterKey = resource === 'items' && key === 'page' ? 'filterPage' : key;
    if (query[filterKey] !== undefined && String(query[filterKey]).length <= 120) filter[key] = String(query[filterKey]);
  }
  if (query.visible === 'true' || query.visible === 'false') filter.visible = query.visible === 'true';
  const requestedSort = String(query.sort || 'createdAt');
  const sortField = sortableFields.has(requestedSort) ? requestedSort : 'createdAt';
  const direction = query.direction === 'asc' ? 1 : -1;
  const result = await store.list(resource, filter, {
    page: query.page || 1,
    limit: Math.min(Number.parseInt(query.limit, 10) || 25, 100),
    q: query.q || '',
    searchFields: searchableFields[resource] || [],
    sort: { [sortField]: direction },
  });
  if (resource === 'messages') result.rows = result.rows.map((row) => ({ ...row, created_at: row.created_at || row.createdAt || '' }));
  return result;
}

function safeAdmin(admin) {
  if (!admin) return null;
  const { passwordHash, ...publicFields } = admin;
  return { ...publicFields, active: publicFields.active !== false };
}

async function recordAudit(req, action, resource, recordId = '') {
  try {
    await store.create('auditLogs', {
      who: plainText(req.admin?.email || 'unknown', 190),
      action: plainText(action, 40),
      resource: plainText(resource, 80),
      recordId: plainText(String(recordId || ''), 120),
      date: new Date(),
    });
  } catch (error) {
    console.error(`[audit] Failed to record ${action} on ${resource}`);
    throw error;
  }
}

function validateAdminInput(body, { creating = false, passwordRequired = false } = {}) {
  const name = plainText(body?.name, 120).trim();
  const email = plainText(body?.email, 190).trim().toLowerCase();
  const password = typeof body?.password === 'string' ? body.password : '';
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw Object.assign(new Error('invalid_admin'), { status: 422 });
  }
  if ((creating || passwordRequired) && password.length < 12) {
    throw Object.assign(new Error('password_too_short'), { status: 422 });
  }
  if (password && password.length < 12) throw Object.assign(new Error('password_too_short'), { status: 422 });
  const activeInput = body?.active;
  if (activeInput !== undefined && ![true, false, 1, 0, '1', '0', 'true', 'false'].includes(activeInput)) {
    throw Object.assign(new Error('invalid_active'), { status: 422 });
  }
  return { name, email, password, active: activeInput === undefined ? true : boolValue(activeInput) };
}

async function ensureActiveAdminRemains(adminId, willBeActive) {
  if (willBeActive) return;
  const activeAdmins = (await store.list('admins', {}, { limit: 1000 })).filter((admin) => admin.active !== false);
  if (activeAdmins.length <= 1 && activeAdmins.some((admin) => String(admin.id) === String(adminId))) {
    throw Object.assign(new Error('last_active_admin'), { status: 409 });
  }
}

async function saveKeyed(resource, keyField, key, values) {
  const found = await store.findOne(resource, { [keyField]: key });
  if (found) return store.update(resource, found.id, values);
  return store.create(resource, { [keyField]: key, ...values });
}

function rewriteLegacyRequest(req, res, next) {
  const resource = String(req.query.r || '');
  if (!legacyResources.has(resource)) return res.status(404).json({ error: 'not_found' });
  const parameters = new URLSearchParams();
  for (const [key, value] of Object.entries(req.query)) {
    if (key === 'r') continue;
    if (Array.isArray(value)) value.forEach((entry) => parameters.append(key, String(entry)));
    else if (value !== undefined) parameters.set(key, String(value));
  }
  req.url = `/${resource}${parameters.size ? `?${parameters}` : ''}`;
  next();
}

router.use((req, res, next) => {
  if (!['/', '/index.php'].includes(req.path) || !req.query.r) return next();
  return rewriteLegacyRequest(req, res, next);
});

router.get('/public/content', asyncHandler(async (_req, res) => {
  const [items, jobs, settings, blocks, components] = await Promise.all([
    findLegacyList('items', {}), findLegacyList('jobs', {}), findLegacyList('settings', {}),
    findLegacyList('blocks', {}), findLegacyList('components', {}),
  ]);
  const visibleComponents = components.filter(isVisible).map((component) => ({
    ...component,
    css: scopeCss(component.css || '', `.zcms-component[data-component-id="${String(component.id).replace(/[^a-z0-9_-]/gi, '')}"]`),
  }));
  res.set('Cache-Control', 'public, max-age=60');
  res.json({ items: items.filter(isVisible), jobs: jobs.filter(isVisible), settings, blocks, components: visibleComponents });
}));

router.post('/public/message', messageLimiter, asyncHandler(async (req, res) => {
  const { name, email, phone, subject, body, kind = 'contact', website, file_url } = req.body || {};
  if (website) return res.json({ ok: true });
  if (!['contact', 'application'].includes(kind)) return res.status(400).json({ error: 'invalid' });
  const cleanEmail = plainText(email, 190).toLowerCase();
  const cleanName = plainText(name, 160);
  const cleanBody = plainText(body, 5000);
  if (!cleanName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || !cleanBody) return res.status(422).json({ error: 'invalid' });
  await store.create('messages', {
    kind, name: cleanName, email: cleanEmail, phone: plainText(phone, 60),
    subject: plainText(subject, 255), body: cleanBody, file_url: safeUrl(file_url, 500), status: 'new',
  });
  return res.json({ ok: true });
}));

router.post('/public/upload', resumeLimiter, resumeUpload.single('file'), (req, res) => {
  if (!req.file) return res.status(422).json({ error: 'upload' });
  return res.json({ ok: true, url: `/uploads/${req.file.filename}`, name: req.file.originalname, size: req.file.size, type: req.file.mimetype });
});

router.post('/login', loginLimiter, asyncHandler(async (req, res) => {
  const email = plainText(req.body?.email, 190).trim().toLowerCase();
  const password = String(req.body?.password || '').slice(0, 256);
  if (!email || !password) return res.status(400).json({ error: 'invalid' });
  const candidateEmails = [email];
  if (acceptedAdminEmails.has(email)) {
    for (const acceptedEmail of acceptedAdminEmails) {
      if (acceptedEmail !== email) candidateEmails.push(acceptedEmail);
    }
  }
  let admin = null;
  for (const candidateEmail of candidateEmails) {
    const candidate = await store.findOne('admins', { email: candidateEmail }, { includePassword: true });
    if (candidate?.active !== false && candidate?.passwordHash && await bcrypt.compare(password, candidate.passwordHash)) {
      admin = candidate;
      break;
    }
  }
  if (!admin) return res.status(401).json({ error: 'bad_login' });
  const csrf = issueSession(req, res, admin);
  return res.json({ ok: true, name: admin.name || 'Admin ZAYER', csrf });
}));

router.post('/logout', requireAuth, requireCsrf, (req, res) => {
  clearSession(req, res);
  res.json({ ok: true });
});

router.get('/me', (req, res, next) => {
  if (!req.cookies?.zsid) return res.json({ ok: false, admin: null });
  return requireAuth(req, res, next);
}, (req, res) => res.json({ ok: true, csrf: req.sessionCsrf, admin: req.admin }));
router.post('/me/password', requireAuth, requireCsrf, asyncHandler(async (req, res) => {
  const currentPassword = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : '';
  const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';
  if (newPassword.length < 12) return res.status(422).json({ error: 'password_too_short' });
  const admin = await store.findById('admins', req.admin.id, { includePassword: true });
  if (!admin?.passwordHash || !(await bcrypt.compare(currentPassword, admin.passwordHash))) {
    return res.status(403).json({ error: 'current_password_invalid' });
  }
  await store.update('admins', admin.id, { passwordHash: await bcrypt.hash(newPassword, 12) });
  await recordAudit(req, 'change-password', 'admins', admin.id);
  return res.json({ ok: true });
}));
router.get('/schema', requireAuth, (_req, res) => res.json([]));

router.get('/upload/csrf', requireAuth, (req, res) => res.json({ csrf: req.sessionCsrf }));
router.post('/upload', requireAuth, requireCsrf, (req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !store.getDbStatus()) return res.status(503).json({ error: 'Database is unavailable; writes are temporarily disabled' });
  return next();
}, upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(422).json({ error: 'upload' });
  await recordAudit(req, 'upload', 'media', req.file.filename);
  return res.json({ ok: true, url: `/uploads/${req.file.filename}`, name: req.file.originalname, size: req.file.size, type: req.file.mimetype });
}));

function projectSlug(value) {
  return String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

function projectTargets() {
  const projectRoot = path.resolve(__dirname, '../../..');
  const uploadsTarget = path.resolve(uploadDirectory, 'portfolio-sites');
  const configuredTarget = process.env.PORTFOLIO_SITES_DIR ? path.resolve(process.env.PORTFOLIO_SITES_DIR) : '';
  const documentRoot = path.resolve('/var/www/zayer-mern');
  const documentSites = path.join(documentRoot, 'portfolio', 'sites');
  const candidates = [
    process.env.PORTFOLIO_SITES_DIR,
    documentSites,
    path.join(projectRoot, 'frontend', 'public', 'portfolio', 'sites'),
    path.join(uploadDirectory, 'portfolio-sites'),
  ].filter(Boolean);
  const resolved = [...new Set(candidates.map((candidate) => path.resolve(candidate)))];
  return resolved.filter((directory) => {
    if (directory === uploadsTarget || directory === configuredTarget) return true;
    if (directory === documentSites && fs.existsSync(documentRoot)) return true;
    try { return fs.statSync(directory).isDirectory(); }
    catch (error) {
      if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return false;
      throw error;
    }
  });
}

function parseProjectUpload(req) {
  if (!Array.isArray(req.files) || !req.files.length) throw Object.assign(new Error('project_files_required'), { status: 422 });
  let relativePaths;
  try { relativePaths = JSON.parse(req.body?.paths || ''); }
  catch { throw Object.assign(new Error('invalid_project_paths'), { status: 422 }); }
  if (!Array.isArray(relativePaths) || relativePaths.length !== req.files.length || relativePaths.some((entry) => typeof entry !== 'string')) {
    throw Object.assign(new Error('invalid_project_paths'), { status: 422 });
  }
  const fileEntries = relativePaths.map((entry, index) => {
    const normalized = entry.replace(/\\/g, '/');
    const segments = normalized.split('/');
    if (normalized.length > 2000 || normalized.startsWith('/') || segments.length < 2 || segments.some((segment) => (
      !segment || segment.length > 255 || segment === '.' || segment === '..' || !/^[\p{L}\p{N}._ -]+$/u.test(segment)
    ))) {
      throw Object.assign(new Error('invalid_project_path'), { status: 422 });
    }
    const upload = req.files[index];
    if (segments[segments.length - 1] !== upload.originalname || path.extname(upload.originalname).toLowerCase() !== path.extname(normalized).toLowerCase()) {
      throw Object.assign(new Error('project_path_mismatch'), { status: 422 });
    }
    return { topFolder: segments[0], segments: segments.slice(1), upload };
  });
  const topFolder = fileEntries[0].topFolder;
  const slug = projectSlug(req.body?.slug);
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || projectSlug(topFolder) !== slug) {
    throw Object.assign(new Error('invalid_project_slug'), { status: 422 });
  }
  if (fileEntries.some((entry) => entry.topFolder !== topFolder)) {
    throw Object.assign(new Error('mixed_project_folders'), { status: 422 });
  }
  if (new Set(fileEntries.map((entry) => entry.segments.join('/').toLowerCase())).size !== fileEntries.length) {
    throw Object.assign(new Error('duplicate_project_path'), { status: 422 });
  }
  const totalSize = fileEntries.reduce((total, entry) => total + entry.upload.size, 0);
  if (totalSize > MAX_TOTAL_SIZE) throw Object.assign(new Error('project_upload_too_large'), { status: 413 });
  const htmlEntry = fileEntries.find((entry) => entry.segments.join('/').toLowerCase() === 'index.html')
    || fileEntries.find((entry) => /\.html?$/i.test(entry.segments[entry.segments.length - 1]));
  if (!htmlEntry) throw Object.assign(new Error('project_entry_html_required'), { status: 422 });
  return { slug, fileEntries, entryPath: htmlEntry.segments };
}

async function saveProjectFolder(req, res) {
  const { slug, fileEntries, entryPath } = parseProjectUpload(req);
  const targets = projectTargets();
  if (!targets.length) throw Object.assign(new Error('project_target_unavailable'), { status: 500 });
  for (const target of targets) {
    if (fs.existsSync(path.join(target, slug))) throw Object.assign(new Error('project_slug_exists'), { status: 409 });
  }
  const token = crypto.randomUUID();
  const staging = targets.map((target) => ({ target, stage: path.join(target, `.${slug}.upload-${token}`), final: path.join(target, slug) }));
  const published = [];
  try {
    for (const { target, stage } of staging) {
      await fs.promises.mkdir(target, { recursive: true });
      await fs.promises.mkdir(stage);
      for (const { segments, upload } of fileEntries) {
        const destination = path.resolve(stage, ...segments);
        if (!destination.startsWith(`${stage}${path.sep}`)) throw Object.assign(new Error('invalid_project_path'), { status: 422 });
        await fs.promises.mkdir(path.dirname(destination), { recursive: true });
        await fs.promises.copyFile(upload.path, destination, fs.constants.COPYFILE_EXCL);
        await fs.promises.chmod(destination, 0o644);
      }
    }
    for (const entry of staging) {
      await fs.promises.rename(entry.stage, entry.final);
      published.push(entry.final);
    }
  } catch (error) {
    await Promise.all(staging.map(({ stage }) => fs.promises.rm(stage, { recursive: true, force: true })));
    await Promise.all(published.map((directory) => fs.promises.rm(directory, { recursive: true, force: true })));
    throw error;
  }
  const link_url = `/portfolio/sites/${slug}/${entryPath.map((part) => encodeURIComponent(part)).join('/')}`;
  await recordAudit(req, 'upload-folder', 'portfolioSites', slug);
  return res.json({ ok: true, slug, link_url, fileCount: fileEntries.length });
}

router.post('/portfolio/upload-folder', projectUploadLimiter, requireAuth, requireCsrf, (req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !store.getDbStatus()) return res.status(503).json({ error: 'Database is unavailable; writes are temporarily disabled' });
  return projectFolderUpload(req, res, (error) => {
    if (!error) return next();
    if (error.code === 'LIMIT_FILE_SIZE' || error.code === 'LIMIT_FILE_COUNT') error.status = 413;
    return next(error);
  });
}, asyncHandler(async (req, res) => {
  try { return await saveProjectFolder(req, res); }
  finally {
    await Promise.all((req.files || []).map((file) => fs.promises.unlink(file.path).catch((error) => {
      if (error.code !== 'ENOENT') throw error;
    })));
  }
}));

router.get('/media', requireAuth, asyncHandler(async (req, res) => {
  const files = await fs.promises.readdir(uploadDirectory, { withFileTypes: true });
  let media = await Promise.all(files.filter((file) => file.isFile() && !file.name.startsWith('.')).map(async (file) => {
    const stats = await fs.promises.stat(path.join(uploadDirectory, file.name));
    return { name: file.name, url: `/uploads/${encodeURIComponent(file.name)}`, size: stats.size, modifiedAt: stats.mtime.toISOString() };
  }));
  media.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
  const search = String(req.query.q || '').trim().toLowerCase();
  if (search) media = media.filter((file) => file.name.toLowerCase().includes(search));
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 25, 1), 100);
  const total = media.length;
  return res.json({ rows: media.slice((page - 1) * limit, page * limit), total, page, limit, pages: Math.ceil(total / limit) });
}));

router.delete('/media/:filename', requireAuth, requireCsrf, asyncHandler(async (req, res) => {
  const filename = path.basename(req.params.filename);
  if (!filename || filename !== req.params.filename || filename.startsWith('.')) return res.status(400).json({ error: 'invalid_filename' });
  if (process.env.NODE_ENV === 'production' && !store.getDbStatus()) return res.status(503).json({ error: 'Database is unavailable; writes are temporarily disabled' });
  const url = `/uploads/${filename}`;
  const resources = ['items', 'blocks', 'components', 'portfolioItems', 'messages', 'jobs', 'settings', 'contactBoxes', 'serviceItems', 'socialItems'];
  for (const resource of resources) {
    const firstPage = await store.list(resource, {}, { page: 1, limit: 100 });
    for (let page = 1; page <= firstPage.pages; page += 1) {
      const result = page === 1 ? firstPage : await store.list(resource, {}, { page, limit: 100 });
      const reference = result.rows.find((row) => Object.values(row).some((value) => typeof value === 'string' && value.includes(url)));
      if (reference) return res.status(409).json({ error: 'media_in_use', resource });
    }
  }
  try {
    await fs.promises.unlink(path.join(uploadDirectory, filename));
  } catch (error) {
    if (error.code === 'ENOENT') return res.status(404).json({ error: 'not_found' });
    throw error;
  }
  await recordAudit(req, 'delete', 'media', filename);
  return res.status(204).end();
}));

router.get('/activity', requireAuth, asyncHandler(async (req, res) => {
  const result = await store.list('auditLogs', {}, {
    page: req.query.page || 1,
    limit: Math.min(Number.parseInt(req.query.limit, 10) || 25, 100),
    q: req.query.q || '',
    searchFields: ['who', 'action', 'resource', 'recordId'],
    sort: { date: -1 },
  });
  return res.json(result);
}));

router.get('/applications', requireAuth, asyncHandler(async (req, res) => {
  const filter = { kind: 'application' };
  if (['new', 'reviewed', 'accepted', 'rejected'].includes(req.query.status)) filter.status = req.query.status;
  const result = await store.list('messages', filter, {
    page: req.query.page || 1,
    limit: Math.min(Number.parseInt(req.query.limit, 10) || 25, 100),
    q: req.query.q || '',
    searchFields: searchableFields.messages,
    sort: { [sortableFields.has(String(req.query.sort)) ? req.query.sort : 'createdAt']: req.query.direction === 'asc' ? 1 : -1 },
  });
  result.rows = result.rows.map((row) => ({ ...row, created_at: row.createdAt || '' }));
  return res.json(result);
}));

router.patch('/applications/:id', requireAuth, requireCsrf, asyncHandler(async (req, res) => {
  const status = req.body?.status;
  if (!['new', 'reviewed', 'accepted', 'rejected'].includes(status)) return res.status(422).json({ error: 'invalid_status' });
  const application = await store.findById('messages', req.params.id);
  if (!application || application.kind !== 'application') return res.status(404).json({ error: 'not_found' });
  const updated = await store.update('messages', application.id, { status });
  await recordAudit(req, 'update', 'applications', application.id);
  return res.json(updated);
}));

router.delete('/applications/:id', requireAuth, requireCsrf, asyncHandler(async (req, res) => {
  const application = await store.findById('messages', req.params.id);
  if (!application || application.kind !== 'application') return res.status(404).json({ error: 'not_found' });
  await store.remove('messages', application.id);
  await recordAudit(req, 'delete', 'applications', application.id);
  return res.status(204).end();
}));

router.post('/applications/bulk', requireAuth, requireCsrf, asyncHandler(async (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? [...new Set(req.body.ids.map((id) => String(id).slice(0, 120)))].slice(0, 100) : [];
  if (!ids.length || req.body?.action !== 'delete') return res.status(422).json({ error: 'invalid_bulk_action' });
  let affected = 0;
  for (const id of ids) {
    const application = await store.findById('messages', id);
    if (application?.kind === 'application' && await store.remove('messages', id)) affected += 1;
  }
  await recordAudit(req, 'bulk-delete', 'applications', ids.join(','));
  return res.json({ ok: true, affected });
}));

router.get('/admins', requireAuth, asyncHandler(async (req, res) => {
  const result = await store.list('admins', {}, {
    page: req.query.page || 1,
    limit: Math.min(Number.parseInt(req.query.limit, 10) || 25, 100),
    q: req.query.q || '',
    searchFields: ['name', 'email'],
    sort: { [req.query.sort === 'email' ? 'email' : 'name']: req.query.direction === 'desc' ? -1 : 1 },
  });
  result.rows = result.rows.map(safeAdmin);
  return res.json(result);
}));

router.post('/admins', requireAuth, requireCsrf, asyncHandler(async (req, res) => {
  const input = validateAdminInput(req.body, { creating: true });
  const existing = await store.findOne('admins', { email: input.email });
  if (existing) return res.status(409).json({ error: 'email_exists' });
  const admin = await store.create('admins', {
    name: input.name,
    email: input.email,
    passwordHash: await bcrypt.hash(input.password, 12),
    active: input.active,
  });
  await recordAudit(req, 'create', 'admins', admin.id);
  return res.status(201).json(safeAdmin(admin));
}));

router.patch('/admins/:id', requireAuth, requireCsrf, asyncHandler(async (req, res) => {
  const current = await store.findById('admins', req.params.id, { includePassword: true });
  if (!current) return res.status(404).json({ error: 'not_found' });
  const input = validateAdminInput({ ...current, ...req.body });
  const duplicate = await store.findOne('admins', { email: input.email });
  if (duplicate && String(duplicate.id) !== String(current.id)) return res.status(409).json({ error: 'email_exists' });
  const active = req.body?.active === undefined ? current.active !== false : input.active;
  await ensureActiveAdminRemains(current.id, active);
  const changes = { name: input.name, email: input.email, active };
  if (input.password) changes.passwordHash = await bcrypt.hash(input.password, 12);
  const admin = await store.update('admins', current.id, changes);
  await recordAudit(req, 'update', 'admins', current.id);
  return res.json(safeAdmin(admin));
}));

router.delete('/admins/:id', requireAuth, requireCsrf, asyncHandler(async (req, res) => {
  const admin = await store.findById('admins', req.params.id);
  if (!admin) return res.status(404).json({ error: 'not_found' });
  if (String(admin.id) === String(req.admin.id)) return res.status(409).json({ error: 'cannot_delete_self' });
  await ensureActiveAdminRemains(admin.id, false);
  await store.remove('admins', admin.id);
  await recordAudit(req, 'delete', 'admins', admin.id);
  return res.status(204).end();
}));

router.get('/settings', requireAuth, asyncHandler(async (req, res) => {
  if (req.query.page !== undefined || req.query.limit !== undefined || req.query.q !== undefined) return res.json(await paginatedResource('settings', req.query));
  return res.json(await findLegacyList('settings', {}));
}));
router.post('/settings', requireAuth, requireCsrf, asyncHandler(async (req, res) => {
  const key = plainText(req.body?.skey, 120).replace(/[^a-z0-9_.-]/gi, '');
  if (!key) return res.status(422).json({ error: 'invalid' });
  if (key.startsWith('_')) return res.status(422).json({ error: 'reserved_setting' });
  if (req.query.a === 'delete') {
    const found = await store.findOne('settings', { skey: key });
    if (found) await store.remove('settings', found.id);
    if (found) await recordAudit(req, 'delete', 'settings', found.id);
    return res.json({ ok: true });
  }
  const values = cleanValues('settings', { ...req.body, skey: key });
  validateResource('settings', values);
  const row = await saveKeyed('settings', 'skey', key, values);
  await recordAudit(req, 'upsert', 'settings', row.id);
  return res.json({ ok: true });
}));

router.get('/blocks', requireAuth, asyncHandler(async (req, res) => {
  if (req.query.page !== undefined || req.query.limit !== undefined || req.query.q !== undefined) return res.json(await paginatedResource('blocks', req.query));
  return res.json(await findLegacyList('blocks', {}));
}));
router.post('/blocks', requireAuth, requireCsrf, asyncHandler(async (req, res) => {
  const bkey = String(req.body?.bkey || '').trim();
  if (!/^[a-z0-9_.-]{1,120}$/i.test(bkey)) return res.status(422).json({ error: 'invalid' });
  if (req.query.a === 'delete') {
    const found = await store.findOne('blocks', { bkey });
    if (found) await store.remove('blocks', found.id);
    if (found) await recordAudit(req, 'delete', 'blocks', found.id);
    return res.json({ ok: true });
  }
  const values = cleanValues('blocks', req.body || {});
  values.page = values.page || bkey.split('.')[0] || 'home';
  values.bkey = bkey;
  validateResource('blocks', values);
  const row = await saveKeyed('blocks', 'bkey', bkey, values);
  await recordAudit(req, 'upsert', 'blocks', row.id);
  return res.json({ ok: true });
}));

router.post('/:resource/bulk', requireAuth, requireCsrf, asyncHandler(async (req, res) => {
  const { resource } = req.params;
  const ids = Array.isArray(req.body?.ids) ? [...new Set(req.body.ids.map((id) => String(id).slice(0, 120)))].slice(0, 100) : [];
  const action = req.body?.action;
  if (!editable[resource] || resource === 'admins') return res.status(404).json({ error: 'not_found' });
  if (!ids.length || !['delete', 'show', 'hide'].includes(action)) return res.status(422).json({ error: 'invalid_bulk_action' });
  if (action !== 'delete' && !editable[resource].includes('visible')) return res.status(422).json({ error: 'visibility_not_supported' });
  let affected = 0;
  for (const id of ids) {
    if (action === 'delete') {
      if (resource === 'portfolioItems') {
        const row = await store.findById(resource, id);
        if (row) await store.suppressPortfolioSeed(row);
      }
      if (await store.remove(resource, id)) affected += 1;
    } else if (editable[resource].includes('visible')) {
      if (await store.update(resource, id, { visible: action === 'show' })) affected += 1;
    } else {
      return res.status(422).json({ error: 'visibility_not_supported' });
    }
  }
  await recordAudit(req, `bulk-${action}`, resource, ids.join(','));
  return res.json({ ok: true, affected });
}));

router.get('/:resource', requireAuth, asyncHandler(async (req, res) => {
  const resource = req.params.resource;
  if (!editable[resource]) return res.status(404).json({ error: 'not_found' });
  if (req.query.page !== undefined || req.query.limit !== undefined || req.query.q !== undefined || req.query.sort !== undefined || req.query.visible !== undefined) {
    return res.json(await paginatedResource(resource, req.query));
  }
  return res.json(await findLegacyList(resource, req.query));
}));

router.post('/:resource', requireAuth, requireCsrf, asyncHandler(async (req, res) => {
  const { resource } = req.params;
  if (!editable[resource]) return res.status(404).json({ error: 'not_found' });
  const body = req.body || {};
  if (resource === 'messages') {
    const id = body.id || req.query.id;
    if (req.query.a === 'delete' && id) {
      if (resource === 'portfolioItems') {
        const row = await store.findById(resource, id);
        if (row) await store.suppressPortfolioSeed(row);
      }
      await store.remove(resource, id);
      await recordAudit(req, 'delete', resource, id);
      return res.json({ ok: true });
    }
    if (!id || !['new', 'read', 'done'].includes(body.status)) return res.status(405).json({ error: 'method' });
    const row = await store.update(resource, id, { status: body.status });
    if (row) await recordAudit(req, 'update', resource, id);
    return row ? res.json({ ok: true, id: row.id }) : res.status(404).json({ error: 'not_found' });
  }
  if (resource === 'settings' || resource === 'blocks') return res.status(404).json({ error: 'not_found' });
  const id = body.id || req.query.id;
  if (req.query.a === 'delete' && id) {
    await store.remove(resource, id);
    await recordAudit(req, 'delete', resource, id);
    return res.json({ ok: true });
  }
  const values = cleanValues(resource, body);
  validateResource(resource, values, id ? await store.findById(resource, id) || {} : {});
  if (!Object.keys(values).length) return res.status(422).json({ error: 'empty' });
  if (resource === 'items' && ((!values.page && !id) || (!values.section && !id))) return res.status(422).json({ error: 'invalid' });
  if (resource === 'jobs' && !id && (!values.title_en || !values.title_fr)) return res.status(422).json({ error: 'invalid' });
  if (resource === 'components' && !id) {
    if (!values.title) values.title = 'Composant';
    if (!values.html_en && !values.html_fr) return res.status(422).json({ error: 'empty_component' });
  }
  if (id) {
    const row = await store.update(resource, id, values);
    if (row) await recordAudit(req, 'update', resource, id);
    return row ? res.json({ ok: true, id: row.id }) : res.status(404).json({ error: 'not_found' });
  }
  if (resource === 'portfolioItems') values.seed_key = store.portfolioSeedKey(values);
  const row = await store.create(resource, values);
  await recordAudit(req, 'create', resource, row.id);
  return res.json({ ok: true, id: row.id });
}));

router.patch('/:resource/:id', requireAuth, requireCsrf, asyncHandler(async (req, res) => {
  const { resource, id } = req.params;
  if (!editable[resource] || ['messages', 'settings', 'blocks'].includes(resource)) return res.status(404).json({ error: 'not_found' });
  const current = await store.findById(resource, id) || {};
  const values = cleanValues(resource, req.body || {});
  if (resource === 'portfolioItems' && !current.seed_key) values.seed_key = store.portfolioSeedKey(current);
  validateResource(resource, values, current);
  if (!Object.keys(values).length) return res.status(422).json({ error: 'empty' });
  const row = await store.update(resource, id, values);
  if (row) await recordAudit(req, 'update', resource, id);
  return row ? res.json(row) : res.status(404).json({ error: 'not_found' });
}));

router.delete('/:resource/:id', requireAuth, requireCsrf, asyncHandler(async (req, res) => {
  const { resource, id } = req.params;
  if (!editable[resource]) return res.status(404).json({ error: 'not_found' });
  if (resource === 'portfolioItems') {
    const row = await store.findById(resource, id);
    if (row) await store.suppressPortfolioSeed(row);
  }
  const row = await store.remove(resource, id);
  if (row) await recordAudit(req, 'delete', resource, id);
  return row ? res.status(204).end() : res.status(404).json({ error: 'not_found' });
}));

module.exports = router;
