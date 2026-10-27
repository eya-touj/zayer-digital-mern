import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity, BriefcaseBusiness, Check, ChevronLeft, ChevronRight, Download, Eye, EyeOff, FileText, ImagePlus, Layers3, LogOut,
  Mail, MessageSquare, Plus, RefreshCw, Save, Search, Settings, Trash2, Upload, Users, X,
} from 'lucide-react';
import { api } from '../lib/api';
import ConfirmModal from '../components/ConfirmModal';
import pageStyles from '../styles/original-admin.css?inline';
import responsiveStyles from '../styles/responsive.css?inline';
import AdminOverview from '../components/admin/AdminOverview';
import MediaLibrary from '../components/admin/MediaLibrary';
import ResourceForm from '../components/admin/ResourceForm';
import ResourceTable from '../components/admin/ResourceTable';

const tabs = [
  { key: 'overview', label: 'Vue d’ensemble', icon: Activity },
  { key: 'items', label: 'Pages & contenus', icon: FileText },
  { key: 'serviceItems', label: 'Services', icon: BriefcaseBusiness },
  { key: 'portfolioItems', label: 'Portfolio', icon: ImagePlus },
  { key: 'jobs', label: 'Offres d’emploi', icon: BriefcaseBusiness },
  { key: 'applications', label: 'Candidatures', icon: Users },
  { key: 'messages', label: 'Messages', icon: MessageSquare },
  { key: 'contactBoxes', label: 'Contact', icon: Mail },
  { key: 'socialItems', label: 'Réseaux sociaux', icon: Activity },
  { key: 'settings', label: 'Paramètres du site', icon: Settings },
  { key: 'blocks', label: 'Blocs', icon: Layers3 },
  { key: 'components', label: 'Composants', icon: Activity },
  { key: 'media', label: 'Médiathèque', icon: ImagePlus },
  { key: 'admins', label: 'Administrateurs', icon: Users },
  { key: 'activity', label: 'Activité', icon: Activity },
];

const definitions = {
  items: {
    columns: [['page', 'Page'], ['section', 'Section'], ['title_fr', 'Titre français'], ['visible', 'Visibilité']],
    fields: ['page', 'section', 'sort_order', 'visible', 'title_en', 'title_fr', 'sub_en', 'sub_fr', 'text_en', 'text_fr', 'meta', 'image_url', 'link_url'],
  },
  serviceItems: {
    columns: [['label_fr', 'Service'], ['category_fr', 'Catégorie'], ['price', 'Prix'], ['sort_order', 'Ordre'], ['visible', 'Visibilité']],
    fields: ['label', 'label_en', 'label_fr', 'category_en', 'category_fr', 'description_en', 'description_fr', 'price', 'sort_order', 'visible'],
  },
  portfolioItems: {
    columns: [['title_fr', 'Projet'], ['category_fr', 'Catégorie'], ['link_url', 'Lien'], ['sort_order', 'Ordre'], ['visible', 'Visibilité']],
    fields: ['title', 'title_en', 'title_fr', 'tab_type', 'category_en', 'category_fr', 'description_en', 'description_fr', 'media_url', 'link_url', 'sort_order', 'visible'],
  },
  jobs: {
    columns: [['title_fr', 'Poste'], ['dept_fr', 'Équipe'], ['location_fr', 'Lieu'], ['visible', 'Ouverture']],
    fields: ['title_en', 'title_fr', 'dept_en', 'dept_fr', 'location_en', 'location_fr', 'experience_en', 'experience_fr', 'description_en', 'description_fr', 'sort_order', 'visible'],
  },
  messages: {
    columns: [['kind', 'Type'], ['name', 'Nom'], ['email', 'E-mail'], ['subject', 'Sujet'], ['status', 'Statut'], ['created_at', 'Date']],
  },
  applications: {
    columns: [['name', 'Candidat'], ['email', 'E-mail'], ['subject', 'Poste'], ['status', 'Statut'], ['created_at', 'Date']],
  },
  applications: {
    columns: [['name', 'Candidat'], ['email', 'E-mail'], ['subject', 'Poste'], ['status', 'Statut'], ['created_at', 'Date']],
  },
  contactBoxes: {
    columns: [['label_fr', 'Libellé'], ['value_fr', 'Coordonnée'], ['sort_order', 'Ordre'], ['visible', 'Visibilité']],
    fields: ['label', 'label_en', 'label_fr', 'value', 'value_en', 'value_fr', 'icon', 'sort_order', 'visible'],
  },
  socialItems: {
    columns: [['label_fr', 'Réseau'], ['url', 'URL'], ['sort_order', 'Ordre'], ['visible', 'Visibilité']],
    fields: ['label', 'label_en', 'label_fr', 'icon', 'url', 'sort_order', 'visible'],
  },
  settings: {
    columns: [['skey', 'Paramètre'], ['value_fr', 'Valeur française'], ['value_en', 'Valeur anglaise']],
    fields: ['skey', 'value_en', 'value_fr'],
  },
  blocks: {
    columns: [['bkey', 'Clé'], ['page', 'Page'], ['value_fr', 'Contenu français'], ['visible', 'Visibilité']],
    fields: ['bkey', 'page', 'value_en', 'value_fr', 'href', 'src', 'alt', 'visible'],
  },
  components: {
    columns: [['title', 'Composant'], ['page', 'Page'], ['placement', 'Position'], ['visible', 'Visibilité']],
    fields: ['page', 'title', 'placement', 'sort_order', 'visible', 'html_en', 'html_fr', 'css'],
  },
  admins: {
    columns: [['name', 'Nom'], ['email', 'E-mail'], ['active', 'Actif']],
    fields: ['name', 'email', 'password', 'active'],
  },
  activity: { columns: [['date', 'Date'], ['who', 'Administrateur'], ['action', 'Action'], ['resource', 'Ressource'], ['recordId', 'Identifiant']] },
};

const defaultFor = (key) => ['visible', 'active'].includes(key) ? true : key === 'sort_order' || key === 'price' ? 0 : '';
const createDraft = (resource) => Object.fromEntries((definitions[resource]?.fields || []).map((key) => [key, defaultFor(key)]));
const identifier = (row) => row.id || row._id || row.skey || row.bkey;

function messageOf(error) {
  const messages = {
    media_in_use: `Ce fichier est encore utilisé par ${error.resource || 'du contenu'}.`,
    password_too_short: 'Le mot de passe doit comporter au moins 12 caractères.',
    email_exists: 'Cette adresse e-mail est déjà utilisée.',
    last_active_admin: 'Impossible de désactiver le dernier administrateur actif.',
    cannot_delete_self: 'Vous ne pouvez pas supprimer votre propre compte.',
    current_password_invalid: 'Le mot de passe actuel est incorrect.',
    project_slug_exists: 'Un projet avec ce nom existe déjà dans le portfolio.',
    project_entry_html_required: 'Le dossier doit contenir au moins un fichier HTML.',
    project_upload_too_large: 'La taille totale du projet dépasse 50 Mo.',
    duplicate_project_path: 'Le dossier contient plusieurs fichiers avec le même chemin.',
  };
  return messages[error.message] || error.message || 'Une erreur est survenue.';
}

export default function Admin() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [, setCsrf] = useState('');
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [videoMuted, setVideoMuted] = useState(true);
  const [videoPlaying, setVideoPlaying] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, pages: 1, total: 0 });
  const [draft, setDraft] = useState(null);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [pageFilter, setPageFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [detail, setDetail] = useState(null);
  const [mediaPicker, setMediaPicker] = useState('');
  const [passwordForm, setPasswordForm] = useState(null);
  const [uploadingFolder, setUploadingFolder] = useState(false);
  const [confirmState, setConfirmState] = useState(null);
  const confirmResolver = useRef(null);

  const config = definitions[activeTab];
  const canEdit = Boolean(config?.fields) && !['activity'].includes(activeTab);
  const canDelete = canEdit || ['messages', 'applications'].includes(activeTab);
  const supportsBulk = ['items', 'serviceItems', 'portfolioItems', 'jobs', 'contactBoxes', 'socialItems', 'components', 'blocks', 'settings', 'messages', 'applications'].includes(activeTab);
  const supportsBulkVisibility = ['items', 'serviceItems', 'portfolioItems', 'jobs', 'contactBoxes', 'socialItems', 'components', 'blocks'].includes(activeTab);

  const finishConfirm = useCallback((confirmed) => {
    const resolve = confirmResolver.current;
    confirmResolver.current = null;
    setConfirmState(null);
    resolve?.(confirmed);
  }, []);

  const requestConfirm = useCallback((options) => new Promise((resolve) => {
    if (confirmResolver.current) confirmResolver.current(false);
    confirmResolver.current = resolve;
    setConfirmState(options);
  }), []);

  const loadRows = useCallback(async (resource = activeTab, targetPage = page) => {
    if (!definitions[resource]) return;
    setLoading(true);
    setError('');
    try {
      if (resource === 'admins') {
        const params = new URLSearchParams({ page: String(targetPage), limit: '25', sort: sortField === 'createdAt' ? 'name' : sortField, direction: sortDirection });
        if (search.trim()) params.set('q', search.trim());
        const result = await api.get(`/api/admins?${params}`);
        setRows(result.rows || []);
        setPagination({ page: result.page || targetPage, limit: result.limit || 25, pages: result.pages || 1, total: result.total || 0 });
      } else {
        const params = new URLSearchParams({ page: String(targetPage), limit: '25', sort: sortField, direction: sortDirection });
        if (search.trim()) params.set('q', search.trim());
        if (resource === 'items') {
          if (pageFilter) params.set('filterPage', pageFilter);
          if (sectionFilter) params.set('section', sectionFilter);
        }
        if (resource === 'jobs' && statusFilter) params.set('visible', statusFilter === 'open' ? 'true' : 'false');
        if (resource === 'messages') {
          params.set('kind', 'contact');
          if (statusFilter) params.set('status', statusFilter);
        }
        if (resource === 'applications' && statusFilter) params.set('status', statusFilter);
        const route = resource === 'applications' ? '/api/applications' : resource === 'activity' ? '/api/activity' : `/api/${resource}`;
        const result = await api.get(`${route}?${params}`);
        if (Array.isArray(result)) {
          setRows(result.slice((targetPage - 1) * 25, targetPage * 25));
          setPagination({ page: targetPage, limit: 25, pages: Math.max(1, Math.ceil(result.length / 25)), total: result.length });
        } else {
          setRows(result.rows || []);
          setPagination({ page: result.page || targetPage, limit: result.limit || 25, pages: result.pages || 1, total: result.total || 0 });
        }
      }
      setSelected(new Set());
    } catch (requestError) { setError(messageOf(requestError)); }
    finally { setLoading(false); }
  }, [activeTab, page, search, pageFilter, sectionFilter, statusFilter, sortField, sortDirection]);

  useEffect(() => {
    api.get('/api/me').then((session) => {
      if (session?.csrf) { setCsrf(session.csrf); api.setCsrfToken(session.csrf); }
      setCurrentAdmin(session?.admin || null);
      setLoggedIn(Boolean(session?.admin));
    }).catch(() => setLoggedIn(false)).finally(() => setCheckingSession(false));
  }, []);

  useEffect(() => {
    if (loggedIn && activeTab !== 'overview' && activeTab !== 'media') loadRows(activeTab, page);
  }, [loggedIn, activeTab, page, loadRows]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(''), 4500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!detail && !mediaPicker && !passwordForm) return undefined;
    function dismissDialog(event) {
      if (event.key !== 'Escape') return;
      setDetail(null);
      setMediaPicker('');
      setPasswordForm(null);
    }
    window.addEventListener('keydown', dismissDialog);
    return () => window.removeEventListener('keydown', dismissDialog);
  }, [detail, mediaPicker, passwordForm]);

  async function submitLogin(event) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const session = await api.post('/api/login', { email, password });
      if (session?.csrf) { setCsrf(session.csrf); api.setCsrfToken(session.csrf); }
      setCurrentAdmin({ email }); setLoggedIn(true); setPassword(''); setNotice('Connexion réussie.');
    } catch (requestError) { setError(messageOf(requestError)); }
    finally { setBusy(false); }
  }

  async function logout() {
    try { await api.post('/api/logout', {}); } catch { /* An expired session is already logged out. */ }
    api.setCsrfToken(''); setCsrf(''); setCurrentAdmin(null); setLoggedIn(false); setRows([]); setDraft(null);
  }

  function navigate(tab) {
    setActiveTab(tab); setPage(1); setSearch(''); setPageFilter(''); setSectionFilter(''); setStatusFilter('');
    const ordered = ['items', 'serviceItems', 'portfolioItems', 'jobs', 'contactBoxes', 'socialItems', 'components'].includes(tab);
    setSortField(ordered ? 'sort_order' : 'createdAt');
    setSortDirection(ordered ? 'asc' : 'desc');
    setDraft(null); setError('');
  }

  function openCreate() {
    setEditing(null); setDraft(createDraft(activeTab)); setError('');
  }

  function openEdit(row) {
    const nextDraft = { ...createDraft(activeTab), ...row };
    if (activeTab === 'admins') nextDraft.password = '';
    setEditing(row); setDraft(nextDraft); setError('');
  }

  async function saveDraft() {
    setBusy(true); setError('');
    try {
      if (activeTab === 'settings' || activeTab === 'blocks') await api.post(`/api/${activeTab}`, draft);
      else if (editing) await api.patch(`/api/${activeTab}/${encodeURIComponent(identifier(editing))}`, draft);
      else await api.post(`/api/${activeTab}`, draft);
      setDraft(null); setEditing(null); setNotice('Modifications enregistrées.');
      await loadRows(activeTab, page);
      window.dispatchEvent(new Event('site-content-updated'));
    } catch (requestError) { setError(messageOf(requestError)); }
    finally { setBusy(false); }
  }

  async function uploadPortfolioFolder(files) {
    const uploads = Array.from(files || []);
    const folderName = uploads[0]?.webkitRelativePath?.split('/')[0] || '';
    const slug = folderName.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
    if (!uploads.length || !slug) {
      setError('Le dossier sélectionné ne possède pas de nom de projet valide.');
      return;
    }
    const body = new FormData();
    body.append('slug', slug);
    body.append('paths', JSON.stringify(uploads.map((file) => file.webkitRelativePath)));
    uploads.forEach((file) => body.append('files', file, file.name));
    setUploadingFolder(true);
    setError('');
    try {
      const result = await api.uploadFolder('/api/portfolio/upload-folder', body);
      setDraft((current) => {
        const title = String(current.title || '').trim() ? current.title : folderName;
        return {
          ...current,
          title,
          title_en: String(current.title_en || '').trim() ? current.title_en : title,
          title_fr: String(current.title_fr || '').trim() ? current.title_fr : title,
          tab_type: 'web',
          link_url: result.link_url,
        };
      });
      setNotice(`${result.fileCount} fichier(s) importé(s). Enregistrez le projet pour le publier.`);
    } catch (requestError) {
      setError(messageOf(requestError));
    } finally {
      setUploadingFolder(false);
    }
  }

  async function removeRow(row = deleteTarget) {
    if (!row) return;
    setBusy(true); setError('');
    try {
      if (activeTab === 'settings') await api.post(`/api/settings?a=delete&skey=${encodeURIComponent(row.skey)}`, {});
      else if (activeTab === 'blocks') await api.post(`/api/blocks?a=delete&bkey=${encodeURIComponent(row.bkey)}`, {});
      else await api.delete(`/api/${activeTab}/${encodeURIComponent(identifier(row))}`);
      setDeleteTarget(null); await loadRows(activeTab, page); setNotice('Élément supprimé.');
      window.dispatchEvent(new Event('site-content-updated'));
    } catch (requestError) { setError(messageOf(requestError)); }
    finally { setBusy(false); }
  }

  async function deleteWithConfirmation(row) {
    const itemName = row.title_fr || row.label_fr || row.name || row.skey || row.bkey || row.title || 'cet élément';
    const confirmed = await requestConfirm({
      title: 'Confirmer la suppression',
      message: 'Supprimer',
      itemName,
      suffix: ' ? Cette action est irréversible.',
      variant: 'danger',
      confirmLabel: 'Supprimer',
    });
    if (!confirmed) return;
    await removeRow(row);
  }

  async function changeStatus(row, status) {
    try {
      if (activeTab === 'applications') await api.patch(`/api/applications/${encodeURIComponent(identifier(row))}`, { status });
      else await api.post(`/api/messages?id=${encodeURIComponent(identifier(row))}`, { id: identifier(row), status });
      await loadRows(activeTab, page); setNotice('Statut mis à jour.');
    } catch (requestError) { setError(messageOf(requestError)); }
  }

  async function toggleVisibility(row) {
    try {
      await api.patch(`/api/${activeTab}/${encodeURIComponent(identifier(row))}`, { visible: !row.visible });
      await loadRows(activeTab, page); setNotice('Visibilité mise à jour.');
    } catch (requestError) { setError(messageOf(requestError)); }
  }

  async function moveRow(row, delta) {
    try {
      const index = rows.findIndex((entry) => String(identifier(entry)) === String(identifier(row)));
      const neighbor = rows[index + delta];
      if (!neighbor) return;
      await Promise.all([
        api.patch(`/api/${activeTab}/${encodeURIComponent(identifier(row))}`, { sort_order: Number(neighbor.sort_order || 0) }),
        api.patch(`/api/${activeTab}/${encodeURIComponent(identifier(neighbor))}`, { sort_order: Number(row.sort_order || 0) }),
      ]);
      await loadRows(activeTab, page); setNotice('Ordre mis à jour.');
    } catch (requestError) { setError(messageOf(requestError)); }
  }

  async function duplicateRow(row) {
    const copy = { ...row };
    delete copy.id; delete copy._id; delete copy.createdAt; delete copy.updatedAt; delete copy.created_at;
    if (activeTab === 'settings') copy.skey = `${row.skey}_copy`;
    if (activeTab === 'blocks') copy.bkey = `${row.bkey}_copy`;
    try {
      if (activeTab === 'settings' || activeTab === 'blocks') await api.post(`/api/${activeTab}`, copy);
      else await api.post(`/api/${activeTab}`, copy);
      await loadRows(activeTab, page); setNotice('Élément dupliqué.');
    } catch (requestError) { setError(messageOf(requestError)); }
  }

  async function bulkAction(action) {
    if (!selected.size) return;
    const confirmed = await requestConfirm({
      title: action === 'delete' ? 'Confirmer la suppression groupée' : 'Confirmer cette action',
      message: action === 'delete' ? `Supprimer définitivement ${selected.size} élément(s) ?` : `Confirmer cette action sur ${selected.size} élément(s) ?`,
      variant: action === 'delete' ? 'danger' : 'warning',
      confirmLabel: action === 'delete' ? 'Supprimer' : 'Confirmer',
    });
    if (!confirmed) return;
    try {
      const endpoint = activeTab === 'applications' ? '/api/applications/bulk' : `/api/${activeTab}/bulk`;
      await api.post(endpoint, { ids: [...selected], action });
      await loadRows(activeTab, page); setNotice('Action groupée effectuée.');
    } catch (requestError) { setError(messageOf(requestError)); }
  }

  function selectRow(id, value) {
    setSelected((current) => {
      const next = new Set(current);
      if (value) next.add(id); else next.delete(id);
      return next;
    });
  }

  async function exportMessages() {
    try {
      const firstPage = await api.get('/api/messages?page=1&limit=100&kind=contact&sort=createdAt&direction=desc');
      const allRows = [...(firstPage.rows || [])];
      for (let currentPage = 2; currentPage <= firstPage.pages; currentPage += 1) {
        const result = await api.get(`/api/messages?page=${currentPage}&limit=100&kind=contact&sort=createdAt&direction=desc`);
        allRows.push(...(result.rows || []));
      }
      const csvCell = (value) => {
        const text = String(value || '').replaceAll('"', '""');
        return /^[\s]*[=+\-@]/.test(text) ? `'${text}` : text;
      };
      const lines = [['Nom', 'E-mail', 'Téléphone', 'Sujet', 'Message', 'Statut', 'Date'], ...allRows.map((row) => [row.name, row.email, row.phone, row.subject, row.body, row.status, row.createdAt].map(csvCell))];
      const csv = lines.map((line) => line.map((value) => `"${value}"`).join(',')).join('\r\n');
      const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })); link.download = 'messages-zayer.csv'; link.click(); URL.revokeObjectURL(link.href);
    } catch (requestError) { setError(messageOf(requestError)); }
  }

  async function changeMyPassword(event) {
    event.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { setError('Les deux nouveaux mots de passe ne correspondent pas.'); return; }
    try {
      await api.post('/api/me/password', { currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      setPasswordForm(null); setError(''); setNotice('Mot de passe modifié.');
    } catch (requestError) { setError(messageOf(requestError)); }
  }

  const columns = config?.columns || [];
  const pageOptions = useMemo(() => [['home', 'Accueil'], ['about', 'À propos'], ['services', 'Services'], ['formation', 'Formation'], ['international', 'International'], ['careers', 'Carrières']], []);

  if (checkingSession) return <main className="admin-wait" aria-live="polite"><style>{pageStyles}{responsiveStyles}</style>Vérification de la session…</main>;

  return <>
    <style>{pageStyles}{responsiveStyles}</style>
    {!loggedIn ? <div id="login">
      <div className="lv">
        <video id="lvid" src="/zayer-intro.mp4" autoPlay muted={videoMuted} loop={videoPlaying} playsInline preload="metadata" />
        <div className="vc"><button type="button" aria-label={videoMuted ? 'Activer le son' : 'Couper le son'} onClick={() => setVideoMuted((value) => !value)}>{videoMuted ? <EyeOff size={17} /> : <Eye size={17} />}</button><button type="button" aria-label={videoPlaying ? 'Mettre en pause' : 'Lire la vidéo'} onClick={() => setVideoPlaying((value) => !value)}>{videoPlaying ? 'Pause' : 'Lire'}</button></div>
        <div className="cap"><i /><h2>Pilote ton site, en toute simplicité.</h2><p>Contenu, offres d’emploi, paramètres et demandes, tout au même endroit.</p></div>
      </div>
      <form className="lc" onSubmit={submitLogin}>
        <h1 className="brand">ZAYER<span>.</span>Digital</h1>
        <div className="hd"><h2>Bon retour parmi nous.</h2><p className="sub">Connecte-toi pour gérer le site ZAYER Digital.</p></div>
        <div className="fld"><label htmlFor="admin-email">Adresse e-mail</label><div className="ip"><Mail size={18} aria-hidden="true" /><input id="admin-email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required /></div></div>
        <div className="fld"><label htmlFor="admin-password">Mot de passe</label><div className="ip"><input id="admin-password" type={passwordVisible ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /><button type="button" className="eye" aria-label={passwordVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} onClick={() => setPasswordVisible((value) => !value)}>{passwordVisible ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></div>
        {error && <p className="err" role="alert">{error}</p>}
        <button className="p" type="submit" disabled={busy}><span>{busy ? 'Connexion…' : 'Se connecter'}</span><ChevronRight size={19} aria-hidden="true" /></button>
        <div className="sec"><Check size={16} aria-hidden="true" /> Connexion sécurisée — accès réservé à l’équipe</div><div className="ft">© ZAYER Digital</div>
      </form>
    </div> : <div id="app">
      <aside>
        <div className="brand">ZAYER<span>.</span><small>Administration</small></div>
        <nav id="tabs" aria-label="Sections">{tabs.map(({ key, label, icon: Icon }) => <button className={activeTab === key ? 'on' : ''} type="button" key={key} onClick={() => navigate(key)}><Icon size={17} aria-hidden="true" /><span>{label}</span>{key === 'messages' && pagination.total > 0 && activeTab === key && <span className="bdg">{pagination.total}</span>}</button>)}</nav>
        <div className="foot"><button type="button" onClick={() => setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })}><Settings size={17} /><span>Mon mot de passe</span></button><button type="button" id="out" onClick={logout}><LogOut size={17} /><span>Déconnexion</span></button></div>
      </aside>
      <main>
        <div className="top"><div><h1>{tabs.find((tab) => tab.key === activeTab)?.label}</h1><p>{currentAdmin?.email || 'Gérez les sections et les demandes du site ZAYER Digital.'}</p></div><div className="cta">
          {activeTab !== 'overview' && activeTab !== 'media' && <button type="button" onClick={() => loadRows(activeTab, page)} disabled={loading}><RefreshCw size={16} /> Actualiser</button>}
          {activeTab === 'messages' && <button type="button" onClick={exportMessages}><DownloadIcon /> Exporter CSV</button>}
          {canEdit && <button type="button" className="p" onClick={openCreate}><Plus size={17} /> Ajouter</button>}
        </div></div>
        {notice && <p className="ok admin-toast" role="status">{notice}<button type="button" aria-label="Fermer" onClick={() => setNotice('')}><X size={14} /></button></p>}
        {error && <p className="bad admin-toast" role="alert">{error}{activeTab !== 'overview' && activeTab !== 'media' && <button type="button" onClick={() => loadRows(activeTab, page)}>Réessayer</button>}</p>}
        {activeTab === 'overview' && <AdminOverview onNavigate={navigate} onError={setError} />}
        {activeTab === 'media' && <MediaLibrary onNotice={setNotice} onError={setError} requestConfirm={requestConfirm} />}
        {activeTab === 'admins' && <section className="admin-account-panel"><h2>Changer mon mot de passe</h2><p>Utilisez un mot de passe unique de 12 caractères minimum.</p><button type="button" onClick={() => setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })}>Modifier mon mot de passe</button></section>}
        {activeTab !== 'overview' && activeTab !== 'media' && <>
          <div className="admin-toolbar">
            <label className="sr"><Search size={16} /><input type="search" value={search} placeholder="Rechercher…" onChange={(event) => { setSearch(event.target.value); setPage(1); }} /></label>
            {activeTab === 'items' && <><select aria-label="Filtrer par page" value={pageFilter} onChange={(event) => { setPageFilter(event.target.value); setPage(1); }}><option value="">Toutes les pages</option>{pageOptions.map(([value, name]) => <option value={value} key={value}>{name}</option>)}</select><input aria-label="Filtrer par section" placeholder="Section…" value={sectionFilter} onChange={(event) => { setSectionFilter(event.target.value); setPage(1); }} /></>}
            {(activeTab === 'messages' || activeTab === 'applications' || activeTab === 'jobs') && <select aria-label="Filtrer par statut" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}><option value="">{activeTab === 'jobs' ? 'Toutes les offres' : 'Tous les statuts'}</option>{(activeTab === 'jobs' ? [['open', 'Ouvertes'], ['closed', 'Fermées']] : activeTab === 'applications' ? [['new', 'Nouvelles'], ['reviewed', 'Étudiées'], ['accepted', 'Acceptées'], ['rejected', 'Refusées']] : [['new', 'Nouveaux'], ['read', 'Lus'], ['done', 'Terminés']]).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select>}
            {activeTab !== 'admins' && <select aria-label="Trier par" value={sortField} onChange={(event) => setSortField(event.target.value)}><option value="createdAt">Date</option><option value="sort_order">Ordre</option><option value="title_fr">Titre FR</option><option value="name">Nom</option><option value="status">Statut</option></select>}
            {activeTab !== 'admins' && <select aria-label="Sens du tri" value={sortDirection} onChange={(event) => setSortDirection(event.target.value)}><option value="desc">Décroissant</option><option value="asc">Croissant</option></select>}
            {supportsBulk && selected.size > 0 && <div className="admin-bulk-actions"><span>{selected.size} sélectionné(s)</span>{supportsBulkVisibility && <><button type="button" onClick={() => bulkAction('show')}>Afficher</button><button type="button" onClick={() => bulkAction('hide')}>Masquer</button></>}<button type="button" className="d" onClick={() => bulkAction('delete')}><Trash2 size={15} /> Supprimer</button></div>}
          </div>
          {loading ? <div className="empty" aria-live="polite">Chargement…</div> : <ResourceTable
            rows={rows} columns={columns} resource={activeTab} selected={selected} onSelect={selectRow}
            canSelect={supportsBulk}             onEdit={canEdit ? openEdit : undefined} onDelete={canDelete ? deleteWithConfirmation : undefined}
            onDuplicate={canEdit && activeTab !== 'admins' ? duplicateRow : undefined} onToggle={['items', 'jobs', 'serviceItems', 'portfolioItems', 'contactBoxes', 'socialItems', 'blocks', 'components'].includes(activeTab) ? toggleVisibility : undefined}
            onMove={['items', 'jobs', 'serviceItems', 'portfolioItems', 'contactBoxes', 'socialItems', 'components'].includes(activeTab) ? moveRow : undefined}
            onStatus={activeTab === 'messages' || activeTab === 'applications' ? changeStatus : undefined}
            onView={activeTab === 'messages' || activeTab === 'applications' ? setDetail : undefined}
          />}
          <div className="admin-pagination"><span>{pagination.total} élément(s) · page {pagination.page} / {Math.max(pagination.pages, 1)}</span><div><button type="button" aria-label="Page précédente" disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft size={17} /></button><button type="button" aria-label="Page suivante" disabled={page >= pagination.pages || loading} onClick={() => setPage((value) => value + 1)}><ChevronRight size={17} /></button></div></div>
        </>}
      </main>
    </div>}
    {draft && <ResourceForm resource={activeTab} draft={draft} editing={editing} error={error} busy={busy} uploadingFolder={uploadingFolder} onChange={(key, value) => setDraft((current) => ({ ...current, [key]: value }))} onSave={saveDraft} onClose={() => { setDraft(null); setEditing(null); }} onPickMedia={setMediaPicker} onFolderUpload={uploadPortfolioFolder} requestConfirm={requestConfirm} />}
    {mediaPicker && <div className="admin-modal-backdrop"><section className="admin-picker-panel" role="dialog" aria-modal="true" aria-label="Choisir un média"><header><h2>Choisir un média</h2><button type="button" onClick={() => setMediaPicker('')}><X /></button></header><MediaLibrary onNotice={setNotice} onError={setError} pickerField={mediaPicker} requestConfirm={requestConfirm} onPick={(field, url) => { setDraft((current) => ({ ...current, [field]: url })); setMediaPicker(''); }} /></section></div>}
    <ConfirmModal
      open={Boolean(confirmState)}
      {...confirmState}
      onCancel={() => finishConfirm(false)}
      onConfirm={() => finishConfirm(true)}
    />
    {detail && <div className="admin-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setDetail(null); }}><section className="admin-detail-panel" role="dialog" aria-modal="true" aria-label="Détails du message"><header><h2>{detail.kind === 'application' ? 'Détails de la candidature' : 'Détails du message'}</h2><button type="button" onClick={() => setDetail(null)}><X /></button></header><dl className="m">{[['Nom', detail.name], ['E-mail', detail.email], ['Téléphone', detail.phone], ['Sujet', detail.subject], ['Message', detail.body], ['Date', detail.createdAt ? new Date(detail.createdAt).toLocaleString('fr-FR') : '']].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || '—'}</dd></div>)}</dl>{detail.file_url && <a href={detail.file_url} target="_blank" rel="noreferrer" download>Télécharger le CV</a>}<a href={`mailto:${encodeURIComponent(detail.email)}?subject=${encodeURIComponent(detail.subject || 'Votre message à ZAYER Digital')}`}>Répondre par e-mail</a></section></div>}
    {passwordForm && <div className="admin-modal-backdrop"><form className="admin-password-panel" onSubmit={changeMyPassword}><header><h2>Modifier mon mot de passe</h2><button type="button" onClick={() => setPasswordForm(null)}><X /></button></header>{[['currentPassword', 'Mot de passe actuel'], ['newPassword', 'Nouveau mot de passe'], ['confirmPassword', 'Confirmer le nouveau mot de passe']].map(([key, label]) => <label key={key}>{label}<input type="password" autoComplete={key === 'currentPassword' ? 'current-password' : 'new-password'} minLength={key === 'currentPassword' ? undefined : 12} required value={passwordForm[key]} onChange={(event) => setPasswordForm((current) => ({ ...current, [key]: event.target.value }))} /></label>)}{error && <p className="err" role="alert">{error}</p>}<footer><button type="button" onClick={() => setPasswordForm(null)}>Annuler</button><button type="submit" className="p"><Save size={16} /> Modifier</button></footer></form></div>}
    <div id="toasts" aria-live="polite">{notice && <div className="ts">{notice}</div>}</div>
  </>;
}

function DownloadIcon() {
  return <Download size={15} aria-hidden="true" />;
}
