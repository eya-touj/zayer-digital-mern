import { useState } from 'react';
import { Mail, MapPin, Phone } from 'lucide-react';
import { FaFacebookF, FaInstagram, FaLinkedinIn } from 'react-icons/fa';
import { useLang } from '../context/LangContext';
import CMSComponents from '../components/CMSComponents';
import pageStyles from '../styles/original-contact.css?inline';
import responsiveStyles from '../styles/responsive.css?inline';
import contactStyles from '../styles/contact-redesign.css?inline';
import { api } from '../lib/api';

const initialFormData = {
  name: '',
  company: '',
  phone: '',
  email: '',
  subject: '',
  message: '',
};

const socialLinks = [
  { label: 'Facebook', href: 'https://www.facebook.com/share/14cvdqFj14f/', Icon: FaFacebookF },
  { label: 'Instagram', href: 'https://www.instagram.com/zayer.digital', Icon: FaInstagram },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/zayer-digital/', Icon: FaLinkedinIn },
];

export default function Contact() {
  const { lang } = useLang();
  const fr = lang === 'fr';
  const [formData, setFormData] = useState(initialFormData);
  const [formStatus, setFormStatus] = useState('');

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    if (event.currentTarget.elements.website.value) return;

    setFormStatus('sending');
    try {
      await api.post('/api/public/message', {
        ...formData,
        subject: formData.subject || (fr ? 'Demande depuis le site web' : 'Website enquiry'),
        body: [formData.company ? `Company: ${formData.company}` : '', formData.message].filter(Boolean).join('\n\n'),
        kind: 'contact',
        website: '',
      });
      setFormData(initialFormData);
      setFormStatus('sent');
    } catch {
      setFormStatus('error');
    }
  };

  return <>
    <style>{pageStyles}{responsiveStyles}{contactStyles}</style>
    <CMSComponents page="contact" placement="top" />
    <main className="contact-page">
      <section className="contact-hero-banner">
        <div className="contact-hero-content">
          <h1>{fr ? 'Contactez-nous' : 'Contact us'}</h1>
          <p>{fr
            ? 'ZAYER Digital est prête à vous accompagner avec la solution digitale adaptée à vos besoins.'
            : 'ZAYER Digital is ready to provide the right digital solution according to your needs.'}</p>
        </div>
      </section>

      <div className="contact-card-wrapper">
        <div className="contact-split-card">
          <section className="contact-info-panel" aria-labelledby="contact-info-heading">
            <h2 id="contact-info-heading">{fr ? 'Entrer en contact' : 'Get in touch'}</h2>
            <p className="contact-info-intro">{fr
              ? 'Notre équipe est à votre écoute pour vous aider à faire avancer vos projets.'
              : 'Our team is here to listen and help move your projects forward.'}</p>

            <div className="contact-info-items">
              <div className="contact-info-item">
                <span className="contact-icon-badge"><MapPin size={21} aria-hidden="true" /></span>
                <div>
                  <h3>{fr ? 'Siège Social' : 'Head Office'}</h3>
                  <p>{fr
                    ? '28 Av. Kheireddine Pacha, Tunis 1073, Tunisie'
                    : '28 Av. Kheireddine Pacha, Tunis 1073, Tunisia'}</p>
                </div>
              </div>

              <div className="contact-info-item">
                <span className="contact-icon-badge"><Mail size={21} aria-hidden="true" /></span>
                <div>
                  <h3>{fr ? 'Écrivez-nous' : 'Email Us'}</h3>
                  <a href="mailto:contact@zayerdigital.tn">contact@zayerdigital.tn</a>
                </div>
              </div>

              <div className="contact-info-item">
                <span className="contact-icon-badge"><Phone size={21} aria-hidden="true" /></span>
                <div>
                  <h3>{fr ? 'Appelez-nous' : 'Call Us'}</h3>
                  <p>{fr ? 'Tél :' : 'Tel:'} <a href="tel:+21648134666">+216 48 134 666</a> / <a href="tel:+21648138020">48 138 020</a></p>
                  <p>{fr ? 'Commercial :' : 'Sales:'} <a href="tel:+21648131021">+216 48 13 10 21</a> / <a href="tel:+21648131026">48 13 10 26</a></p>
                </div>
              </div>
            </div>

            <div className="contact-socials">
              <h3>{fr ? 'Suivez-nous sur les réseaux' : 'Follow our social media'}</h3>
              <div className="contact-social-links">
                {socialLinks.map(({ label, href, Icon }) => <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                ><Icon size={16} aria-hidden="true" /></a>)}
              </div>
            </div>
          </section>

          <section className="contact-form-panel" aria-labelledby="contact-form-heading">
            <h2 id="contact-form-heading">{fr ? 'Envoyez-nous un message' : 'Send us a message'}</h2>
            <form onSubmit={handleFormSubmit}>
              <input
                className="contact-honeypot"
                type="text"
                name="website"
                tabIndex="-1"
                autoComplete="off"
                aria-hidden="true"
              />
              <div className="form-grid-2">
                <div className="contact-form-group">
                  <label htmlFor="contact-name">{fr ? 'Nom' : 'Name'} *</label>
                  <input id="contact-name" name="name" type="text" required autoComplete="name" value={formData.name} onChange={handleFormChange} />
                </div>
                <div className="contact-form-group">
                  <label htmlFor="contact-company">{fr ? 'Entreprise' : 'Company'}</label>
                  <input id="contact-company" name="company" type="text" autoComplete="organization" value={formData.company} onChange={handleFormChange} />
                </div>
              </div>
              <div className="form-grid-2">
                <div className="contact-form-group">
                  <label htmlFor="contact-phone">{fr ? 'Téléphone' : 'Phone'}</label>
                  <input id="contact-phone" name="phone" type="tel" autoComplete="tel" value={formData.phone} onChange={handleFormChange} />
                </div>
                <div className="contact-form-group">
                  <label htmlFor="contact-email">Email *</label>
                  <input id="contact-email" name="email" type="email" required autoComplete="email" value={formData.email} onChange={handleFormChange} />
                </div>
              </div>
              <div className="contact-form-group">
                <label htmlFor="contact-subject">{fr ? 'Sujet' : 'Subject'}</label>
                <input id="contact-subject" name="subject" type="text" value={formData.subject} onChange={handleFormChange} />
              </div>
              <div className="contact-form-group">
                <label htmlFor="contact-message">{fr ? 'Message' : 'Message'} *</label>
                <textarea id="contact-message" name="message" rows="4" required value={formData.message} onChange={handleFormChange}></textarea>
              </div>
              <button className="contact-submit-button" type="submit" disabled={formStatus === 'sending'}>
                {formStatus === 'sending' ? (fr ? 'Envoi en cours…' : 'Sending…') : (fr ? 'Envoyer' : 'Send')}
              </button>
              {formStatus && <p
                className={`contact-form-feedback ${formStatus}`}
                role={formStatus === 'error' ? 'alert' : 'status'}
                aria-live="polite"
              >{formStatus === 'sent'
                ? (fr ? 'Merci, votre message a été envoyé.' : 'Thanks, your message has been sent.')
                : formStatus === 'error'
                  ? (fr ? 'Échec de l’envoi. Réessayez ou contactez-nous par e-mail.' : 'Your message could not be sent. Please try again or email us.')
                  : (fr ? 'Envoi de votre message…' : 'Sending your message…')}</p>}
            </form>
          </section>
        </div>
      </div>

      <CMSComponents page="contact" placement="bottom" />
      <section className="contact-map-section" aria-label={fr ? 'Carte ZAYER Digital' : 'ZAYER Digital Map'}>
        <iframe
          title="ZAYER Digital — 28 Av. Kheireddine Pacha, Tunis 1073"
          src={`https://maps.google.com/maps?q=28+Av.+Kheireddine+Pacha,+Tunis+1073,+Tunisia&hl=${fr ? 'fr' : 'en'}&z=16&output=embed`}
          className="contact-map-iframe"
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />
      </section>
    </main>
  </>;
}
