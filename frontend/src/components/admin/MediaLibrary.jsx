import { useEffect, useState } from 'react';
import { Check, Copy, ImagePlus, RefreshCw, Trash2, Upload } from 'lucide-react';
import { api } from '../../lib/api';

export default function MediaLibrary({ onNotice, onError, pickerField, onPick, requestConfirm }) {
  const [files, setFiles] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ pages: 1, total: 0 });
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  async function load(targetPage = page) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(targetPage), limit: '24' });
      if (search.trim()) params.set('q', search.trim());
      const result = await api.get(`/api/media?${params}`);
      setFiles(result.rows || []);
      setPagination({ pages: result.pages || 1, total: result.total || 0 });
      onError('');
    }
    catch (error) { onError(error.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(page); }, [page]);

  async function uploadFiles(event) {
    const selected = Array.from(event.target.files || []);
    if (!selected.length) return;
    setBusy(true); onError('');
    try {
      await api.uploadMany('/api/upload', selected);
      onNotice(`${selected.length} fichier(s) importé(s).`);
      setPage(1);
      await load(1);
    } catch (error) { onError(error.message); }
    finally { setBusy(false); event.target.value = ''; }
  }

  async function remove(file) {
    const confirmed = await requestConfirm({
      title: 'Confirmer la suppression',
      message: 'Supprimer',
      itemName: file.name,
      variant: 'danger',
      confirmLabel: 'Supprimer',
    });
    if (!confirmed) return;
    try {
      await api.delete(`/api/media/${encodeURIComponent(file.name)}`);
      setFiles((current) => current.filter((entry) => entry.name !== file.name));
      setPagination((current) => ({ ...current, total: Math.max(0, current.total - 1) }));
      onNotice('Fichier supprimé.');
    } catch (error) {
      onError(error.message === 'media_in_use' ? `Suppression impossible : le fichier est encore utilisé par ${error.resource || 'du contenu'}.` : error.message);
    }
  }

  async function copy(url) {
    try { await navigator.clipboard.writeText(new URL(url, window.location.origin).toString()); onNotice('URL copiée.'); }
    catch (error) { onError(`Copie impossible : ${error.message}`); }
  }

  return <section className="admin-media-library">
    <div className="admin-toolbar"><p>Images, vidéos MP4 et PDF — 8 Mo maximum par fichier.</p><div>
      <input type="search" aria-label="Rechercher un média" placeholder="Rechercher…" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} onKeyDown={(event) => { if (event.key === 'Enter') load(1); }} />
      <button type="button" onClick={() => { setPage(1); load(1); }}>Rechercher</button>
      <button type="button" onClick={() => load(page)} disabled={loading}><RefreshCw size={16} /> Actualiser</button>
      <label className="p admin-upload-button"><Upload size={16} /> {busy ? 'Importation…' : 'Importer des fichiers'}<input type="file" accept="image/*,video/mp4,application/pdf" multiple disabled={busy} onChange={uploadFiles} /></label>
    </div></div>
    {loading ? <p aria-live="polite">Chargement des médias…</p> : files.length === 0 ? <div className="empty"><ImagePlus /><h3>Bibliothèque vide</h3></div> : <div className="admin-media-grid">
      {files.map((file) => {
        const image = /\.(png|jpe?g|gif|webp)$/i.test(file.name);
        const video = /\.mp4$/i.test(file.name);
        return <article className="admin-media-card" key={file.name}>
          <button type="button" className="admin-media-preview" onClick={() => pickerField ? onPick(pickerField, file.url) : undefined} aria-label={`Choisir ${file.name}`}>
            {image ? <img src={file.url} alt={file.name} loading="lazy" /> : video ? <video src={file.url} muted preload="metadata" /> : <span>PDF</span>}
            {pickerField && <span className="admin-media-select"><Check size={16} /> Choisir</span>}
          </button>
          <strong title={file.name}>{file.name}</strong><small>{(file.size / 1024).toFixed(0)} Ko · {new Date(file.modifiedAt).toLocaleDateString('fr-FR')}</small>
          <div><button type="button" className="sm" onClick={() => copy(file.url)}><Copy size={14} /> Copier l’URL</button><button type="button" className="sm d" aria-label={`Supprimer ${file.name}`} onClick={() => remove(file)}><Trash2 size={14} /></button></div>
        </article>;
      })}
    </div>}
    <div className="admin-pagination"><span>{pagination.total} fichier(s) · page {page} / {Math.max(pagination.pages, 1)}</span><div><button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>Précédent</button><button type="button" disabled={page >= pagination.pages || loading} onClick={() => setPage((value) => value + 1)}>Suivant</button></div></div>
    {pickerField && <button type="button" onClick={() => onPick(pickerField, '')}>Effacer la sélection</button>}
  </section>;
}
