import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Save, X } from 'lucide-react';

const labelByField = {
  page: 'Page', section: 'Section', sort_order: 'Ordre', visible: 'Visible',
  title_en: 'Titre (anglais)', title_fr: 'Titre (français)', sub_en: 'Sous-titre (anglais)', sub_fr: 'Sous-titre (français)',
  text_en: 'Texte (anglais)', text_fr: 'Texte (français)', meta: 'Méta description', image_url: 'Image', link_url: 'Lien',
  label: 'Libellé', label_en: 'Libellé (anglais)', label_fr: 'Libellé (français)', category_en: 'Catégorie (anglais)', category_fr: 'Catégorie (français)',
  description_en: 'Description (anglais)', description_fr: 'Description (français)', price: 'Prix', tab_type: 'Catégorie',
  title: 'Titre', media_url: 'Image du projet', location_en: 'Lieu (anglais)', location_fr: 'Lieu (français)',
  dept_en: 'Équipe (anglais)', dept_fr: 'Équipe (français)', experience_en: 'Expérience (anglais)', experience_fr: 'Expérience (français)',
  description: 'Description', value_en: 'Valeur (anglais)', value_fr: 'Valeur (français)', value: 'Valeur',
  skey: 'Clé (contact_email, contact_phone, contact_address, seo_title, seo_description)', bkey: 'Clé', href: 'Lien', src: 'Média', alt: 'Texte alternatif', placement: 'Position',
  html_en: 'HTML (anglais)', html_fr: 'HTML (français)', css: 'CSS', icon: 'Icône', url: 'URL',
  name: 'Nom', email: 'E-mail', active: 'Compte actif', password: 'Mot de passe (12 caractères minimum)',
};
const requiredFields = {
  items: ['page', 'section'],
  serviceItems: ['label'],
  portfolioItems: ['title', 'tab_type'],
  jobs: ['title_en', 'title_fr'],
  contactBoxes: ['label', 'value'],
  socialItems: ['label'],
  components: ['page'],
  admins: ['name', 'email'],
};
const resourceLabels = {
  items: 'Contenus de page', serviceItems: 'Services', portfolioItems: 'Portfolio', jobs: 'Offres d’emploi',
  contactBoxes: 'Coordonnées de contact', socialItems: 'Réseaux sociaux', settings: 'Paramètres du site',
  blocks: 'Blocs de contenu', components: 'Composants personnalisés', admins: 'Administrateurs',
};

const selectOptions = {
  page: [['home', 'Accueil'], ['about', 'À propos'], ['services', 'Services'], ['formation', 'Formation'], ['international', 'International'], ['careers', 'Carrières']],
  placement: [['top', 'Haut'], ['bottom', 'Bas']],
  tab_type: [['creative', 'Créatif'], ['web', 'Web'], ['impact', 'Impact']],
};

const isImageField = (key) => ['image_url', 'media_url', 'src'].includes(key);
const typeFor = (key, resource) => {
  if (key === 'visible' || key === 'active') return 'checkbox';
  if (key === 'sort_order' || key === 'price') return 'number';
  if (key === 'password') return 'password';
  if (selectOptions[key]) return 'select';
  if (['text_en', 'text_fr', 'description', 'description_en', 'description_fr', 'value_en', 'value_fr', 'html_en', 'html_fr', 'css'].includes(key)) return 'textarea';
  if (resource === 'admins' && key === 'email') return 'email';
  return 'text';
};

export default function ResourceForm({ resource, draft, editing, error, busy, uploadingFolder = false, onChange, onSave, onClose, onPickMedia, onFolderUpload, requestConfirm }) {
  const [dirty, setDirty] = useState(false);
  const formRef = useRef(null);
  useEffect(() => { formRef.current?.querySelector('input:not([type=checkbox]),textarea,select')?.focus(); }, []);

  async function close() {
    if (uploadingFolder) return;
    if (dirty) {
      const discard = await requestConfirm({
        title: 'Abandonner les modifications ?',
        message: 'Les modifications non enregistrées seront perdues.',
        confirmLabel: 'Abandonner',
        variant: 'warning',
      });
      if (!discard) return;
    }
    onClose();
  }

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape') close();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const keys = Object.keys(draft).filter((key) => key !== 'id' && key !== '_id' && key !== 'seed_key' && key !== 'createdAt' && key !== 'updatedAt' && key !== 'created_at' && !(resource === 'admins' && key === 'passwordHash'));
  return <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
    <form ref={formRef} className="admin-form-panel" role="dialog" aria-modal="true" aria-labelledby="admin-form-title" onSubmit={(event) => { event.preventDefault(); onSave(); }}>
      <header><div><h2 id="admin-form-title">{editing ? 'Modifier' : 'Créer'} — {resourceLabels[resource] || resource}</h2><p>Les champs anglais et français sont gérés séparément.</p></div><button type="button" className="gh" aria-label="Fermer" onClick={close}><X /></button></header>
      <div className="admin-form-grid">
        {keys.map((key) => {
          const type = typeFor(key, resource);
          const required = (requiredFields[resource] || []).includes(key) || ['bkey', 'skey'].includes(key)
            || (resource === 'portfolioItems' && key === 'link_url' && draft.tab_type === 'web')
            || (resource === 'admins' && key === 'password' && !editing);
          const fieldLabel = labelByField[key] || key.replaceAll('_', ' ');
          if (type === 'checkbox') return <label className="chk admin-check" key={key}><input type="checkbox" checked={Boolean(draft[key])} onChange={(event) => { setDirty(true); onChange(key, event.target.checked); }} /><span>{fieldLabel}</span></label>;
          return <label className={`admin-field ${type === 'textarea' ? 'wide' : ''}`} key={key}>
            <span>{fieldLabel}{required ? ' *' : ''}</span>
            {isImageField(key) ? <div className="admin-media-field">
              <input value={draft[key] || ''} readOnly aria-label={fieldLabel} />
              <button type="button" onClick={() => onPickMedia(key)}><ImagePlus size={16} /> Choisir</button>
              {draft[key] && <img src={draft[key]} alt="" />}
            </div> : type === 'textarea' ? <textarea rows={key.startsWith('html') || key === 'css' ? 8 : 4} required={required} value={draft[key] ?? ''} onChange={(event) => { setDirty(true); onChange(key, event.target.value); }} />
              : type === 'select' ? <select required={required} value={draft[key] ?? ''} onChange={(event) => { setDirty(true); onChange(key, event.target.value); }}><option value="">Choisir…</option>{selectOptions[key].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
                : <input type={type} required={required} min={type === 'number' ? '0' : undefined} minLength={key === 'password' ? 12 : undefined} autoComplete={key === 'password' ? 'new-password' : undefined} value={draft[key] ?? ''} onChange={(event) => { setDirty(true); onChange(key, type === 'number' ? event.target.value : event.target.value); }} />}
          </label>;
        })}
        {resource === 'portfolioItems' && <label className="admin-field admin-folder-upload wide">
          <span>Importer un dossier de projet complet depuis le PC (Site web / App)</span>
          <input
            type="file"
            webkitdirectory=""
            directory=""
            multiple
            disabled={uploadingFolder || busy}
            aria-label="Importer un dossier de projet complet depuis le PC"
            onChange={(event) => {
              const files = Array.from(event.target.files || []);
              if (!files.length) return;
              setDirty(true);
              onFolderUpload?.(files);
              event.target.value = '';
            }}
          />
          <small>{uploadingFolder ? 'Importation du projet…' : 'Sélectionnez un dossier contenant un fichier HTML et ses ressources.'}</small>
        </label>}
      </div>
      {error && <p className="err" role="alert">{error}</p>}
      <footer><button type="button" onClick={close} disabled={uploadingFolder}>Annuler</button><button className="p" type="submit" disabled={busy || uploadingFolder}><Save size={16} /> {busy ? 'Enregistrement…' : uploadingFolder ? 'Importation…' : 'Enregistrer'}</button></footer>
    </form>
  </div>;
}
