import { ArrowDown, ArrowUp, Copy, Download, Eye, EyeOff, Mail, Pencil, Trash2 } from 'lucide-react';

const valueFor = (row, key) => {
  const value = row[key] ?? (key === 'created_at' ? row.createdAt : undefined);
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
  return value == null ? '' : String(value);
};

export default function ResourceTable({
  rows, columns, resource, selected, onSelect, onEdit, onDelete, onDuplicate, onToggle, onMove,
  onStatus, onView, canSelect = true,
}) {
  if (!rows.length) return <div className="empty"><h3>Aucun élément</h3><p>Ajoutez un élément ou modifiez les filtres.</p></div>;
  return <div className="wrap admin-table-wrap"><table>
    <thead><tr>
      {canSelect && <th><span className="sr-only">Sélection</span></th>}
      {columns.map(([key, label]) => <th key={key}>{label}</th>)}
      <th>Actions</th>
    </tr></thead>
    <tbody>{rows.map((row, index) => {
      const id = String(row.id || row._id || row.skey || row.bkey);
      return <tr key={id}>
        {canSelect && <td><input aria-label={`Sélectionner ${id}`} type="checkbox" checked={selected.has(id)} onChange={(event) => onSelect(id, event.target.checked)} /></td>}
        {columns.map(([key, label]) => <td key={key} title={valueFor(row, key)}>
          {key === 'visible' ? <span className={`tag ${row.visible === false ? 'no' : 'ok'}`}>{row.visible === false ? 'Masqué' : 'Visible'}</span>
            : key === 'status' && onStatus ? <select aria-label={`Statut — ${row.name || id}`} value={row.status || 'new'} onChange={(event) => onStatus(row, event.target.value)}>
              {(resource === 'applications' ? [['new', 'Nouveau'], ['reviewed', 'Étudié'], ['accepted', 'Accepté'], ['rejected', 'Refusé']] : [['new', 'Nouveau'], ['read', 'Lu'], ['done', 'Terminé']]).map(([value, name]) => <option key={value} value={value}>{name}</option>)}
            </select>
              : key === 'kind' ? (row.kind === 'application' ? 'Candidature' : 'Contact')
                : valueFor(row, key)}
        </td>)}
        <td className="act">
          {onView && <button className="sm gh" type="button" aria-label="Voir les détails" onClick={() => onView(row)}><Eye size={16} /></button>}
          {row.email && <a className="sm gh admin-icon-link" aria-label="Répondre par e-mail" href={`mailto:${encodeURIComponent(row.email)}?subject=${encodeURIComponent(row.subject || 'Votre message à ZAYER Digital')}`}><Mail size={16} /></a>}
          {row.file_url && <a className="sm gh admin-icon-link" aria-label="Télécharger le CV" href={row.file_url} target="_blank" rel="noreferrer" download><Download size={16} /></a>}
          {onMove && <><button className="sm gh" type="button" aria-label="Monter" disabled={index === 0} onClick={() => onMove(row, -1)}><ArrowUp size={16} /></button><button className="sm gh" type="button" aria-label="Descendre" disabled={index === rows.length - 1} onClick={() => onMove(row, 1)}><ArrowDown size={16} /></button></>}
          {onToggle && typeof row.visible === 'boolean' && <button className="sm gh" type="button" aria-label={row.visible ? 'Masquer' : 'Afficher'} onClick={() => onToggle(row)}>{row.visible ? <EyeOff size={16} /> : <Eye size={16} />}</button>}
          {onEdit && <button className="sm gh" type="button" aria-label="Modifier" onClick={() => onEdit(row)}><Pencil size={16} /></button>}
          {onDuplicate && <button className="sm gh" type="button" aria-label="Dupliquer" onClick={() => onDuplicate(row)}><Copy size={16} /></button>}
          {onDelete && <button className="sm gh d" type="button" aria-label="Supprimer" onClick={() => onDelete(row)}><Trash2 size={16} /></button>}
        </td>
      </tr>;
    })}</tbody>
  </table></div>;
}
