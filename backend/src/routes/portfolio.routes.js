const express = require('express');
const store = require('../utils/store');
const { safeUrl } = require('../utils/sanitizer');

const router = express.Router();
const asyncHandler = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
const visible = (row) => row.visible !== false && row.visible !== 0 && row.visible !== '0';
const socialIcons = new Set(['facebook', 'instagram', 'linkedin', 'tiktok', 'threads', 'x', 'youtube', 'globe']);

function socialIcon(row) {
  const key = String(row.icon || '').trim().toLowerCase();
  if (socialIcons.has(key)) return key;
  const label = String(row.label || '').trim().toLowerCase();
  if (socialIcons.has(label)) return label;
  return 'globe';
}

function contactIcon(row) {
  const key = String(row.icon || '').trim().toLowerCase();
  if (['mail', 'phone', 'web', 'pin'].includes(key)) return key;
  const value = String(row.value || '');
  if (value.includes('@')) return 'mail';
  if (/^[+\d\s().-]+$/.test(value) && value.replace(/\D/g, '').length >= 8) return 'phone';
  if (/^(https?:\/\/|www\.)/i.test(value) || /\.[a-z]{2,}$/i.test(value)) return 'web';
  return 'pin';
}

function serviceShape(row) {
  const price = Number(row.price) || 0;
  return { ...row, name: row.name || row.label || '', category: row.category || 'Services', description: row.description || '', unit: row.unit || '', price, currency: 'TND' };
}

router.get('/', asyncHandler(async (_req, res) => {
  const [items, services, contactBoxes, socialItems] = await Promise.all([
    store.list('portfolioItems', {}, { sort: { sort_order: 1 } }),
    store.list('serviceItems', {}, { sort: { sort_order: 1 } }),
    store.list('contactBoxes', {}, { sort: { sort_order: 1 } }),
    store.list('socialItems', {}, { sort: { sort_order: 1 } }),
  ]);
  res.json({
    items: items.filter(visible).map((row) => ({ ...row, media_url: safeUrl(row.media_url), link_url: safeUrl(row.link_url) })),
    services: services.filter(visible).map(serviceShape),
    contactBoxes: contactBoxes.filter(visible).map((row) => ({ ...row, icon: contactIcon(row) })),
    socialItems: socialItems.filter((row) => visible(row) && safeUrl(row.url)).map((row) => ({ ...row, url: safeUrl(row.url), icon: socialIcon(row) })),
  });
}));

router.get('/items', asyncHandler(async (req, res) => {
  const filter = req.query.category ? { tab_type: String(req.query.category).slice(0, 60) } : {};
  const rows = await store.list('portfolioItems', filter, { sort: { sort_order: 1 } });
  res.json(rows.filter(visible).map((row) => ({ ...row, media_url: safeUrl(row.media_url), link_url: safeUrl(row.link_url) })));
}));

router.get('/services', asyncHandler(async (_req, res) => {
  const rows = await store.list('serviceItems', {}, { sort: { sort_order: 1 } });
  res.json(rows.filter(visible).map(serviceShape));
}));

router.get('/public/services', asyncHandler(async (_req, res) => {
  const rows = await store.list('serviceItems', {}, { sort: { sort_order: 1 } });
  res.json(rows.filter(visible).map(serviceShape));
}));

router.get('/contact-boxes', asyncHandler(async (_req, res) => {
  const rows = await store.list('contactBoxes', {}, { sort: { sort_order: 1 } });
  res.json(rows.filter(visible).map((row) => ({ ...row, icon: contactIcon(row) })));
}));

router.get('/social-items', asyncHandler(async (_req, res) => {
  const rows = await store.list('socialItems', {}, { sort: { sort_order: 1 } });
  res.json(rows.filter((row) => visible(row) && safeUrl(row.url)).map((row) => ({ ...row, url: safeUrl(row.url), icon: socialIcon(row) })));
}));

module.exports = router;
