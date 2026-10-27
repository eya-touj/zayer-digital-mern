import { useState } from 'react';
import { ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api';
import { useLang } from '../context/LangContext';

export default function ContactForm({ kind = 'contact' }) {
  const { lang, t } = useLang();
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', body: '' });
  const [state, setState] = useState({ busy: false, error: '', sent: false });
  const french = lang === 'fr';

  function update(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function submit(event) {
    event.preventDefault();
    setState({ busy: true, error: '', sent: false });
    try {
      await api.post('/api/public/message', { ...form, kind, website: event.currentTarget.website.value });
      setForm({ name: '', email: '', phone: '', subject: '', body: '' });
      setState({ busy: false, error: '', sent: true });
    } catch (error) {
      setState({ busy: false, error: error.message || t('error'), sent: false });
    }
  }

  return <form className="contact-form" onSubmit={submit}>
    <label className="honeypot" aria-hidden="true">Leave this field empty<input tabIndex={-1} autoComplete="off" name="website" /></label>
    <div className="form-grid">
      <label>{t('name')}<input name="name" autoComplete="name" required maxLength={160} value={form.name} onChange={update} /></label>
      <label>{t('email')}<input name="email" type="email" autoComplete="email" required maxLength={190} value={form.email} onChange={update} /></label>
    </div>
    <div className="form-grid">
      <label>{t('phone')}<input name="phone" type="tel" autoComplete="tel" maxLength={60} value={form.phone} onChange={update} /></label>
      <label>{t('subject')}<input name="subject" maxLength={255} value={form.subject} onChange={update} /></label>
    </div>
    <label>{t('message')}<textarea name="body" rows="5" required maxLength={5000} value={form.body} onChange={update} /></label>
    {state.error && <p className="form-feedback error" role="alert">{state.error}</p>}
    {state.sent && <p className="form-feedback success" role="status"><CheckCircle2 size={17} />{t('sent')}</p>}
    <button className="button button-primary" type="submit" disabled={state.busy}>{state.busy ? t('sending') : t('send')} <ArrowUpRight size={17} /></button>
    {kind === 'application' && <p className="form-note">{french ? 'Ajoutez un lien vers votre portfolio ou votre profil dans le message.' : 'Add a link to your portfolio or profile in your message.'}</p>}
  </form>;
}
