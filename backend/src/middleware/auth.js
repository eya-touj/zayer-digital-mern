const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const store = require('../utils/store');

const SESSION_COOKIE = 'zsid';
const CSRF_COOKIE = 'zcsrf';

function secret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production') throw new Error('JWT_SECRET must be configured in production');
  return 'local-development-secret-change-before-deploy';
}

function cookieOptions(req, maxAge) {
  const secure = Boolean(req.secure || req.headers['x-forwarded-proto'] === 'https');
  return { httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge };
}

function issueSession(req, res, admin) {
  const csrfToken = crypto.randomBytes(32).toString('hex');
  const token = jwt.sign({ sub: String(admin.id), email: admin.email, csrf: csrfToken }, secret(), { expiresIn: '2h', issuer: 'zayer-digital' });
  res.cookie(SESSION_COOKIE, token, cookieOptions(req, 2 * 60 * 60 * 1000));
  res.cookie(CSRF_COOKIE, csrfToken, { ...cookieOptions(req, 2 * 60 * 60 * 1000), httpOnly: false });
  return csrfToken;
}

function clearSession(req, res) {
  res.clearCookie(SESSION_COOKIE, cookieOptions(req));
  res.clearCookie(CSRF_COOKIE, { ...cookieOptions(req), httpOnly: false });
}

async function requireAuth(req, res, next) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  let payload;
  try {
    payload = jwt.verify(token, secret(), { issuer: 'zayer-digital' });
  } catch (error) {
    clearSession(req, res);
    return res.status(401).json({ error: 'Session expired or invalid' });
  }
  try {
    const admin = await store.findById('admins', payload.sub);
    if (!admin || admin.active === false) {
      clearSession(req, res);
      return res.status(401).json({ error: 'Session expired or invalid' });
    }
    req.admin = { id: payload.sub, email: payload.email };
    req.sessionCsrf = payload.csrf;
    return next();
  } catch (error) {
    return next(error);
  }
}

function requireCsrf(req, res, next) {
  const header = req.get('X-CSRF') || req.get('X-CSRF-Token');
  const cookie = req.cookies?.[CSRF_COOKIE];
  if (!header || !cookie || !req.sessionCsrf || header !== cookie || header !== req.sessionCsrf) {
    return res.status(403).json({ error: 'CSRF verification failed' });
  }
  return next();
}

module.exports = { requireAuth, requireCsrf, issueSession, clearSession, secret };
