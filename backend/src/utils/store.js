const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { getDbStatus } = require('../config/db');
const Models = require('../models');

const DATA_FILE = path.join(__dirname, '../../data/local-db.json');
const COLLECTIONS = {
  admins: ['Admin', 'admins'], items: ['Item', 'items'], jobs: ['Job', 'jobs'], messages: ['Message', 'messages'],
  settings: ['Setting', 'settings'], blocks: ['Block', 'blocks'], components: ['Component', 'components'],
  portfolioItems: ['PortfolioItem', 'portfolio_items'], contactBoxes: ['ContactBox', 'contact_boxes'],
  serviceItems: ['ServiceItem', 'service_items'], socialItems: ['SocialItem', 'social_items'], auditLogs: ['AuditLog', 'audit_logs'],
};

const DEFAULT_DATA = {
  admins: [],
  items: [
    { page: 'home', section: 'hero', sort_order: 0, visible: true, title_en: 'Make your next move.', title_fr: 'Donnez vie à votre prochaine idée.', text_en: 'We turn ambitious ideas into brands, experiences and digital growth.', text_fr: 'Nous transformons les idées ambitieuses en marques, expériences et croissance digitale.', sub_en: 'Independent digital agency · Tunis, Tunisia', sub_fr: 'Agence digitale indépendante · Tunis, Tunisie' },
    { page: 'home', section: 'intro', sort_order: 1, visible: true, title_en: 'Digital moves fast. Good ideas move further.', title_fr: 'Le digital avance vite. Les bonnes idées vont plus loin.', text_en: 'We connect strategy, creativity and technology to help brands move with purpose.', text_fr: 'Nous réunissons stratégie, création et technologie pour aider les marques à avancer.' },
    { page: 'about', section: 'intro', sort_order: 0, visible: true, title_en: 'A Tunisian agency, open to the world.', title_fr: 'Une agence tunisienne, ouverte sur le monde.', text_en: 'ZAYER Digital is an independent agency in Tunis. We help brands find their place and build what comes next.', text_fr: 'ZAYER Digital est une agence indépendante à Tunis. Nous aidons les marques à trouver leur place et à construire leur avenir digital.' },
    { page: 'services', section: 'intro', sort_order: 0, visible: true, title_en: 'Capabilities that move together.', title_fr: 'Des expertises qui avancent ensemble.', text_en: 'A connected approach, from the first question to the final measure.', text_fr: 'Une approche cohérente, de la première question à la dernière mesure.' },
  ],
  jobs: [], messages: [], audit_logs: [],
  blocks: [
    { bkey: 'home.hero.link', page: 'home', value_en: 'Start a project', value_fr: 'Parlons de votre projet', href: '/contact', visible: true },
    { bkey: 'home.hero.secondary', page: 'home', value_en: 'Explore our work', value_fr: 'Découvrir nos projets', href: '/portfolio', visible: true },
  ],
  components: [],
  settings: [
    { skey: 'contact_email', value_en: 'contact@zayerdigital.tn', value_fr: 'contact@zayerdigital.tn' },
    { skey: 'contact_phone', value_en: '+216 48 134 666', value_fr: '+216 48 134 666' },
    { skey: 'contact_address', value_en: '28 Av. Kheireddine Pacha, Tunis 1073, Tunisia', value_fr: '28 Av. Kheireddine Pacha, Tunis 1073, Tunisie' },
    { skey: 'seo_title', value_en: 'ZAYER Digital', value_fr: 'ZAYER Digital' },
    { skey: 'seo_description', value_en: 'ZAYER Digital is an independent digital agency in Tunis helping brands grow.', value_fr: 'ZAYER Digital est une agence digitale indépendante à Tunis qui accompagne la croissance des marques.' },
  ],
  portfolio_items: [],
  contact_boxes: [
    { label: 'Email', label_en: 'Email', label_fr: 'E-mail', value: 'contact@zayerdigital.tn', icon: 'mail', visible: true, sort_order: 0 },
    { label: 'Phone', label_en: 'Phone', label_fr: 'Téléphone', value: '48 134 666', icon: 'phone', visible: true, sort_order: 1 },
    { label: 'Phone', label_en: 'Phone', label_fr: 'Téléphone', value: '48 138 020', icon: 'phone', visible: true, sort_order: 2 },
    { label: 'Location', label_en: 'Location', label_fr: 'Adresse', value: '28 Av. Kheireddine Pacha, Tunis 1073, Tunisia', value_en: '28 Av. Kheireddine Pacha, Tunis 1073, Tunisia', value_fr: '28 Av. Kheireddine Pacha, Tunis 1073, Tunisie', icon: 'pin', visible: true, sort_order: 3 },
  ],
  service_items: [
    { label: 'SEO & Marketing de Contenu', label_en: 'SEO & Content Marketing', label_fr: 'SEO & Marketing de contenu', category_en: 'Digital marketing', category_fr: 'Marketing digital', description_en: 'Improve search visibility, attract the right audience and build lasting authority through sustainable organic growth.', description_fr: 'Améliorez votre visibilité, attirez la bonne audience et développez une autorité durable grâce au référencement naturel.', description: 'Améliorez votre visibilité, attirez la bonne audience et développez une autorité durable grâce au référencement naturel.', price: 350, visible: true, sort_order: 0 },
    { label: 'Branding & Création', label_en: 'Branding & Creative', label_fr: 'Branding & création', category_en: 'Creative', category_fr: 'Création', description_en: 'Build a cohesive visual identity, from logos and guidelines to the assets that make your brand distinctive.', description_fr: 'Créez une identité visuelle cohérente, du logo à la charte graphique, pour distinguer votre marque.', description: 'Créez une identité visuelle cohérente, du logo à la charte graphique, pour distinguer votre marque.', price: 450, visible: true, sort_order: 1 },
    { label: 'Gestion des Réseaux Sociaux', label_en: 'Social Media Management', label_fr: 'Gestion des réseaux sociaux', category_en: 'Digital marketing', category_fr: 'Marketing digital', description_en: 'Create platform-ready content that builds community, trust and loyalty across your social channels.', description_fr: 'Créez des contenus adaptés aux plateformes pour développer votre communauté, la confiance et la fidélité.', description: 'Créez des contenus adaptés aux plateformes pour développer votre communauté, la confiance et la fidélité.', price: 400, visible: true, sort_order: 2 },
    { label: 'Site Web Shopify / WordPress', label_en: 'Shopify & WordPress Websites', label_fr: 'Sites web Shopify / WordPress', category_en: 'Web development', category_fr: 'Développement web', description_en: 'Launch a fast, polished website designed to turn visitors into customers and support long-term growth.', description_fr: 'Lancez un site web rapide et soigné, conçu pour convertir vos visiteurs et soutenir votre croissance.', description: 'Lancez un site web rapide et soigné, conçu pour convertir vos visiteurs et soutenir votre croissance.', price: 900, visible: true, sort_order: 3 },
    { label: 'Publicités Payantes (Google & Meta)', label_en: 'Paid Ads (Google & Meta)', label_fr: 'Publicité payante (Google & Meta)', category_en: 'Digital marketing', category_fr: 'Marketing digital', description_en: 'Plan and optimize high-performing paid campaigns, from creative and audiences to bidding and reporting.', description_fr: 'Planifiez et optimisez vos campagnes publicitaires, de la création au ciblage et au reporting.', description: 'Planifiez et optimisez vos campagnes publicitaires, de la création au ciblage et au reporting.', price: 500, visible: true, sort_order: 4 },
    { label: 'Stratégie Digitale', label_en: 'Digital Strategy', label_fr: 'Stratégie digitale', category_en: 'Consulting', category_fr: 'Conseil', description_en: 'Audit your digital presence and competitors, then build a roadmap aligned with your business goals.', description_fr: 'Auditez votre présence digitale et vos concurrents, puis définissez une feuille de route adaptée à vos objectifs.', description: 'Auditez votre présence digitale et vos concurrents, puis définissez une feuille de route adaptée à vos objectifs.', price: 300, visible: true, sort_order: 5 },
  ],
  social_items: [
    { label: 'Facebook', icon: 'facebook', url: '', visible: false, sort_order: 0 },
    { label: 'Instagram', icon: 'instagram', url: '', visible: false, sort_order: 1 },
    { label: 'TikTok', icon: 'tiktok', url: '', visible: false, sort_order: 2 },
    { label: 'Threads', icon: 'threads', url: '', visible: false, sort_order: 3 },
    { label: 'X', icon: 'x', url: '', visible: false, sort_order: 4 },
  ],
};

const PORTFOLIO_SEEDS = [
  { seed_key: 'crystal-rent-car', tab_type: 'web', title: 'Crystal Rent Car', title_en: 'Crystal Rent Car', title_fr: 'Crystal Rent Car', category: 'Location de Voitures', category_en: 'Car Rental', category_fr: 'Location de Voitures', description_en: 'Car rental website and digital experience.', description_fr: 'Site de location de voitures et expérience digitale.', link_url: '/portfolio/sites/crystal-rent-car/index.html', media_url: '/portfolio/sites/crystal-rent-car/static/hero-poster.jpg', visible: true, sort_order: 0 },
  { seed_key: 'nessrinou-shoes', tab_type: 'web', title: 'Nessrinou Shoes', title_en: 'Nessrinou Shoes', title_fr: 'Nessrinou Shoes', category: 'E-Commerce Chaussures', category_en: 'Shoe E-Commerce', category_fr: 'E-Commerce Chaussures', description_en: 'An online shoe boutique with a responsive shopping experience.', description_fr: 'Une boutique de chaussures en ligne avec une expérience d’achat adaptée à tous les écrans.', link_url: '/portfolio/sites/nessrinou-shoes/index.html', media_url: '/portfolio/sites/nessrinou-shoes/assets/hero.jpg', visible: true, sort_order: 1 },
  { seed_key: 'see-you-store', tab_type: 'web', title: 'See You Store', title_en: 'See You Store', title_fr: 'See You Store', category: 'Boutique E-Commerce', category_en: 'E-Commerce Store', category_fr: 'Boutique E-Commerce', description_en: 'A modern e-commerce storefront with product discovery and shopping tools.', description_fr: 'Une boutique e-commerce moderne avec catalogue et outils de découverte produit.', link_url: '/portfolio/sites/see-you-store/index.html', media_url: '/portfolio/sites/see-you-store/assets/hero.jpg', visible: true, sort_order: 2 },
  { seed_key: 'coin-de-beaute-yosr', tab_type: 'web', title: 'Coin de Beauté by Yosr', title_en: 'Coin de Beauté by Yosr', title_fr: 'Coin de Beauté by Yosr', category: 'Beauté · Site vitrine', category_en: 'Beauty · Website', category_fr: 'Beauté · Site vitrine', description_en: 'A refined website for a beauty salon and its services.', description_fr: 'Un site élégant consacré à l’univers de la beauté et aux services du salon.', link_url: 'https://coin-de-beaut-by-yosr.ai.studio', media_url: '', visible: true, sort_order: 3 },
  { seed_key: 'gym-time-fitness-club', tab_type: 'web', title: 'Gym Time Fitness Club', title_en: 'Gym Time Fitness Club', title_fr: 'Gym Time Fitness Club', category: 'Fitness · Site vitrine', category_en: 'Fitness · Website', category_fr: 'Fitness · Site vitrine', description_en: 'A dynamic online presence built around energy, training and community.', description_fr: 'Une présence web dynamique imaginée autour de l’énergie et de l’entraînement.', link_url: 'https://gym-time-fitness-club.ai.studio', media_url: '', visible: true, sort_order: 4 },
];

function seedKeyForPortfolioItem(item) {
  if (item.seed_key) return String(item.seed_key);
  const title = String(item.title || item.title_en || '').trim().toLowerCase();
  const namedSeed = PORTFOLIO_SEEDS.find((seed) => seed.link_url === item.link_url
    || String(seed.title).toLowerCase() === title);
  if (namedSeed) return namedSeed.seed_key;
  const match = String(item.link_url || '').match(/^\/portfolio\/sites\/([^/]+)(?:\/|$)/);
  if (!match) return '';
  let folder = match[1];
  try { folder = decodeURIComponent(folder); }
  catch (error) {
    if (error instanceof URIError) return '';
    throw error;
  }
  const slug = folder.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
  return slug ? `discovered-${slug}` : '';
}

async function suppressPortfolioSeed(item) {
  const seedKey = seedKeyForPortfolioItem(item);
  if (!seedKey) return;
  const skey = `_portfolio_removed_${seedKey}`;
  if (!(await findOne('settings', { skey }))) {
    await create('settings', { skey, value_en: 'removed', value_fr: 'removed' });
  }
}

let localData;
let writeQueue = Promise.resolve();

function clone(value) { return JSON.parse(JSON.stringify(value)); }

function loadLocalDb() {
  if (localData) return localData;
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  let contents;
  try {
    contents = fs.readFileSync(DATA_FILE, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      localData = clone(DEFAULT_DATA);
      return localData;
    }
    const corruptPath = `${DATA_FILE}.corrupt-${Date.now()}`;
    try {
      fs.renameSync(DATA_FILE, corruptPath);
    } catch (renameError) {
      console.error(`[store] Failed to read local JSON data and could not preserve it at ${corruptPath}`);
      throw new Error('Local JSON data could not be read or preserved', { cause: renameError });
    }
    console.error(`[store] Local JSON data could not be read; preserved at ${corruptPath}`);
    throw new Error('Local JSON data is unreadable; restore it or remove the corrupt backup before restarting', { cause: error });
  }
  try {
    const parsed = JSON.parse(contents);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Local JSON database must contain an object');
    }
    localData = { ...clone(DEFAULT_DATA), ...parsed };
  } catch (error) {
    const corruptPath = `${DATA_FILE}.corrupt-${Date.now()}`;
    try {
      fs.renameSync(DATA_FILE, corruptPath);
    } catch (renameError) {
      console.error(`[store] Invalid local JSON data could not be preserved at ${corruptPath}`);
      throw new Error('Local JSON data is invalid and could not be preserved', { cause: renameError });
    }
    console.error(`[store] Invalid local JSON data; preserved at ${corruptPath}`);
    throw new Error('Local JSON data is invalid; restore it or remove the corrupt backup before restarting', { cause: error });
  }
  let assignedIds = false;
  for (const [, localName] of Object.values(COLLECTIONS)) {
    for (const row of localData[localName] || []) {
      if (!row.id) {
        row.id = crypto.randomUUID();
        assignedIds = true;
      }
    }
  }
  if (assignedIds) {
    const temporary = `${DATA_FILE}.${process.pid}.init.tmp`;
    fs.writeFileSync(temporary, JSON.stringify(localData, null, 2), { encoding: 'utf8', mode: 0o600 });
    fs.renameSync(temporary, DATA_FILE);
  }
  return localData;
}

function saveLocalDb() {
  const data = clone(loadLocalDb());
  const task = async () => {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    const temporary = `${DATA_FILE}.${process.pid}.${crypto.randomUUID()}.tmp`;
    await fs.promises.writeFile(temporary, JSON.stringify(data, null, 2), { encoding: 'utf8', mode: 0o600 });
    await fs.promises.rename(temporary, DATA_FILE);
  };
  const run = writeQueue.then(task);
  writeQueue = run.catch(() => {});
  return run;
}

function collectionInfo(name) {
  const info = COLLECTIONS[name];
  if (!info) throw new Error(`Unknown collection: ${name}`);
  return info;
}

function outputDocument(document) {
  if (!document) return null;
  const value = typeof document.toObject === 'function' ? document.toObject() : clone(document);
  if (value._id) {
    value.id = String(value._id);
    delete value._id;
  }
  delete value.__v;
  return value;
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function list(name, filter = {}, options = {}) {
  const [modelName, localName] = collectionInfo(name);
  const paginated = options.page !== undefined;
  const limit = Math.min(Math.max(Number(options.limit) || 500, 1), paginated ? 100 : 1000);
  const page = Math.max(Number.parseInt(options.page, 10) || 1, 1);
  const search = typeof options.q === 'string' ? options.q.trim().slice(0, 120) : '';
  if (getDbStatus()) {
    const queryFilter = { ...filter };
    if (name === 'settings') queryFilter.$and = [...(queryFilter.$and || []), { skey: { $not: /^_/ } }];
    if (search && options.searchFields?.length) {
      queryFilter.$or = options.searchFields.map((field) => ({ [field]: { $regex: escapeRegex(search), $options: 'i' } }));
    }
    const query = Models[modelName].find(queryFilter);
    if (options.sort) query.sort(options.sort);
    if (paginated) query.skip((page - 1) * limit);
    query.limit(limit);
    const [rows, total] = await Promise.all([
      query.lean(),
      paginated ? Models[modelName].countDocuments(queryFilter) : Promise.resolve(undefined),
    ]);
    const data = rows.map(outputDocument);
    return paginated ? { rows: data, total, page, limit, pages: Math.ceil(total / limit) } : data;
  }
  let rows = (loadLocalDb()[localName] || []).filter((row) => (
    (name !== 'settings' || !String(row.skey || '').startsWith('_'))
    && Object.entries(filter).every(([key, value]) => String(row[key]) === String(value))
  ));
  if (search && options.searchFields?.length) {
    const needle = search.toLocaleLowerCase();
    rows = rows.filter((row) => options.searchFields.some((field) => String(row[field] ?? '').toLocaleLowerCase().includes(needle)));
  }
  if (options.sort) {
    const [key, direction] = Object.entries(options.sort)[0] || [];
    if (key) rows = rows.slice().sort((a, b) => (a[key] > b[key] ? 1 : a[key] < b[key] ? -1 : 0) * (direction < 0 ? -1 : 1));
  }
  if (!paginated) return clone(rows.slice(0, limit));
  const total = rows.length;
  return { rows: clone(rows.slice((page - 1) * limit, page * limit)), total, page, limit, pages: Math.ceil(total / limit) };
}

async function findOne(name, filter = {}, options = {}) {
  const [modelName, localName] = collectionInfo(name);
  const adminEmail = name === 'admins' && typeof filter.email === 'string'
    ? filter.email.trim()
    : null;
  if (getDbStatus()) {
    const queryFilter = adminEmail === null
      ? filter
      : { ...filter, email: new RegExp(`^${escapeRegex(adminEmail)}$`, 'i') };
    let query = Models[modelName].findOne(queryFilter);
    if (options.includePassword) query = query.select('+passwordHash');
    return outputDocument(await query.lean());
  }
  const found = (loadLocalDb()[localName] || []).find((row) => Object.entries(filter).every(([key, value]) => (
    name === 'admins' && key === 'email'
      ? String(row[key] || '').trim().toLowerCase() === String(value).trim().toLowerCase()
      : String(row[key]) === String(value)
  )));
  return found ? clone(found) : null;
}

async function findById(name, id, options = {}) {
  const [modelName, localName] = collectionInfo(name);
  if (getDbStatus()) {
    let query = Models[modelName].findById(id);
    if (options.includePassword) query = query.select('+passwordHash');
    return outputDocument(await query.lean());
  }
  const found = (loadLocalDb()[localName] || []).find((row) => String(row.id) === String(id));
  return found ? clone(found) : null;
}

async function create(name, values) {
  const [modelName, localName] = collectionInfo(name);
  if (getDbStatus()) return outputDocument(await Models[modelName].create(values));
  if (process.env.NODE_ENV === 'production') throw databaseUnavailableError();
  const now = new Date().toISOString();
  const row = { ...clone(values), id: crypto.randomUUID(), createdAt: now, updatedAt: now };
  loadLocalDb()[localName].push(row);
  await saveLocalDb();
  return clone(row);
}

async function update(name, id, values) {
  const [modelName, localName] = collectionInfo(name);
  if (getDbStatus()) {
    const doc = await Models[modelName].findByIdAndUpdate(id, { $set: values }, { new: true, runValidators: true });
    return outputDocument(doc);
  }
  if (process.env.NODE_ENV === 'production') throw databaseUnavailableError();
  const rows = loadLocalDb()[localName];
  const index = rows.findIndex((row) => String(row.id) === String(id));
  if (index < 0) return null;
  rows[index] = { ...rows[index], ...clone(values), updatedAt: new Date().toISOString() };
  await saveLocalDb();
  return clone(rows[index]);
}

async function remove(name, id) {
  const [modelName, localName] = collectionInfo(name);
  if (getDbStatus()) return outputDocument(await Models[modelName].findByIdAndDelete(id));
  if (process.env.NODE_ENV === 'production') throw databaseUnavailableError();
  const rows = loadLocalDb()[localName];
  const index = rows.findIndex((row) => String(row.id) === String(id));
  if (index < 0) return null;
  const [deleted] = rows.splice(index, 1);
  await saveLocalDb();
  return clone(deleted);
}

function databaseUnavailableError() {
  const error = new Error('Database is unavailable; writes are temporarily disabled');
  error.status = 503;
  return error;
}

async function ensureDefaults() {
  if (!getDbStatus() && process.env.NODE_ENV === 'production') return;
  for (const [name, localName] of [['items', 'items'], ['blocks', 'blocks'], ['contactBoxes', 'contact_boxes'], ['serviceItems', 'service_items'], ['socialItems', 'social_items']]) {
    const rows = await list(name, {}, { limit: 1 });
    if (rows.length) continue;
    const defaults = DEFAULT_DATA[localName] || [];
    for (const row of defaults) await create(name, row);
  }
  for (const setting of DEFAULT_DATA.settings) {
    if (!(await findOne('settings', { skey: setting.skey }))) await create('settings', setting);
  }
  const existing = await list('portfolioItems', {}, { limit: 1000 });
  const knownLinks = new Set(existing.map((item) => item.link_url).filter(Boolean));
  const knownTitles = new Set(existing.map((item) => String(item.title || item.title_en || '').trim().toLowerCase()).filter(Boolean));
  const knownSeedKeys = new Set(existing.map(seedKeyForPortfolioItem).filter(Boolean));
  let order = existing.reduce((max, item) => Math.max(max, Number(item.sort_order) || 0), -1) + 1;
  const projects = [...PORTFOLIO_SEEDS, ...discoverPortfolioSites()];
  for (const project of projects) {
    const staticSeed = PORTFOLIO_SEEDS.find((seed) => seed.link_url === project.link_url);
    const candidate = staticSeed ? { ...staticSeed } : project;
    const seedKey = seedKeyForPortfolioItem(candidate);
    if (seedKey && await findOne('settings', { skey: `_portfolio_removed_${seedKey}` })) continue;
    const title = String(candidate.title || '').trim().toLowerCase();
    if (knownSeedKeys.has(seedKey) || knownLinks.has(candidate.link_url) || knownTitles.has(title)) continue;
    await create('portfolioItems', { ...candidate, sort_order: existing.length ? order++ : candidate.sort_order });
    knownLinks.add(candidate.link_url);
    knownTitles.add(title);
    if (seedKey) knownSeedKeys.add(seedKey);
  }
}

function discoverPortfolioSites() {
  const projectRoot = path.resolve(__dirname, '../../..');
  const candidates = [
    path.join(projectRoot, 'frontend', 'public', 'portfolio', 'sites'),
    '/var/www/zayer-mern/portfolio/sites',
    process.env.PORTFOLIO_SITES_DIR,
    path.join(__dirname, '../../uploads/portfolio-sites'),
  ].filter(Boolean);
  const discovered = new Map();
  for (const sitesDirectory of new Set(candidates.map((entry) => path.resolve(entry)))) {
    let entries;
    try { entries = fs.readdirSync(sitesDirectory, { withFileTypes: true }); }
    catch (error) {
      if (error.code === 'ENOENT' || error.code === 'ENOTDIR') continue;
      throw error;
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const root = path.join(sitesDirectory, entry.name);
      let htmlFiles;
      try {
        htmlFiles = fs.readdirSync(root, { withFileTypes: true })
          .filter((file) => file.isFile() && /\.html?$/i.test(file.name))
          .map((file) => file.name);
      } catch (error) {
        if (error.code === 'ENOENT') continue;
        throw error;
      }
      if (!htmlFiles.length) continue;
      const slug = entry.name.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
      if (!slug || discovered.has(slug)) continue;
      const entryFile = htmlFiles.includes('index.html') ? 'index.html' : htmlFiles[0];
      const title = entry.name.replace(/[-_]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
      discovered.set(slug, {
        seed_key: `discovered-${slug}`,
        tab_type: 'web',
        title,
        title_en: title,
        title_fr: title,
        category: 'Site web',
        category_en: 'Website',
        category_fr: 'Site web',
        link_url: `/portfolio/sites/${encodeURIComponent(entry.name)}/${encodeURIComponent(entryFile)}`,
        media_url: '',
        visible: true,
      });
    }
  }
  return [...discovered.values()];
}

module.exports = { COLLECTIONS, DEFAULT_DATA, PORTFOLIO_SEEDS, loadLocalDb, saveLocalDb, list, findOne, findById, create, update, remove, ensureDefaults, getDbStatus, discoverPortfolioSites, portfolioSeedKey: seedKeyForPortfolioItem, suppressPortfolioSeed };
