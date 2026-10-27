require('dotenv').config();
const bcrypt = require('bcryptjs');
const { connectDB } = require('../config/db');
const store = require('../utils/store');
const { plainText } = require('../utils/sanitizer');

async function seed() {
  const email = plainText(process.env.ADMIN_INITIAL_EMAIL, 190).toLowerCase();
  const password = process.env.ADMIN_INITIAL_PASSWORD;
  if (!email || !password || password.length < 12) {
    throw new Error('Set ADMIN_INITIAL_EMAIL and a unique ADMIN_INITIAL_PASSWORD of at least 12 characters');
  }
  await connectDB();
  await store.ensureDefaults();
  if (!await store.findOne('admins', { email })) {
    await store.create('admins', {
      name: plainText(process.env.ADMIN_INITIAL_NAME || 'ZAYER Administrator', 120),
      email,
      passwordHash: await bcrypt.hash(password, 12),
    });
  }
  console.info('[seed] Default content and administrator are ready');
  process.exit(0);
}

seed().catch((error) => {
  console.error('[seed] Setup failed:', error.message);
  process.exit(1);
});
