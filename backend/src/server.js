require('dotenv').config();

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Models = require('./models');
const { connectDB } = require('./config/db');
const store = require('./utils/store');
const cmsRoutes = require('./routes/cms.routes');
const zayaRoutes = require('./routes/zaya.routes');
const portfolioRoutes = require('./routes/portfolio.routes');
const { plainText } = require('./utils/sanitizer');

if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
  throw new Error('Production requires a JWT_SECRET of at least 32 characters');
}

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const normalizeOrigin = (value) => {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.origin : null;
  } catch {
    return null;
  }
};
const allowedOrigins = new Set(
  (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((origin) => normalizeOrigin(origin.trim()))
    .filter(Boolean),
);
const corsOptionsForRequest = (request) => {
  return {
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      const normalizedOrigin = normalizeOrigin(origin);
      const requestHost = (request.get('x-forwarded-host') || request.get('host') || '')
        .split(',')[0]
        .trim()
        .toLowerCase();
      // The public site terminates TLS at a reverse proxy; compare the public
      // host as well as the configured origin, without trusting forwarded scheme.
      const sameHost = normalizedOrigin && requestHost
        && new URL(normalizedOrigin).host.toLowerCase() === requestHost;
      if (normalizedOrigin && (allowedOrigins.has(normalizedOrigin) || sameHost)) return callback(null, true);
      return callback(new Error('Origin is not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-CSRF', 'X-CSRF-Token'],
    maxAge: 600,
  };
};
app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));
app.use((request, response, next) => cors(corsOptionsForRequest(request))(request, response, next));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));
app.use(cookieParser());

app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  fallthrough: false,
  dotfiles: 'deny',
  index: false,
  maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0,
  setHeaders(res) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Disposition', 'inline');
  },
}));

app.get('/api/health', (_req, res) => res.json({
  status: 'ok',
  service: 'ZAYER Digital API',
  dbMode: store.getDbStatus() ? 'mongodb' : 'local-json',
  timestamp: new Date().toISOString(),
}));

app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 180, standardHeaders: 'draft-8', legacyHeaders: false }));
app.use(['/api/zaya-assistant', '/api/zaya-assistant.php'], zayaRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api', cmsRoutes);

app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((error, _req, res, _next) => {
  if (res.headersSent) return;
  if (Number.isInteger(error.status) && error.status >= 400 && error.status < 500) return res.status(error.status).json({ error: error.message });
  if (error.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'File size must not exceed 8 MB' });
  if (error.name === 'MulterError') return res.status(400).json({ error: 'File upload could not be completed' });
  if (error.code === 11000) return res.status(409).json({ error: 'A record with that key already exists' });
  if (error.name === 'ValidationError' || error.name === 'CastError') return res.status(400).json({ error: 'The submitted data is invalid' });
  if (error.message === 'Origin is not allowed by CORS') return res.status(403).json({ error: 'Origin is not allowed' });
  if (error.message && error.message.startsWith('Only JPEG')) return res.status(415).json({ error: error.message });
  console.error('[api] Request failed');
  return res.status(500).json({ error: 'An unexpected server error occurred' });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.info(`[server] ZAYER Digital API listening on port ${PORT}`);
});

let initializationPromise;
async function initializeStore() {
  if (initializationPromise) return initializationPromise;
  initializationPromise = (async () => {
    await connectDB();
    if (store.getDbStatus()) await Promise.all(Object.values(Models).map((model) => model.createIndexes()));
    await store.ensureDefaults();
    const email = plainText(process.env.ADMIN_INITIAL_EMAIL, 190).toLowerCase();
    const password = process.env.ADMIN_INITIAL_PASSWORD;
    const admin = email ? await store.findOne('admins', { email }, { includePassword: true }) : null;
    if (email && password && password.trim().length >= 12) {
      if (!admin) {
        await store.create('admins', {
          name: plainText(process.env.ADMIN_INITIAL_NAME || 'ZAYER Administrator', 120), email,
          passwordHash: await bcrypt.hash(password, 12),
        });
        console.info('[store] Initial administrator created from environment configuration');
      } else if (!store.getDbStatus() && admin.passwordHash
        && password.trim() !== 'ChangeMe_Zayer2026!'
        && await bcrypt.compare('ChangeMe_Zayer2026!', admin.passwordHash)) {
        await store.update('admins', admin.id, { passwordHash: await bcrypt.hash(password, 12) });
        console.warn('[store] Replaced the default local administrator password from environment configuration');
      }
    }
  })();
  try {
    await initializationPromise;
  } finally {
    initializationPromise = undefined;
  }
}

mongoose.connection.on('connected', () => initializeStore().catch(() => console.error('[store] MongoDB initialization failed')));
initializeStore().catch(() => console.error('[store] Startup initialization failed; API remains available'));

function shutdown(signal) {
  console.info(`[server] ${signal} received; shutting down`);
  server.close(() => mongoose.disconnect().finally(() => process.exit(0)));
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = app;
