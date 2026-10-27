import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, ArrowUpRight, CircleDollarSign, ChevronDown, FileDown, Globe, Instagram, Linkedin, Mail, MapPin, Phone,
  Plus, Save, Trash2, TrendingUp, X,
} from 'lucide-react';
import { FaFacebookF } from 'react-icons/fa';
import { api } from '../lib/api';
import ConfirmModal from '../components/ConfirmModal';
import { useLang } from '../context/LangContext';
import { localizedItem, useSiteContent } from '../context/SiteContentContext';
import portfolioStyles from '../styles/portfolio.css?inline';
import adminStyles from '../styles/portfolio-admin.css?inline';
import responsiveStyles from '../styles/responsive.css?inline';

const initialServices = [
  { label_en: 'SEO & Content Marketing', label_fr: 'SEO & Marketing de contenu', description_en: 'Improve search visibility, attract the right audience and build lasting authority through sustainable organic growth.', description_fr: 'Améliorez votre visibilité, attirez la bonne audience et développez une autorité durable grâce au référencement naturel.', price: 350 },
  { label_en: 'Branding & Creative', label_fr: 'Branding & création', description_en: 'Build a cohesive visual identity, from logos and guidelines to the assets that make your brand distinctive.', description_fr: 'Créez une identité visuelle cohérente, du logo à la charte graphique, pour distinguer votre marque.', price: 450 },
  { label_en: 'Social Media Management', label_fr: 'Gestion des réseaux sociaux', description_en: 'Create platform-ready content that builds community, trust and loyalty across your social channels.', description_fr: 'Créez des contenus adaptés aux plateformes pour développer votre communauté, la confiance et la fidélité.', price: 400 },
  { label_en: 'Shopify & WordPress Websites', label_fr: 'Sites web Shopify / WordPress', description_en: 'Launch a fast, polished website designed to turn visitors into customers and support long-term growth.', description_fr: 'Lancez un site web rapide et soigné, conçu pour convertir vos visiteurs et soutenir votre croissance.', price: 900 },
  { label_en: 'Paid Ads (Google & Meta)', label_fr: 'Publicité payante (Google & Meta)', description_en: 'Plan and optimize high-performing paid campaigns, from creative and audiences to bidding and reporting.', description_fr: 'Planifiez et optimisez vos campagnes publicitaires, de la création au ciblage et au reporting.', price: 500 },
  { label_en: 'Digital Strategy', label_fr: 'Stratégie digitale', description_en: 'Audit your digital presence and competitors, then build a roadmap aligned with your business goals.', description_fr: 'Auditez votre présence digitale et vos concurrents, puis définissez une feuille de route adaptée à vos objectifs.', price: 300 },
];

const normalizeCopy = (value) => String(value || '').trim().toLocaleLowerCase().replace(/[^a-z0-9]+/g, '');
const localized = (item, field, lang, fallback = '') => {
  const aliases = field === 'description' ? ['description', 'text', 'sub'] : field === 'label' ? ['label', 'title', 'value'] : [field];
  for (const alias of aliases) {
    const value = item?.[`${alias}_${lang}`];
    if (value) return value;
  }
  const legacyLabel = item?.label || item?.title || item?.name || '';
  const knownService = initialServices.find((service) => [service.label_en, service.label_fr].some((label) => normalizeCopy(label) === normalizeCopy(legacyLabel)));
  if (knownService?.[`${field}_${lang}`]) return knownService[`${field}_${lang}`];
  if (item?.[field]) return item[field];
  for (const alias of aliases) {
    const englishValue = item?.[`${alias}_en`];
    if (englishValue) return englishValue;
  }
  return fallback || '';
};
const contactLabel = (value, lang) => {
  const key = String(value || '').trim().toLowerCase();
  if (lang === 'fr') return ({ email: 'E-mail', mail: 'E-mail', phone: 'Téléphone', telephone: 'Téléphone', whatsapp: 'WhatsApp', location: 'Adresse', address: 'Adresse', website: 'Site Web', 'site web': 'Site Web' })[key] || value;
  return ({ 'e-mail': 'Email', mail: 'Email', téléphone: 'Phone', adresse: 'Location', 'site web': 'Website' })[key] || value;
};

function Icon({ name, size = 18 }) {
  const props = { size, strokeWidth: 1.8, 'aria-hidden': true };
  if (name === 'mail') return <Mail {...props} />;
  if (name === 'phone') return <Phone {...props} />;
  if (name === 'pin') return <MapPin {...props} />;
  if (name === 'facebook') return <FaFacebookF size={size} aria-hidden="true" />;
  if (name === 'instagram') return <Instagram {...props} />;
  if (name === 'linkedin') return <Linkedin {...props} />;
  return <Globe {...props} />;
}

function detectContact(value) {
  const clean = String(value || '').trim();
  if (clean.includes('@') && !clean.includes(' ')) return { type: 'email', icon: 'mail', href: `mailto:${clean}` };
  if (/^[+\d\s().-]+$/.test(clean) && clean.replace(/\D/g, '').length >= 8) return { type: 'phone', icon: 'phone', href: `https://wa.me/${clean.replace(/\D/g, '')}` };
  if (/^(https?:\/\/|www\.)/i.test(clean) || /\.[a-z]{2,}$/i.test(clean)) return { type: 'web', icon: 'web', href: /^https?:\/\//i.test(clean) ? clean : `https://${clean}` };
  return { type: 'text', icon: 'pin', href: '' };
}

function QuoteForm({ services, lang }) {
  const fr = lang === 'fr';
  const [selected, setSelected] = useState([]);
  const [client, setClient] = useState('');
  const [selectionWarning, setSelectionWarning] = useState(false);
  const total = services.reduce((sum, service, index) => sum + (selected.includes(index) ? Number(service.price || 0) : 0), 0);
  const toggle = (index) => setSelected((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index]);
  const download = () => {
    if (!selected.length) { setSelectionWarning(true); return; }
    window.print();
  };
  return <><div className="devis-wrap">
    <input type="text" id="devisClientName" className="devis-name-input" placeholder={fr ? 'Votre nom ou entreprise (facultatif)' : 'Your name or business (optional)'} value={client} onChange={(event) => setClient(event.target.value)} />
    {services.map((service, index) => <label className="devis-item" key={service.id || (service.label_en || service.label_fr || service.label || 'service') + '-' + index}>
      <input type="checkbox" className="devis-check" checked={selected.includes(index)} onChange={() => toggle(index)} />
      <div className="dv-label">{localized(service, 'label', lang, service.label || '')}</div>
      <div className="dv-price">{Number(service.price || 0).toLocaleString(fr ? 'fr-TN' : 'en-TN')} TND</div>
    </label>)}
    {!services.length && <div className="empty-state"><span className="empty-icon"><CircleDollarSign size={34} aria-hidden="true" /></span>{fr ? 'Aucun service disponible pour le moment.' : 'No services are available right now.'}</div>}
    <div className="devis-total"><div><div className="dt-label">{fr ? 'Total estimé' : 'Estimated total'}</div><div className="dt-num"><span id="devisTotal">{total.toLocaleString(fr ? 'fr-TN' : 'en-TN')}</span> TND</div></div></div>
    <button className="devis-download" type="button" onClick={download}><FileDown size={17} aria-hidden="true" /> {fr ? 'Télécharger le devis' : 'Download estimate'}</button>
  </div><ConfirmModal
    open={selectionWarning}
    title={fr ? 'Sélection requise' : 'Select a service'}
    message={fr ? 'Sélectionnez au moins un service avant de télécharger votre devis.' : 'Select at least one service before downloading your estimate.'}
    confirmLabel={fr ? 'Compris' : 'Got it'}
    showCancel={false}
    variant="warning"
    onConfirm={() => setSelectionWarning(false)}
    onCancel={() => setSelectionWarning(false)}
  /></>;
}

function PortfolioAdmin() {
  const { lang } = useLang();
  const fr = lang === 'fr';
  const copy = (en, french) => fr ? french : en;
  const [loggedIn, setLoggedIn] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [tab, setTab] = useState('portfolioItems');
  const [rows, setRows] = useState([]);
  const [draft, setDraft] = useState({ tab_type: 'web', title: '', category: '', media_url: '', link_url: '', label: '', value: '', icon: 'globe', url: '', price: 0, visible: true });
  const tabs = [['portfolioItems', 'Portfolio'], ['serviceItems', 'Services'], ['contactBoxes', 'Contact'], ['socialItems', copy('Social networks', 'Réseaux sociaux')]];

  useLayoutEffect(() => {
    api.get('/api/me').then(() => setLoggedIn(true)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!loggedIn) return;
    api.get(`/api/${tab}`).then(setRows).catch((cause) => setError(cause.message));
  }, [loggedIn, tab]);

  const login = async (event) => {
    event.preventDefault(); setError('');
    const data = new FormData(event.currentTarget);
    try { await api.post('/api/login', { email: data.get('email'), password: data.get('password') }); setLoggedIn(true); }
    catch (cause) { setError(cause.message); }
  };

  const fieldsFor = (row) => tab === 'portfolioItems'
    ? { tab_type: row.tab_type || 'web', title: row.title || '', title_en: row.title_en || '', title_fr: row.title_fr || '', category: row.category || '', category_en: row.category_en || '', category_fr: row.category_fr || '', description_en: row.description_en || '', description_fr: row.description_fr || '', media_url: row.media_url || '', link_url: row.link_url || '', sort_order: Number(row.sort_order) || 0, visible: row.visible !== false }
    : tab === 'serviceItems'
      ? { label: row.label || '', label_en: row.label_en || '', label_fr: row.label_fr || '', description_en: row.description_en || '', description_fr: row.description_fr || '', price: Number(row.price) || 0, sort_order: Number(row.sort_order) || 0, visible: row.visible !== false }
      : tab === 'contactBoxes'
        ? { label: row.label || '', label_en: row.label_en || '', label_fr: row.label_fr || '', value: row.value || '', value_en: row.value_en || '', value_fr: row.value_fr || '', icon: row.icon || 'globe', sort_order: Number(row.sort_order) || 0, visible: row.visible !== false }
        : { label: row.label || '', label_en: row.label_en || '', label_fr: row.label_fr || '', icon: row.icon || 'globe', url: row.url || '', sort_order: Number(row.sort_order) || 0, visible: row.visible !== false };

  const save = async (event, row) => {
    event.preventDefault(); setError(''); setMessage('');
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const mediaFile = form.get('media_file');
    delete payload.media_file;
    payload.visible = form.has('visible');
    if ('price' in payload) payload.price = Number(payload.price) || 0;
    if ('sort_order' in payload) payload.sort_order = Number(payload.sort_order) || 0;
    try {
      if (mediaFile instanceof File && mediaFile.size) payload.media_url = (await api.upload('/api/upload', mediaFile)).url;
      if (row?.id || row?._id) await api.post(`/api/${tab}`, { ...payload, id: row.id || row._id });
      else await api.post(`/api/${tab}`, payload);
      setMessage(copy('Saved.', 'Enregistré.')); setRows(await api.get(`/api/${tab}`));
      if (!row) setDraft({ ...draft, title: '', title_en: '', title_fr: '', category: '', category_en: '', category_fr: '', description_en: '', description_fr: '', media_url: '', link_url: '', label: '', label_en: '', label_fr: '', value: '', value_en: '', value_fr: '', url: '' });
    } catch (cause) { setError(cause.message); }
  };

  const remove = async (row) => {
    setError('');
    try { await api.post(`/api/${tab}?a=delete`, { id: row.id || row._id }); setRows(await api.get(`/api/${tab}`)); }
    catch (cause) { setError(cause.message); }
  };

  const logout = async () => { try { await api.post('/api/logout', {}); } finally { setLoggedIn(false); } };
  const fields = tab === 'portfolioItems'
    ? [['tab_type', copy('Section', 'Onglet'), 'select'], ['title', copy('Default title', 'Titre par défaut'), 'text'], ['title_en', 'Title (EN)', 'text'], ['title_fr', 'Titre (FR)', 'text'], ['category', copy('Default category', 'Catégorie par défaut'), 'text'], ['category_en', 'Category (EN)', 'text'], ['category_fr', 'Catégorie (FR)', 'text'], ['description_en', 'Description (EN)', 'text'], ['description_fr', 'Description (FR)', 'text'], ['media_url', copy('Media URL', 'URL du média'), 'url'], ['media_file', copy('Image or video', 'Photo ou vidéo'), 'file'], ['link_url', copy('Project link', 'Lien du projet'), 'url'], ['sort_order', copy('Sort order', 'Ordre'), 'number']]
    : tab === 'serviceItems'
      ? [['label', copy('Default name', 'Nom par défaut'), 'text'], ['label_en', 'Name (EN)', 'text'], ['label_fr', 'Nom (FR)', 'text'], ['description_en', 'Description (EN)', 'text'], ['description_fr', 'Description (FR)', 'text'], ['price', copy('Price in TND', 'Prix en TND'), 'number'], ['sort_order', copy('Sort order', 'Ordre'), 'number']]
      : tab === 'contactBoxes'
        ? [['label', copy('Default label', 'Libellé par défaut'), 'text'], ['label_en', 'Label (EN)', 'text'], ['label_fr', 'Libellé (FR)', 'text'], ['value', copy('Default value', 'Valeur par défaut'), 'text'], ['value_en', 'Value (EN)', 'text'], ['value_fr', 'Valeur (FR)', 'text'], ['icon', copy('Icon key', 'Clé d’icône'), 'icon'], ['sort_order', copy('Sort order', 'Ordre'), 'number']]
        : [['label', copy('Default platform', 'Plateforme par défaut'), 'text'], ['label_en', 'Platform (EN)', 'text'], ['label_fr', 'Plateforme (FR)', 'text'], ['icon', copy('Icon key', 'Clé d’icône'), 'icon'], ['url', 'URL', 'url'], ['sort_order', copy('Sort order', 'Ordre'), 'number']];
  const renderFields = (row, onChange) => fields.map(([name, label, type]) => <label key={name}>{label}
    {type === 'select' ? <select name={name} defaultValue={row[name] || 'web'}><option value="creative">{copy('Creative production', 'Production créative')}</option><option value="web">{copy('Websites', 'Sites web')}</option><option value="impact">Impact</option></select>
      : type === 'file' ? <input name={name} type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4" />
      : onChange
        ? <input name={name} type={type === 'icon' ? 'text' : type} value={row[name] ?? ''} onChange={(event) => onChange({ ...row, [name]: event.target.value })} required={name === 'title' || name === 'label'} />
        : <input name={name} type={type === 'icon' ? 'text' : type} defaultValue={row[name] ?? ''} required={name === 'title' || name === 'label'} />}
  </label>);

  return <section className="portfolio-admin-area" aria-label={copy('Portfolio management', 'Gestion du portfolio')}><div className="wrap">
    <div className="top-actions"><div><h1>ZAYER<span className="brand-dot">.</span>Digital — {copy('Admin', 'Administration')}</h1><p className="sub">{copy('Secure management of the portfolio and public information.', 'Gestion sécurisée du portfolio et des informations publiques.')}</p></div><button className="mini-btn" type="button" onClick={() => { const url = new URL(location.href); url.searchParams.delete('admin'); location.assign(url); }}>{copy('Close', 'Fermer')}</button></div>
    {!loggedIn ? <div className="card"><form onSubmit={login}><label>{copy('Email address', 'Adresse e-mail')}</label><input type="email" name="email" autoComplete="username" required /><label>{copy('Password', 'Mot de passe')}</label><input type="password" name="password" autoComplete="current-password" required /><button type="submit">{copy('Sign in', 'Se connecter')}</button>{error && <div role="alert" className="error">{error}</div>}</form></div> : <>
      <div className="top-actions"><nav className="portfolio-admin-tabs" aria-label={copy('Admin sections', 'Sections administrateur')}>{tabs.map(([key, label]) => <button type="button" key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>{label}</button>)}</nav><button className="mini-btn" type="button" onClick={logout}>{copy('Log out', 'Déconnexion')}</button></div>
      {error && <div className="error" role="alert">{error}</div>}{message && <div className="success" role="status">{message}</div>}
      <div className="card"><strong>{copy('Add an item', 'Ajouter un élément')}</strong><form className="portfolio-admin-form" onSubmit={(event) => save(event, null)}>{renderFields(draft, setDraft)}<label className="chk"><input type="checkbox" name="visible" defaultChecked /> {copy('Visible', 'Afficher')}</label><button type="submit" className="mini-btn"><Plus size={15} /> {copy('Add', 'Ajouter')}</button></form></div>
      <div className="card"><strong>{copy('Existing items', 'Éléments existants')} ({rows.length})</strong>{rows.map((row) => <details className="item-edit" key={row.id || row._id}><summary><span className={`tag tag-${row.tab_type || 'web'}`}>{row.tab_type || row.icon || 'item'}</span><span className="item-title-preview">{row.title || row.label}</span><ChevronDown className="chev" size={17} /></summary><form className="portfolio-admin-form" onSubmit={(event) => save(event, row)}>{renderFields(fieldsFor(row))}<label className="chk"><input type="checkbox" name="visible" defaultChecked={row.visible !== false} /> {copy('Visible', 'Afficher')}</label><button type="submit" className="mini-btn"><Save size={15} /> {copy('Save', 'Enregistrer')}</button><button type="button" className="mini-btn del-action" onClick={() => remove(row)}><Trash2 size={15} /> {copy('Delete', 'Supprimer')}</button></form></details>)}</div>
    </>}
  </div></section>;
}

export default function Portfolio() {
  const { lang } = useLang();
  const fr = lang === 'fr';
  const { portfolioItems, serviceItems, contactBoxes } = useSiteContent();
  const [activeFilter, setActiveFilter] = useState('__all__');
  const [lightbox, setLightbox] = useState(null);
  const services = serviceItems.length ? serviceItems : initialServices;
  const webItems = portfolioItems.filter((item) => item.visible !== false && item.tab_type === 'web');
  const impactItems = portfolioItems.filter((item) => item.visible !== false && item.tab_type === 'impact');
  const allLabel = fr ? 'Tous' : 'All';
  const categories = useMemo(() => [...new Set(impactItems.map((item) => localized(item, 'category', lang, item.category || '')).filter(Boolean))], [impactItems, lang]);
  const visibleImpact = activeFilter === '__all__' ? impactItems : impactItems.filter((item) => localized(item, 'category', lang, item.category || '') === activeFilter);
  const adminMode = new URLSearchParams(location.search).has('admin');
  const contactItems = contactBoxes.length ? contactBoxes : [
    { id: 'email', label_en: 'Email', label_fr: 'E-mail', value: 'contact@zayerdigital.tn', icon: 'mail' },
    { id: 'phone-one', label_en: 'Phone', label_fr: 'Téléphone', value: '48 134 666', icon: 'phone' },
    { id: 'phone-two', label_en: 'Phone', label_fr: 'Téléphone', value: '48 138 020', icon: 'phone' },
    { id: 'location', label_en: 'Location', label_fr: 'Adresse', value_en: '28 Av. Kheireddine Pacha, Tunis 1073, Tunisia', value_fr: '28 Av. Kheireddine Pacha, Tunis 1073, Tunisie', value: '28 Av. Kheireddine Pacha, Tunis 1073, Tunisia', icon: 'pin' },
  ];

  useEffect(() => {
    const revealItems = [...document.querySelectorAll('.portfolio-document .reveal')];
    const observer = 'IntersectionObserver' in window ? new IntersectionObserver((entries, instance) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in', 'visible');
          instance.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 }) : null;
    revealItems.forEach((item) => { item.classList.add('in', 'visible'); observer?.observe(item); });
    return () => observer?.disconnect();
  }, []);

  if (adminMode) return <><style>{adminStyles}{responsiveStyles}</style><PortfolioAdmin />;</>;

  const serviceName = (service) => localized(service, 'label', lang, service.label || (fr ? 'Service digital' : 'Digital service'));
  const serviceDescription = (service) => localized(service, 'description', lang, service.description || (fr ? 'Une expertise adaptée à vos objectifs et ? votre croissance.' : 'Expertise tailored to your goals and growth.'));
  const projectText = (item, field, fallback = '') => localized(item, field, lang, item[field] || fallback);
  const categoryName = (item) => localized(item, 'category', lang, item.category || (fr ? 'Projet digital' : 'Digital project'));
  const contactValue = (box) => {
    const value = localized(box, 'value', lang, box.value || '');
    if (/^Tunis, (Tunisia|Tunisie)$/i.test(value) || /^28 Av\. Kheireddine Pacha, Tunis 1073, (Tunisia|Tunisie)$/i.test(value)) {
      return fr
        ? '28 Av. Kheireddine Pacha, Tunis 1073, Tunisie'
        : '28 Av. Kheireddine Pacha, Tunis 1073, Tunisia';
    }
    return value;
  };
  const contactName = (box) => contactLabel(localized(box, 'label', lang, box.label || ''), lang);

  return <><style>{portfolioStyles}{responsiveStyles}</style><div className="portfolio-document">
    <section className="page-hero">
      <div className="breadcrumb"><Link to="/">{fr ? 'Accueil' : 'Home'}</Link><span>/</span><span>Portfolio</span></div>
      <h1>{fr ? <>Nous créons des marques<br /><em>qui s’imposent au digital.</em></> : <>We Build Brands That<br /><em>Dominate Digitally.</em></>}</h1>
      <p className="page-hero-sub">{fr ? 'Une agence orientée résultats : stratégie, créativité et performance au service de votre croissance.' : 'A results-driven agency combining strategy, creativity and performance to help your business grow.'}</p>
      <div className="stats-row"><div className="stat-box"><div className="num">8x</div><div className="label">{fr ? 'ROI moyen' : 'Average ROI'}</div></div><div className="stat-box"><div className="num">200+</div><div className="label">{fr ? 'Clients' : 'Clients'}</div></div><div className="stat-box"><div className="num">5</div><div className="label">{fr ? 'Années' : 'Years'}</div></div></div>
    </section>

    <section className="section" id="services"><div className="section-eyebrow">{fr ? 'Ce que nous faisons' : 'What We Do'}</div><h2 className="section-title">{fr ? 'Nos Services' : 'Our Services'}</h2><div className="services-grid"><div className="services-col">
      {services.slice(0, 3).map((service) => <article className="service-item" key={service.id || service._id || serviceName(service)} onClick={(event) => event.currentTarget.classList.toggle('open')}><div className="service-head"><div className="dot"></div><div className="txt">{serviceName(service)}</div></div><div className="desc">{serviceDescription(service)}</div></article>)}
    </div><div className="services-col">{services.slice(3, 6).map((service) => <article className="service-item" key={service.id || service._id || serviceName(service)} onClick={(event) => event.currentTarget.classList.toggle('open')}><div className="service-head"><div className="dot"></div><div className="txt">{serviceName(service)}</div></div><div className="desc">{serviceDescription(service)}</div></article>)}</div></div></section>

    <section className="section" id="web"><div className="section-eyebrow">{fr ? 'Portfolio' : 'Portfolio'}</div><h2 className="section-title">{fr ? <>Sites <em>Web</em></> : <>Websites &amp; <em>Digital</em></>}</h2><div className="web-grid">
      {webItems.map((item) => {
        const title = projectText(item, 'title', fr ? 'Projet web' : 'Web project');
        const description = projectText(item, 'description', item.text_fr || item.text_en || (fr ? 'Découvrez ce projet digital réalisé par ZAYER Digital.' : 'Explore this digital project by ZAYER Digital.'));
        const link = item.link_url;
        const content = <>
          <div className="web-project-preview">
            <div className="preview-window"><div className="preview-brand">{title}</div><div className="preview-tagline">{categoryName(item)}</div></div>
            {item.media_url && <img src={item.media_url} loading="lazy" alt={title} onError={(event) => { event.currentTarget.style.display = 'none'; }} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />}
          </div>
          <div className="web-project-content">
            <div className="web-project-kicker">{categoryName(item)}</div>
            <div className="web-title">{title}</div>
            <p className="web-project-desc">{description}</p>
            {link && <span className="click-btn">{fr ? 'Voir le site' : 'View website'} <ArrowUpRight size={16} /></span>}
          </div>
        </>;
        return link
          ? <a className="web-project-card" data-category={categoryName(item)} key={item.id || item._id || link} href={link} target="_blank" rel="noopener noreferrer" aria-label={(fr ? 'Visiter ' : 'Visit ') + title}>{content}</a>
          : <article className="web-project-card" data-category={categoryName(item)} key={item.id || item._id || title}>{content}</article>;
      })}
    </div></section>

    <section className="section section-alt" id="impact"><div className="section-eyebrow">{fr ? 'Résultats' : 'Results'}</div><h2 className="section-title">{fr ? <>Preuves d?<em>impact</em></> : <>Proof of <em>impact</em></>}</h2>{impactItems.length ? <><div className="filter-pills" data-filter-group="impact"><button type="button" className={'pill' + (activeFilter === '__all__' ? ' active' : '')} onClick={() => setActiveFilter('__all__')}>{allLabel}</button>{categories.map((category) => <button type="button" className={'pill' + (activeFilter === category ? ' active' : '')} data-category={category} key={category} onClick={() => setActiveFilter(category)}>{category}</button>)}</div><div className="media-grid">{visibleImpact.map((item) => { const title = projectText(item, 'title', fr ? 'Projet' : 'Project'); return <article className="media-card" data-category={categoryName(item)} key={item.id || item._id}><div className="media-card-title">{title}</div><button className="media-916" type="button" onClick={() => setLightbox(item)} aria-label={(fr ? 'Voir ' : 'View ') + title}><img src={item.media_url} loading="lazy" alt={title} /></button></article>; })}</div></> : <div className="empty-state"><span className="empty-icon"><TrendingUp size={34} aria-hidden="true" /></span>{fr ? 'Aucune preuve de résultat pour le moment.' : 'No impact examples are available yet.'}</div>}</section>

    <section className="section" id="devis"><div className="section-eyebrow">{fr ? 'Estimation' : 'Estimate'}</div><h2 className="section-title">{fr ? <>Votre devis <em>gratuit</em></> : <>Your free <em>estimate</em></>}</h2><QuoteForm services={services} lang={lang} /></section>

    <section className="section section-alt" id="contact"><div className="section-eyebrow">{fr ? 'Prochaines étapes' : 'Next steps'}</div><h2 className="section-title">{fr ? <>Prêt à booster vos <em>résultats</em> ?</> : <>Ready to grow your <em>results</em>?</>}</h2><div className="contact-wrap"><p style={{ color: 'var(--grey)', marginBottom: 20 }}>{fr ? 'Construisons une feuille de route adaptée à vos objectifs. Contactez-nous pour un premier échange stratégique.' : 'Let’s build a roadmap around your goals. Contact us to start with a strategy conversation.'}</p><div className="contact-buttons">{contactItems.map((box) => { const value = contactValue(box); const detected = detectContact(value); const type = box.icon || detected.icon; const label = contactName(box); const href = box.url || detected.href; return href ? <a className="contact-btn" href={href} key={box.id || box._id || label + value} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}><span><Icon name={type} /> {label}: {value}</span><ArrowRight size={16} /></a> : <div className="contact-btn" style={{ cursor: 'default' }} key={box.id || box._id || label + value}><Icon name={type} /> {label}: {value}</div>; })}</div></div></section>

    <div className={'lightbox-overlay' + (lightbox ? ' active' : '')} id="lightboxOverlay" onClick={() => setLightbox(null)}><div className="lightbox-inner" onClick={(event) => event.stopPropagation()}><button className="lightbox-close" type="button" onClick={() => setLightbox(null)} aria-label={fr ? 'Fermer' : 'Close'}><X size={23} /></button>{lightbox && <><div id="lightboxBody"><img className="lightbox-media" src={lightbox.media_url} alt={projectText(lightbox, 'title', '')} /></div><div className="lightbox-title">{projectText(lightbox, 'title', '')}</div></>}</div></div>
  </div></>;
}
