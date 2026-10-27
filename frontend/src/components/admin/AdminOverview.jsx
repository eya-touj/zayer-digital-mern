import { useEffect, useState } from 'react';
import { Activity, BriefcaseBusiness, Mail, MessageSquare, RefreshCw } from 'lucide-react';
import { api } from '../../lib/api';

const resources = [
  ['items', 'Contenu'], ['serviceItems', 'Services'], ['portfolioItems', 'Portfolio'], ['jobs', 'Offres'], ['messages', 'Messages'],
  ['contactBoxes', 'Contact'], ['socialItems', 'Réseaux'], ['settings', 'Paramètres'], ['blocks', 'Blocs'], ['components', 'Composants'], ['admins', 'Administrateurs'], ['activity', 'Journal d’activité'],
];

export default function AdminOverview({ onNavigate, onError }) {
  const [counts, setCounts] = useState({});
  const [messages, setMessages] = useState([]);
  const [applications, setApplications] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [healthData, ...resourcePages] = await Promise.all([
        api.get('/api/health'),
        ...resources.map(([key]) => api.get(`${key === 'activity' ? '/api/activity' : `/api/${key}`}?page=1&limit=1`)),
        api.get('/api/applications?page=1&limit=5'),
        api.get('/api/applications?page=1&limit=1&status=new'),
        api.get('/api/messages?page=1&limit=5&sort=createdAt&direction=desc&kind=contact'),
      ]);
      const pageData = resourcePages.slice(0, resources.length);
      const appData = resourcePages[resources.length];
      const newAppData = resourcePages[resources.length + 1];
      const messageData = resourcePages[resources.length + 2];
      const next = Object.fromEntries(resources.map(([key], index) => [key, pageData[index]?.total ?? pageData[index]?.length ?? 0]));
      const [visibleItems, hiddenItems, unreadMessages] = await Promise.all([
        api.get('/api/items?page=1&limit=1&visible=true'),
        api.get('/api/items?page=1&limit=1&visible=false'),
        api.get('/api/messages?page=1&limit=1&status=new&kind=contact'),
      ]);
      next.unread = unreadMessages.total || 0;
      next.visible = visibleItems.total || 0;
      next.hidden = hiddenItems.total || 0;
      next.newApplications = newAppData?.total || 0;
      setCounts(next);
      setMessages((messageData?.rows || []).filter((row) => row.kind !== 'application').slice(0, 5));
      setApplications((appData?.rows || []).slice(0, 5));
      setHealth(healthData);
      onError('');
    } catch (error) { onError(error.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  return <section className="admin-overview">
    <div className="admin-overview-heading"><div><h2>Vue d’ensemble</h2><p>Activité récente et état du site.</p></div><button type="button" onClick={load} disabled={loading}><RefreshCw size={16} /> Actualiser</button></div>
    <div className="admin-health"><Activity size={18} /><strong>API opérationnelle</strong><span>Base de données : {health?.dbMode === 'mongodb' ? 'MongoDB' : 'JSON local'}</span><span className="tag ok">En ligne</span></div>
    <div className="admin-overview-stats">
      {resources.map(([key, label]) => <button type="button" className="admin-count-card" key={key} onClick={() => onNavigate(key)}><b>{counts[key] ?? '—'}</b><span>{label}</span></button>)}
      <button type="button" className="admin-count-card" onClick={() => onNavigate('messages')}><b>{counts.unread ?? '—'}</b><span>Messages non lus</span></button>
      <button type="button" className="admin-count-card" onClick={() => onNavigate('applications')}><b>{counts.newApplications ?? '—'}</b><span>Nouvelles candidatures</span></button>
      <div className="admin-count-card"><b>{counts.visible ?? '—'} / {counts.hidden ?? '—'}</b><span>Contenus visibles / masqués</span></div>
    </div>
    <div className="admin-overview-lists">
      <article><header><h3><MessageSquare size={17} /> Derniers messages</h3><button type="button" onClick={() => onNavigate('messages')}>Tout voir</button></header>
        {messages.length ? messages.map((row) => <button type="button" className="admin-recent-item" key={row.id} onClick={() => onNavigate('messages')}><strong>{row.name}</strong><span>{row.subject || row.body}</span><small>{row.createdAt ? new Date(row.createdAt).toLocaleString('fr-FR') : ''}</small></button>) : <p className="hint">Aucun message récent.</p>}
      </article>
      <article><header><h3><BriefcaseBusiness size={17} /> Dernières candidatures</h3><button type="button" onClick={() => onNavigate('applications')}>Tout voir</button></header>
        {applications.length ? applications.map((row) => <button type="button" className="admin-recent-item" key={row.id} onClick={() => onNavigate('applications')}><strong>{row.name}</strong><span>{row.subject || 'Candidature spontanée'}</span><small>{row.createdAt ? new Date(row.createdAt).toLocaleString('fr-FR') : ''}</small></button>) : <p className="hint">Aucune candidature récente.</p>}
      </article>
    </div>
  </section>;
}
