import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, Eye, LogOut, Plus, Trash2 } from 'lucide-react';
import '../styles/devis.css';

const API_BASE = '/devis-api';
const SERVICE_UNAVAILABLE_MESSAGE = 'Le service de devis est momentanément indisponible. Vérifiez votre connexion puis réessayez.';
const STATUSES = [
  ['draft', 'Brouillon'],
  ['sent', 'Envoyé'],
  ['accepted', 'Accepté'],
  ['rejected', 'Refusé'],
];
const APPROVAL_STATUSES = [
  ['pending', 'En attente'],
  ['confirmed', 'Confirmé'],
  ['declined', 'Refusé'],
];
const PAYMENT_STATUSES = [
  ['unpaid', 'Non payé'],
  ['deposit_paid', 'Acompte payé'],
  ['fully_paid', 'Payé intégralement'],
];

async function request(path, { token, ...options } = {}) {
  const headers = new Headers(options.headers || {});
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetchApi(`${API_BASE}${path}`, { ...options, headers });
  if (response.status === 204) return null;
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : await response.text().catch(() => '');

  if (!response.ok) {
    const message = payload && typeof payload === 'object'
      ? payload.detail || payload.message || payload.error
      : payload;
    const error = new Error(message || response.statusText || 'La requête a échoué.');
    error.status = response.status;
    throw error;
  }
  return payload;
}

async function fetchApi(url, options) {
  try {
    return await fetch(url, options);
  } catch (error) {
    if (error?.name === 'AbortError') throw error;
    throw new Error(SERVICE_UNAVAILABLE_MESSAGE);
  }
}

function toArray(payload, keys = []) {
  if (Array.isArray(payload)) return payload;
  for (const key of keys) if (Array.isArray(payload?.[key])) return payload[key];
  return [];
}

function roundMoney(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

function formatMoney(value, currency = 'TND') {
  return `${Number(value || 0).toLocaleString('fr-TN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('fr-FR');
}

function lineTotal(line) {
  if (line.is_free_pack) return 0;
  const includedMonths = Number(line.duree_incluse) || 0;
  const unitPrice = Number(line.unit_price) || 0;
  return includedMonths > 0
    ? includedMonths * unitPrice
    : (Number(line.qte_multiplier) || 1) * unitPrice;
}

function validateLine(line) {
  const includedMonths = Number(line.duree_incluse) || 0;
  if (includedMonths > 0 && line.is_recurring && (Number(line.contract_duration) || 0) <= includedMonths) {
    return `« ${line.description} » : la durée du contrat doit être supérieure au startup pack lorsque le retainer est activé.`;
  }
  if (line.split_bill && includedMonths > 0) {
    const values = Array.isArray(line.split_breakdown) ? line.split_breakdown : [];
    if (values.length !== includedMonths) {
      return `« ${line.description} » : le split doit contenir ${includedMonths} montants, un par mois inclus.`;
    }
    const splitTotal = values.reduce((sum, value) => sum + (Number(value) || 0), 0);
    const packTotal = (Number(line.unit_price) || 0) * includedMonths;
    if (Math.abs(splitTotal - packTotal) > 0.01) {
      return `« ${line.description} » : la somme du split doit être égale au total du pack (${packTotal.toFixed(2)}).`;
    }
  }
  return '';
}

function paymentSummary(netValue, plan, vatMode) {
  let percentages = String(plan || '').split('-').map((part) => Number.parseFloat(part)).filter(Number.isFinite);
  const sum = percentages.reduce((total, part) => total + part, 0);
  if (!percentages.length || percentages.length > 4 || percentages.some((part) => part <= 0) || Math.abs(sum - 100) > 0.01) {
    percentages = [100];
  }

  const net = roundMoney(netValue);
  const vat = vatMode === 'none' ? 0 : roundMoney(net * 0.19);
  const total = roundMoney(net + vat);
  let amounts = [total];

  if (percentages.length > 1) {
    const advance = vatMode === 'advance'
      ? net * percentages[0] / 100 + vat
      : total * percentages[0] / 100;
    const first = Math.min(Math.floor(advance / 10 + 0.5) * 10, total);
    const remaining = roundMoney(total - first);
    const laterPercentages = percentages.slice(1);
    const laterTotal = laterPercentages.reduce((value, part) => value + part, 0);
    amounts = [first];
    laterPercentages.slice(0, -1).forEach((part) => {
      amounts.push(roundMoney(remaining * part / laterTotal));
    });
    amounts.push(roundMoney(remaining - amounts.slice(1).reduce((value, part) => value + part, 0)));
  }

  const payments = percentages.map((percentage, index) => {
    const percent = `${percentage}%`;
    let label;
    if (index === 0) label = `Acompte à la commande (${percent}${vatMode === 'advance' ? ' + TVA' : ''})`;
    else if (percentages.length === 2) label = `Solde à la livraison (${percent})`;
    else label = `${index + 1}e versement — mois ${index + 1} (${percent})`;
    return { label, amount: amounts[index] };
  });

  return { net, vat, total, payments, firstPercent: percentages[0] };
}

function createLine(service) {
  const price = Number(service.default_price) || 0;
  return {
    checked: true,
    description: service.name || service.description || '',
    qte_label: service.default_unit || 'unité',
    qte_multiplier: 1,
    unit_price: price,
    is_recurring: false,
    monthly_price: price,
    start_delay_months: 0,
    duree_incluse: 0,
    split_bill: false,
    split_breakdown: [],
    contract_duration: 0,
    is_free_pack: false,
  };
}

function serializeLine(line, serviceId, isCustom) {
  const includedMonths = Number(line.duree_incluse) || 0;
  const numericServiceId = Number(serviceId);
  return {
    service_id: isCustom || !Number.isFinite(numericServiceId) ? null : numericServiceId,
    description: String(line.description || '').trim(),
    qte_label: includedMonths > 0 ? `${includedMonths} mois` : (line.qte_label || 'unité'),
    qte_multiplier: Number(line.qte_multiplier) || 1,
    unit_price: Number(line.unit_price) || 0,
    is_custom: Boolean(isCustom),
    is_recurring: Boolean(line.is_recurring),
    monthly_price: Number(line.monthly_price) || 0,
    start_delay_months: Number(line.start_delay_months) || 0,
    duree_incluse: includedMonths,
    split_bill: Boolean(line.split_bill),
    split_breakdown: (line.split_breakdown || []).map((value) => Number(value) || 0),
    contract_duration: Number(line.contract_duration) || 0,
    is_free_pack: Boolean(line.is_free_pack),
  };
}

function PackageFields({ item, onChange, currency }) {
  const includedMonths = Number(item.duree_incluse) || 0;
  const packageAmount = lineTotal(item);

  function toggleSplit() {
    if (!item.split_bill && includedMonths > 0) {
      const monthlySplit = Math.round((lineTotal({ ...item, is_free_pack: false }) / includedMonths) * 100) / 100;
      onChange('split_bill', true);
      onChange('split_breakdown', Array.from({ length: includedMonths }, () => monthlySplit));
      return;
    }
    onChange('split_bill', false);
  }

  function updateIncludedMonths(value) {
    const months = Math.max(0, Math.min(120, Number.parseInt(value, 10) || 0));
    onChange('duree_incluse', value);
    if (item.split_bill) {
      const monthlySplit = months > 0
        ? Math.round(((Number(item.unit_price) || 0) * months / months) * 100) / 100
        : 0;
      onChange('split_breakdown', Array.from({ length: months }, () => monthlySplit));
    }
  }

  function updateSplit(index, value) {
    const next = [...(item.split_breakdown || [])];
    next[index] = value;
    onChange('split_breakdown', next);
  }

  return (
    <div className="package-inputs">
      <label className="field-caption">
        Startup pack (mois)
        <input className="small-input" type="number" min="0" max="120" step="1" value={item.duree_incluse} onChange={(event) => updateIncludedMonths(event.target.value)} />
      </label>
      <label className="field-caption">
        Durée contrat (mois)
        <input className="small-input" type="number" min="0" max="240" step="1" value={item.contract_duration} onChange={(event) => onChange('contract_duration', event.target.value)} />
      </label>
      <span className="line-total">= {formatMoney(packageAmount, currency)}</span>
      {item.is_free_pack && includedMonths > 0 && (
        <span className="muted small free-note">Offert — économie : {formatMoney(includedMonths * (Number(item.unit_price) || 0), currency)}</span>
      )}
      <label className="checkbox-label recurring-toggle">
        <input type="checkbox" checked={Boolean(item.is_recurring)} onChange={() => onChange('is_recurring', !item.is_recurring)} />
        <span>Retainer</span>
      </label>
      <label className="checkbox-label recurring-toggle">
        <input type="checkbox" checked={Boolean(item.is_free_pack)} onChange={() => onChange('is_free_pack', !item.is_free_pack)} />
        <span>Gratuit (offert)</span>
      </label>
      {item.is_recurring && (
        <div className="recurring-inputs">
          <label className="field-caption">
            Tarif mensuel retainer
            <input className="small-input" type="number" min="0" step="0.01" value={item.monthly_price} onChange={(event) => onChange('monthly_price', event.target.value)} />
          </label>
          <label className="field-caption">
            Démarrage retainer (mois)
            <input className="small-input" type="number" min="0" step="1" value={item.start_delay_months} onChange={(event) => onChange('start_delay_months', event.target.value)} />
          </label>
        </div>
      )}
      {includedMonths > 0 && (
        <label className="checkbox-label recurring-toggle">
          <input type="checkbox" checked={Boolean(item.split_bill)} onChange={toggleSplit} />
          <span>Répartir le pack sur {includedMonths} mois</span>
        </label>
      )}
      {item.split_bill && includedMonths > 0 && (
        <div className="split-breakdown" aria-label="Répartition mensuelle du pack">
          {(item.split_breakdown || []).map((amount, index) => (
            <label className="split-month" key={index}>
              <span className="muted small">Mois {index + 1}</span>
              <input className="small-input" type="number" min="0" step="0.01" value={amount} onChange={(event) => updateSplit(index, event.target.value)} />
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function LoginForm({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const result = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (!result?.access_token) throw new Error('La réponse de connexion ne contient pas de jeton valide.');
      onLogin(result.access_token, result.user || null);
    } catch (loginError) {
      setError(loginError.message || 'Connexion impossible. Vérifiez vos identifiants.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="center-page">
      <form className="card login-card" onSubmit={submit}>
        <h1>ZAYER Digital</h1>
        <p className="subtitle">Générateur de devis — accès équipe</p>
        <label htmlFor="devis-email">Email</label>
        <input id="devis-email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
        <label htmlFor="devis-password">Mot de passe</label>
        <input id="devis-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        {error && <div className="error" role="alert">{error}</div>}
        <button type="submit" disabled={submitting}>{submitting ? 'Connexion...' : 'Se connecter'}</button>
      </form>
    </main>
  );
}

function QuoteTable({ token, quotes, onRefresh, showAgentColumn = false, title = 'Tous les devis', setError }) {
  async function updateQuote(quote, endpoint, payload) {
    try {
      await request(`/quotes/${encodeURIComponent(quote.id)}/${endpoint}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify(payload),
      });
      await onRefresh();
    } catch (error) {
      setError(error.message || 'La mise à jour du devis a échoué.');
    }
  }

  async function downloadPdf(quote) {
    try {
      const response = await fetchApi(`${API_BASE}/quotes/${encodeURIComponent(quote.id)}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.detail || payload?.message || 'Téléchargement du PDF impossible.');
      }
      const blob = await response.blob();
      const href = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = href;
      link.download = `${quote.devis_number || `devis_${quote.id}`}_${quote.client_name || 'client'}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(href), 5000);
    } catch (error) {
      setError(error.message || 'Téléchargement du PDF impossible.');
    }
  }

  return (
    <section className="card">
      <h2>{title}</h2>
      {quotes.length === 0 ? <p className="muted">Aucun devis pour le moment.</p> : (
        <div className="table-scroll">
          <table className="quotes-table">
            <thead>
              <tr>
                <th>Réf.</th>
                <th>Client</th>
                {showAgentColumn && <th>Agent</th>}
                <th>Total net</th>
                <th>Statut</th>
                <th>Approbation</th>
                <th>Date approb./refus</th>
                <th>Paiement</th>
                <th>1er paiement</th>
                <th>Paiement final</th>
                <th>Date</th>
                <th>PDF</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((quote) => (
                <tr key={quote.id}>
                  <td>{quote.devis_number || quote.id}</td>
                  <td>{quote.client_name || '—'}</td>
                  {showAgentColumn && <td>{quote.created_by_name || '—'}</td>}
                  <td>{Number(quote.total_net || 0).toFixed(2)}</td>
                  <td>
                    <select aria-label={`Statut du devis ${quote.devis_number || quote.id}`} value={quote.status || 'draft'} onChange={(event) => updateQuote(quote, 'status', { status: event.target.value })}>
                      {STATUSES.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                    </select>
                  </td>
                  <td>
                    <select className={`approval-${quote.approval_status || 'pending'}`} aria-label={`Approbation du devis ${quote.devis_number || quote.id}`} value={quote.approval_status || 'pending'} onChange={(event) => updateQuote(quote, 'approval', { approval_status: event.target.value })}>
                      {APPROVAL_STATUSES.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                    </select>
                  </td>
                  <td>{formatDate(quote.approved_at || quote.declined_at)}</td>
                  <td>
                    <select className={`payment-${quote.payment_status || 'unpaid'}`} aria-label={`Paiement du devis ${quote.devis_number || quote.id}`} value={quote.payment_status || 'unpaid'} onChange={(event) => updateQuote(quote, 'payment', { payment_status: event.target.value })}>
                      {PAYMENT_STATUSES.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                    </select>
                  </td>
                  <td>{formatDate(quote.first_payment_at)}</td>
                  <td>{formatDate(quote.final_payment_at)}</td>
                  <td>{formatDate(quote.created_at)}</td>
                  <td><button type="button" className="btn-secondary table-action" onClick={() => downloadPdf(quote)}><Download size={15} aria-hidden="true" /> PDF</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function RetainerCollections({ token, agentId, refreshKey = 0, setError }) {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadCollections = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (agentId) query.set('agent_id', agentId);
      const queryString = query.toString();
      const suffix = queryString ? `?${queryString}` : '';
      const result = await request(`/retainer-collections${suffix}`, { token });
      setCollections(toArray(result, ['items', 'collections', 'retainers']));
    } catch (error) {
      setError(error.message || 'Impossible de charger les retainers.');
    } finally {
      setLoading(false);
    }
  }, [agentId, setError, token]);

  useEffect(() => { loadCollections(); }, [loadCollections, refreshKey]);

  async function toggleCollected(item) {
    try {
      await request(`/retainer-collections/${encodeURIComponent(item.id)}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ is_collected: !item.is_collected }),
      });
      await loadCollections();
    } catch (error) {
      setError(error.message || 'La mise à jour du retainer a échoué.');
    }
  }

  const pending = collections.filter((item) => !item.is_collected);
  const collected = collections.filter((item) => item.is_collected);

  return (
    <section className="card">
      <h2>Retainers à collecter</h2>
      {loading && <p className="muted">Chargement...</p>}
      {!loading && pending.length === 0 && <p className="muted">Aucun retainer en attente de collecte.</p>}
      {!loading && pending.length > 0 && (
        <div className="table-scroll">
          <table className="quotes-table retainer-table">
            <thead><tr><th>Client</th><th>Service</th><th>Mois</th><th>Échéance</th><th>Montant</th><th>Action</th></tr></thead>
            <tbody>
              {pending.map((item) => {
                const dueDate = item.due_date ? new Date(item.due_date) : null;
                const overdue = dueDate && !Number.isNaN(dueDate.getTime()) && dueDate < new Date();
                return (
                  <tr className={overdue ? 'row-overdue' : ''} key={item.id}>
                    <td>{item.client_name || '—'}</td>
                    <td>{item.description || '—'}</td>
                    <td>Mois {item.month_number || '—'}</td>
                    <td>{formatDate(item.due_date)}</td>
                    <td>{formatMoney(item.amount, item.devise || item.currency || 'TND')}</td>
                    <td><button type="button" className="btn-secondary table-action" onClick={() => toggleCollected(item)}>Marquer collecté</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {collected.length > 0 && (
        <details className="optional-section">
          <summary>{collected.length} retainer(s) déjà collecté(s)</summary>
          <div className="table-scroll">
            <table className="quotes-table retainer-table">
              <thead><tr><th>Client</th><th>Service</th><th>Mois</th><th>Collecté le</th><th>Montant</th><th>Action</th></tr></thead>
              <tbody>
                {collected.map((item) => (
                  <tr key={item.id}>
                    <td>{item.client_name || '—'}</td>
                    <td>{item.description || '—'}</td>
                    <td>Mois {item.month_number || '—'}</td>
                    <td>{formatDate(item.collected_at)}</td>
                    <td>{formatMoney(item.amount, item.devise || item.currency || 'TND')}</td>
                    <td><button type="button" className="btn-secondary table-action" onClick={() => toggleCollected(item)}>Annuler</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </section>
  );
}

function QuoteHistory({ token, quotes, refresh, isAdmin, search, setSearch, selectedClient, setSelectedClient, onNewFor, setError }) {
  const [selectedAgent, setSelectedAgent] = useState('');
  const normalize = (value) => String(value || '').trim().toLocaleLowerCase('fr');
  const agents = [...new Set(quotes.map((quote) => quote.created_by_name).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fr'));
  const agentQuotes = quotes.filter((quote) => !selectedAgent || quote.created_by_name === selectedAgent);
  const searchValue = normalize(search);
  const searchedQuotes = agentQuotes.filter((quote) => !searchValue || normalize(quote.client_name).includes(searchValue));
  const clientCounts = searchedQuotes.reduce((counts, quote) => {
    const clientName = quote.client_name || 'Client sans nom';
    counts[clientName] = (counts[clientName] || 0) + 1;
    return counts;
  }, {});
  const clientNames = Object.keys(clientCounts).sort((a, b) => a.localeCompare(b, 'fr'));
  const visibleQuotes = selectedClient
    ? agentQuotes.filter((quote) => normalize(quote.client_name) === normalize(selectedClient))
    : searchedQuotes;
  const selectedQuote = selectedClient && visibleQuotes.find((quote) => normalize(quote.client_name) === normalize(selectedClient));
  const responsable = selectedQuote?.client_responsable || '';

  return (
    <>
      <section className="history-controls">
        <h2>Mes Devis</h2>
        <input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setSelectedClient(''); }} placeholder="Rechercher un client / business..." aria-label="Rechercher un client ou une entreprise" />
        {isAdmin && agents.length > 0 && (
          <label className="filter-agent">
            Filtrer par agent
            <select value={selectedAgent} onChange={(event) => { setSelectedAgent(event.target.value); setSelectedClient(''); }}>
              <option value="">Tous les agents</option>
              {agents.map((agent) => <option value={agent} key={agent}>{agent}</option>)}
            </select>
          </label>
        )}
      </section>
      {!selectedClient && clientNames.length > 0 && (
        <div className="client-filters" aria-label="Filtrer les devis par client">
          {clientNames.map((clientName) => (
            <button type="button" className="btn-secondary" key={clientName} onClick={() => setSelectedClient(clientName)}>
              {clientName} ({clientCounts[clientName]})
            </button>
          ))}
        </div>
      )}
      {selectedClient && (
        <section className="client-history-heading">
          <h3>Historique : {selectedClient} ({visibleQuotes.length})</h3>
          <div className="inline-actions">
            <button type="button" onClick={() => onNewFor(selectedClient, responsable)}><Plus size={16} aria-hidden="true" /> Nouveau devis pour {selectedClient}</button>
            <button type="button" className="btn-secondary" onClick={() => setSelectedClient('')}>Tout afficher</button>
          </div>
        </section>
      )}
      {searchValue && searchedQuotes.length === 0 && (
        <section className="card empty-search">
          <p>Aucun devis pour « {search} ».</p>
          <button type="button" onClick={() => onNewFor(search.trim(), '')}><Plus size={16} aria-hidden="true" /> Nouveau devis pour {search.trim()}</button>
        </section>
      )}
      <QuoteTable token={token} quotes={visibleQuotes} onRefresh={refresh} showAgentColumn={isAdmin} title={selectedClient ? `Devis de ${selectedClient}` : 'Tous les devis'} setError={setError} />
    </>
  );
}

function AgentManagement({ token, setError, refreshKey }) {
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [agentQuotes, setAgentQuotes] = useState([]);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadAgents = useCallback(async () => {
    setLoading(true);
    try {
      const result = await request('/agents', { token });
      setAgents(toArray(result, ['items', 'agents']));
    } catch (error) {
      setError(error.message || 'Impossible de charger les agents.');
    } finally {
      setLoading(false);
    }
  }, [setError, token]);

  useEffect(() => { loadAgents(); }, [loadAgents, refreshKey]);

  async function createAgent(event) {
    event.preventDefault();
    setFormError('');
    setNotice('');
    setSubmitting(true);
    try {
      await request('/agents', {
        method: 'POST',
        token,
        body: JSON.stringify({ full_name: fullName, email, password }),
      });
      setNotice(`Compte créé pour ${fullName} (${email}).`);
      setFullName('');
      setEmail('');
      setPassword('');
      await loadAgents();
    } catch (error) {
      setFormError(error.message || 'La création du compte a échoué.');
    } finally {
      setSubmitting(false);
    }
  }

  async function viewAgent(agent) {
    setSelectedAgent(agent);
    setAgentQuotes([]);
    try {
      const result = await request(`/quotes?agent_id=${encodeURIComponent(agent.id)}`, { token });
      setAgentQuotes(toArray(result, ['items', 'quotes']));
    } catch (error) {
      setError(error.message || 'Impossible de charger les devis de cet agent.');
    }
  }

  async function refreshAgentQuotes() {
    await loadAgents();
    if (selectedAgent) {
      const result = await request(`/quotes?agent_id=${encodeURIComponent(selectedAgent.id)}`, { token });
      setAgentQuotes(toArray(result, ['items', 'quotes']));
    }
  }

  return (
    <div className="agent-management">
      <section className="card">
        <h2>Agents</h2>
        <form className="agent-create-form" onSubmit={createAgent}>
          <h3>Créer un agent</h3>
          <div className="grid-2">
            <label>Nom complet<input value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" required /></label>
            <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label>
          </div>
          <label>Mot de passe<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" required /></label>
          {formError && <div className="error" role="alert">{formError}</div>}
          {notice && <div className="success-note" role="status">{notice}</div>}
          <button type="submit" disabled={submitting}>{submitting ? 'Création...' : 'Créer le compte agent'}</button>
        </form>
        {loading ? <p className="muted">Chargement des agents...</p> : agents.length === 0 ? <p className="muted">Aucun agent enregistré.</p> : (
          <div className="table-scroll">
            <table className="quotes-table agents-table">
              <thead><tr><th>Nom</th><th>Email</th><th>Total devis</th><th>En attente</th><th>Retainers en retard</th><th>Action</th></tr></thead>
              <tbody>
                {agents.map((agent) => (
                  <tr key={agent.id}>
                    <td>{agent.full_name}</td>
                    <td>{agent.email}</td>
                    <td>{agent.total_quotes ?? 0}</td>
                    <td>{agent.pending_approval ?? 0}</td>
                    <td>{agent.overdue_collections ?? 0}</td>
                    <td><button type="button" className="btn-secondary table-action" onClick={() => viewAgent(agent)}><Eye size={15} aria-hidden="true" /> Voir</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {selectedAgent && (
        <>
          <QuoteTable token={token} quotes={agentQuotes} onRefresh={refreshAgentQuotes} title={`Devis de ${selectedAgent.full_name}`} setError={setError} />
          <RetainerCollections token={token} agentId={selectedAgent.id} refreshKey={agentQuotes.length} setError={setError} />
        </>
      )}
    </div>
  );
}

function NewQuoteForm({ services, onCreated, prefill }) {
  const [clientName, setClientName] = useState(prefill?.client_name || '');
  const [clientResponsable, setClientResponsable] = useState(prefill?.client_responsable || '');
  const [statusLabel, setStatusLabel] = useState('');
  const [discount, setDiscount] = useState('0');
  const [paymentPlan, setPaymentPlan] = useState('100');
  const [customPaymentPlan, setCustomPaymentPlan] = useState('');
  const [vatMode, setVatMode] = useState('split');
  const [currency, setCurrency] = useState('TND');
  const [selectedLines, setSelectedLines] = useState({});
  const [customLines, setCustomLines] = useState([]);
  const [objectives, setObjectives] = useState('');
  const [features, setFeatures] = useState('');
  const [phases, setPhases] = useState('');
  const [whyZayer, setWhyZayer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const groupedServices = useMemo(() => services.reduce((groups, service) => {
    const category = service.category || 'Prestations';
    groups[category] ||= [];
    groups[category].push(service);
    return groups;
  }, {}), [services]);

  const selectedQuoteLines = [
    ...Object.entries(selectedLines)
      .filter(([, line]) => line.checked)
      .map(([serviceId, line]) => serializeLine(line, serviceId, false)),
    ...customLines
      .filter((line) => line.description.trim())
      .map((line) => serializeLine(line, null, true)),
  ];
  const subtotal = selectedQuoteLines.reduce((sum, line) => sum + lineTotal(line), 0);
  const discountPercent = Math.min(100, Math.max(0, Number(discount) || 0));
  const discountAmount = roundMoney(subtotal * discountPercent / 100);
  const netTotal = roundMoney(subtotal - discountAmount);
  const effectivePlan = paymentPlan === 'custom' ? customPaymentPlan : paymentPlan;
  const payment = paymentSummary(netTotal, effectivePlan, vatMode);

  function toggleService(service) {
    const key = String(service.id);
    setSelectedLines((current) => {
      if (current[key]?.checked) {
        const next = { ...current };
        delete next[key];
        return next;
      }
      return { ...current, [key]: createLine(service) };
    });
  }

  function updateServiceLine(serviceId, field, value) {
    const key = String(serviceId);
    setSelectedLines((current) => ({ ...current, [key]: { ...current[key], [field]: value } }));
  }

  function addCustomLine() {
    setCustomLines((current) => [...current, {
      description: '', qte_label: 'unité', qte_multiplier: 1, unit_price: 0,
      is_recurring: false, monthly_price: 0, start_delay_months: 0,
      duree_incluse: 0, split_bill: false, split_breakdown: [],
      contract_duration: 0, is_free_pack: false,
    }]);
  }

  function updateCustomLine(index, field, value) {
    setCustomLines((current) => current.map((line, lineIndex) => lineIndex === index ? { ...line, [field]: value } : line));
  }

  function resetForm() {
    setClientName('');
    setClientResponsable('');
    setStatusLabel('');
    setDiscount('0');
    setPaymentPlan('100');
    setCustomPaymentPlan('');
    setVatMode('split');
    setCurrency('TND');
    setSelectedLines({});
    setCustomLines([]);
    setObjectives('');
    setFeatures('');
    setPhases('');
    setWhyZayer('');
    setError('');
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (!clientName.trim()) {
      setError('Le nom du client est requis.');
      return;
    }
    if (selectedQuoteLines.length === 0) {
      setError('Sélectionnez au moins une prestation ou ajoutez une ligne personnalisée.');
      return;
    }
    for (const line of selectedQuoteLines) {
      const lineError = validateLine(line);
      if (lineError) {
        setError(lineError);
        return;
      }
    }

    setSubmitting(true);
    try {
      const result = await onCreated({
        client_name: clientName.trim(),
        client_responsable: clientResponsable.trim(),
        statut: statusLabel.trim(),
        remise_pct: Number(discount) || 0,
        devise: currency,
        tva_mention: 'HT',
        objectifs: objectives.split('\n').map((item) => item.trim()).filter(Boolean),
        pourquoi_zayer: whyZayer,
        fonctionnalites: features.split('\n').map((item) => item.trim()).filter(Boolean),
        phases: phases.split('\n').map((item) => item.trim()).filter(Boolean),
        line_items: selectedQuoteLines,
        paiement: [],
        acompte_pct: payment.firstPercent,
        payment_plan: effectivePlan,
        tva_mode: vatMode,
        acompte_montant: payment.payments[0]?.amount || 0,
        solde_montant: roundMoney(payment.total - (payment.payments[0]?.amount || 0)),
      });
      resetForm();
      return result;
    } catch (submitError) {
      setError(submitError.message || 'La création du devis a échoué.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="card quote-form" onSubmit={submit}>
      <h2>Nouveau devis</h2>
      <div className="grid-2">
        <label>Nom du client *<input value={clientName} onChange={(event) => setClientName(event.target.value)} required /></label>
        <label>Responsable client<input value={clientResponsable} onChange={(event) => setClientResponsable(event.target.value)} /></label>
      </div>
      <div className="grid-2">
        <label>Statut / mention remise (optionnel)<input value={statusLabel} onChange={(event) => setStatusLabel(event.target.value)} placeholder="Ex. : Remise -20%" /></label>
        <label>Devise<select value={currency} onChange={(event) => setCurrency(event.target.value)}><option value="TND">TND</option><option value="EUR">EUR</option><option value="USD">USD</option></select></label>
      </div>

      <h3>Catalogue de prestations</h3>
      {services.length === 0 && <p className="muted">Le catalogue ne contient aucune prestation disponible.</p>}
      {Object.entries(groupedServices).map(([category, categoryServices]) => (
        <div className="catalog-category" key={category}>
          <h4>{category}</h4>
          {categoryServices.map((service) => {
            const key = String(service.id);
            const line = selectedLines[key];
            return (
              <div className={`catalog-row ${line?.checked ? 'checked' : ''}`} key={key}>
                <label className="checkbox-label service-select">
                  <input type="checkbox" checked={Boolean(line?.checked)} onChange={() => toggleService(service)} />
                  <span>{service.name || service.description || `Prestation ${key}`}</span>
                </label>
                {service.description && service.name && <p className="muted small service-description">{service.description}</p>}
                {line?.checked && (
                  <div className="catalog-inputs">
                    <label className="field-caption">Prix unitaire<input className="small-input" type="number" min="0" step="0.01" value={line.unit_price} onChange={(event) => updateServiceLine(key, 'unit_price', event.target.value)} /></label>
                    <label className="field-caption">Quantité<input className="small-input" type="number" min="0.01" step="0.01" value={line.qte_multiplier} onChange={(event) => updateServiceLine(key, 'qte_multiplier', event.target.value)} /></label>
                    <label className="field-caption">Unité<input className="small-input" value={line.qte_label} onChange={(event) => updateServiceLine(key, 'qte_label', event.target.value)} /></label>
                    <span className="line-total">Total : {formatMoney(lineTotal(line), currency)}</span>
                    <PackageFields item={line} onChange={(field, value) => updateServiceLine(key, field, value)} currency={currency} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}

      <h3>Lignes personnalisées</h3>
      {customLines.map((line, index) => (
        <div className="custom-line-card" key={`custom-${index}`}>
          <div className="custom-line">
            <label>Description<input value={line.description} onChange={(event) => updateCustomLine(index, 'description', event.target.value)} /></label>
            <label>Prix unitaire<input className="small-input" type="number" min="0" step="0.01" value={line.unit_price} onChange={(event) => updateCustomLine(index, 'unit_price', event.target.value)} /></label>
            <label>Quantité<input className="small-input" type="number" min="0.01" step="0.01" value={line.qte_multiplier} onChange={(event) => updateCustomLine(index, 'qte_multiplier', event.target.value)} /></label>
            <label>Unité<input className="small-input" value={line.qte_label} onChange={(event) => updateCustomLine(index, 'qte_label', event.target.value)} /></label>
            <button type="button" className="btn-remove" aria-label={`Supprimer la ligne personnalisée ${index + 1}`} onClick={() => setCustomLines((current) => current.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={16} aria-hidden="true" /></button>
          </div>
          <PackageFields item={line} onChange={(field, value) => updateCustomLine(index, field, value)} currency={currency} />
        </div>
      ))}
      <button type="button" className="btn-secondary" onClick={addCustomLine}><Plus size={16} aria-hidden="true" /> Ajouter une ligne</button>

      <details className="optional-section">
        <summary>Contenu optionnel du PDF (objectifs, fonctionnalités, phases...)</summary>
        <label>Objectifs client (une ligne par élément)<textarea rows="3" value={objectives} onChange={(event) => setObjectives(event.target.value)} /></label>
        <label>Pourquoi ZAYER Digital (texte libre)<textarea rows="2" value={whyZayer} onChange={(event) => setWhyZayer(event.target.value)} /></label>
        <label>Fonctionnalités incluses (une ligne par élément)<textarea rows="3" value={features} onChange={(event) => setFeatures(event.target.value)} /></label>
        <label>Phases du projet (une ligne par élément)<textarea rows="3" value={phases} onChange={(event) => setPhases(event.target.value)} /></label>
      </details>

      <div className="grid-2 payment-settings">
        <label>Remise (%)<input type="number" min="0" max="100" step="1" value={discount} onChange={(event) => setDiscount(event.target.value)} /></label>
        <div>
          <label htmlFor="payment-plan">Échéancier de paiement</label>
          <select id="payment-plan" value={paymentPlan} onChange={(event) => setPaymentPlan(event.target.value)}>
            <option value="100">Paiement unique (100%)</option>
            <option value="50-50">50% / 50%</option>
            <option value="50-25-25">50% / 25% / 25%</option>
            <option value="40-30-30">40% / 30% / 30%</option>
            <option value="custom">Personnalisé...</option>
          </select>
          {paymentPlan === 'custom' && <input aria-label="Échéancier personnalisé" value={customPaymentPlan} onChange={(event) => setCustomPaymentPlan(event.target.value)} placeholder="Ex. : 50-30-20 (total = 100)" />}
          <label htmlFor="vat-mode">TVA 19%</label>
          <select id="vat-mode" value={vatMode} onChange={(event) => setVatMode(event.target.value)}>
            <option value="split">TVA répartie sur les versements</option>
            <option value="advance">TVA payée en totalité à l'acompte</option>
            <option value="none">Sans TVA (HT)</option>
          </select>
        </div>
      </div>

      <div className="totals-box" aria-live="polite">
        <div><span>Sous-total :</span><b>{formatMoney(subtotal, currency)}</b></div>
        <div><span>Remise ({discountPercent}%) :</span><b>-{formatMoney(discountAmount, currency)}</b></div>
        <div className="total-net"><span>TOTAL NET :</span><b>{formatMoney(netTotal, currency)}</b></div>
        {vatMode !== 'none' && <div><span>TVA (19%) :</span><b>{formatMoney(payment.vat, currency)}</b></div>}
        <div><strong>TOTAL {vatMode !== 'none' ? 'TTC' : 'NET'} :</strong><strong>{formatMoney(payment.total, currency)}</strong></div>
        {payment.payments.length > 1 && payment.payments.map((installment, index) => <div className="muted" key={`${installment.label}-${index}`}><span>{installment.label} :</span><b>{formatMoney(installment.amount, currency)}</b></div>)}
      </div>
      {error && <div className="error" role="alert">{error}</div>}
      <button type="submit" disabled={submitting}>{submitting ? 'Création...' : 'Créer le devis et générer le PDF'}</button>
    </form>
  );
}

export default function Devis() {
  const [token, setToken] = useState(() => {
    try { return localStorage.getItem('zayer_token') || ''; } catch { return ''; }
  });
  const [user, setUser] = useState(null);
  const [services, setServices] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [activeTab, setActiveTab] = useState('mine');
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [prefill, setPrefill] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const logout = useCallback(() => {
    try { localStorage.removeItem('zayer_token'); } catch { /* Storage can be unavailable in restricted browsers. */ }
    setToken('');
    setUser(null);
    setServices([]);
    setQuotes([]);
    setActiveTab('mine');
    setError('');
  }, []);

  const refreshWorkspace = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const [serviceResult, quoteResult, userResult] = await Promise.all([
        request('/services', { token }),
        request('/quotes', { token }),
        request('/auth/me', { token }),
      ]);
      setServices(toArray(serviceResult, ['items', 'services']));
      setQuotes(toArray(quoteResult, ['items', 'quotes']));
      setUser(userResult?.user || userResult);
    } catch (workspaceError) {
      setError(workspaceError.message || 'Impossible de charger les données de votre espace.');
      if (workspaceError.status === 401 || workspaceError.status === 403 || workspaceError.message?.toLowerCase().includes('token') || workspaceError.message?.toLowerCase().includes('invalide') || workspaceError.message?.toLowerCase().includes('expired')) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  }, [logout, token]);

  useEffect(() => { if (token) refreshWorkspace(); }, [refreshWorkspace, token]);

  function login(accessToken, loggedInUser) {
    try { localStorage.setItem('zayer_token', accessToken); } catch { /* The current session still works without persistent storage. */ }
    setError('');
    setToken(accessToken);
    if (loggedInUser) setUser(loggedInUser);
  }

  function newQuoteFor(clientName, responsable) {
    setPrefill({ client_name: clientName, client_responsable: responsable || '' });
    setActiveTab('new');
  }

  async function createQuote(payload) {
    setError('');
    setNotice('');
    const quote = await request('/quotes', { method: 'POST', token, body: JSON.stringify(payload) });
    await refreshWorkspace();
    setPrefill(null);
    setSearch('');
    setSelectedClient(quote.client_name || payload.client_name);
    setActiveTab('mine');
    setRefreshKey((value) => value + 1);
    try {
      const response = await fetchApi(`${API_BASE}/quotes/${encodeURIComponent(quote.id)}/pdf`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error('Le devis est créé, mais son PDF n’a pas pu être téléchargé.');
      const blob = await response.blob();
      const href = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = href;
      link.download = `${quote.devis_number || `devis_${quote.id}`}_${quote.client_name || 'client'}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(href), 5000);
      setNotice(`Le devis ${quote.devis_number || ''} a été créé et téléchargé.`.trim());
    } catch (pdfError) {
      setNotice(pdfError.message || 'Le devis est créé. Le téléchargement du PDF a échoué.');
    }
    return quote;
  }

  const isAdmin = user?.role === 'admin';

  if (!token) return <div className="devis-scope"><LoginForm onLogin={login} /></div>;

  return (
    <div className="devis-scope">
      <header className="topbar">
        <h1>ZAYER Digital — Devis</h1>
        <nav className="tab-nav" aria-label="Navigation du générateur de devis">
          <button type="button" className={activeTab === 'new' ? 'tab-active' : 'tab-inactive'} onClick={() => { setPrefill(null); setActiveTab('new'); }}>Nouveau devis</button>
          <button type="button" className={activeTab === 'mine' ? 'tab-active' : 'tab-inactive'} onClick={() => setActiveTab('mine')}>Mes Devis</button>
          {isAdmin && <button type="button" className={activeTab === 'agents' ? 'tab-active' : 'tab-inactive'} onClick={() => setActiveTab('agents')}>Agents</button>}
        </nav>
        <button type="button" className="logout-button" onClick={logout}><LogOut size={16} aria-hidden="true" /> Déconnexion</button>
      </header>

      <main className="container">
        {loading && <p className="muted loading-note" role="status">Chargement de votre espace...</p>}
        {error && <div className="error workspace-error" role="alert">{error}</div>}
        {notice && <div className="success-note workspace-notice" role="status">{notice}</div>}
        {activeTab === 'new' && <NewQuoteForm services={services} prefill={prefill} onCreated={createQuote} />}
        {activeTab === 'mine' && (
          <>
            <QuoteHistory token={token} quotes={quotes} refresh={refreshWorkspace} isAdmin={isAdmin} search={search} setSearch={setSearch} selectedClient={selectedClient} setSelectedClient={setSelectedClient} onNewFor={newQuoteFor} setError={setError} />
            <RetainerCollections token={token} refreshKey={refreshKey + quotes.length} setError={setError} />
          </>
        )}
        {activeTab === 'agents' && isAdmin && <AgentManagement token={token} setError={setError} refreshKey={refreshKey} />}
      </main>
    </div>
  );
}
