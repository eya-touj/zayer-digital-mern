import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Atom, CircleDot, Infinity as InfinityIcon, Sparkles } from 'lucide-react';
import { LocalizedText, useLang } from '../context/LangContext';
import CMSComponents from '../components/CMSComponents';
import pageStyles from '../styles/original-formation.css?inline';
import responsiveStyles from '../styles/responsive.css?inline';
import { useSiteContent } from '../context/SiteContentContext';
import { api } from '../lib/api';

export default function Formation() {
  const { lang, setLanguage } = useLang();
  const { jobs } = useSiteContent();
  const [menuOpen, setMenuOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [formStatus, setFormStatus] = useState('');
  const [activeJob, setActiveJob] = useState(null);
  const [jobFilter, setJobFilter] = useState('all');
  const toggleMenu = () => setMenuOpen((open) => !open);
  const closeJobModal = () => setActiveJob(null);
  const openJob = (key) => setActiveJob(key);
  const filterJobs = (key) => setJobFilter(key);
  const handleFormChange = (event) => { const { name, id, value, type, checked } = event.target; setFormData((current) => ({ ...current, [name || id]: type === 'checkbox' ? checked : value })); };
  const handleFormSubmit = async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (data.get('website')) return;
    const raw = Object.fromEntries(data.entries());
    const payload = { name: raw.firstName ? [raw.firstName, raw.lastName].filter(Boolean).join(' ') : (raw.name || raw.openName), email: raw.email || raw.openEmail, phone: raw.phone, subject: raw.job_title || 'Website enquiry', body: [raw.company ? 'Company: ' + raw.company : '', raw.message || raw.openMessage || raw.body || ''].filter(Boolean).join('\n\n'), kind: raw.openName || raw.application_type ? 'application' : 'contact', file_url: raw.file_url || '', website: raw.website || '' };
    try { await api.post('/api/public/message', payload); setFormStatus('sent'); setFormData({}); event.currentTarget.reset(); }
    catch { setFormStatus('error'); }
  };
  useEffect(() => {
    const navbar = document.getElementById('navbar');
    const onScroll = () => navbar?.classList.toggle('scrolled', window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
    const observer = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } }), { threshold: 0.12 }) : null;
    document.querySelectorAll('.reveal').forEach((node) => { node.classList.add('visible'); observer?.observe(node); });
    return () => { window.removeEventListener('scroll', onScroll); observer?.disconnect(); };
  }, []);
  return <><style>{pageStyles}{responsiveStyles}</style><CMSComponents page="formation" placement="top" />
<main>
  <section className="hero">
    <div className="container hero-layout">
      <div className="hero-content">
        <p className="eyebrow" data-i18n="eyebrow">
          <LocalizedText page="formation" id="eyebrow">ZAYER ACADEMY · PROFESSIONAL TRAINING</LocalizedText>
        </p>
        <h1 data-i18n="heroTitle">
          <LocalizedText page="formation" id="heroTitle">Learn skills.
            <br />
            Build 
            <em>
              your future.
            </em></LocalizedText>
        </h1>
        <p className="hero-copy" data-i18n="heroCopy">
          <LocalizedText page="formation" id="heroCopy">Practical digital training to help you build real skills, work on projects and move forward with confidence.</LocalizedText>
        </p>
        <div className="hero-meta">
          <span className="hero-pill">
            <b>
              <Sparkles size={18} aria-hidden="true" />
            </b>
            <span data-i18n="pill1">
              <LocalizedText page="formation" id="pill1">Practical learning</LocalizedText>
            </span>
          </span>
          <span className="hero-pill">
            <b>
              <ArrowUpRight size={16} aria-hidden="true" />
            </b>
            <span data-i18n="pill2">
              <LocalizedText page="formation" id="pill2">Project-focused</LocalizedText>
            </span>
          </span>
          <span className="hero-pill">
            <b>
              <CircleDot size={18} aria-hidden="true" />
            </b>
            <span data-i18n="pill3">
              <LocalizedText page="formation" id="pill3">Beginner to advanced</LocalizedText>
            </span>
          </span>
        </div>
      </div>
      <div className="tech-stage" role="img" aria-label={lang === 'fr' ? 'Orbite animée de langages, frameworks, outils de développement et agents IA' : 'Animated orbit of programming languages, frameworks, developer tools, and AI agents'}>
        <div className="tech-stage-glow"></div>
        <span className="tech-stage-label top">
          {lang === 'fr' ? 'LANGAGES · FRAMEWORKS' : 'LANGUAGES · FRAMEWORKS'}
        </span>
        <span className="tech-stage-label bottom">
          {lang === 'fr' ? 'OUTILS · AGENTS IA · IDÉES' : 'TOOLS · AI AGENTS · IDEAS'}
        </span>
        <span className="spark s1"></span>
        <span className="spark s2"></span>
        <span className="spark s3"></span>
        <span className="spark s4"></span>
        <div className="orbit-track orbit-outer" aria-hidden="true">
          <div className="orbit-node" style={{ "--angle": "0deg" }}>
            <div className="orbit-counter">
              <div className="tech-card">
                <span className="tech-mark mark-python">
                  Py
                </span>
                <span className="tech-name">
                  Python
                </span>
                <span className="tech-kind">
                  {lang === 'fr' ? 'Langue' : 'Language'}
                </span>
              </div>
            </div>
          </div>
          <div className="orbit-node" style={{ "--angle": "45deg" }}>
            <div className="orbit-counter">
              <div className="tech-card">
                <span className="tech-mark mark-react">
                  <Atom size={24} aria-hidden="true" />
                </span>
                <span className="tech-name">
                  React
                </span>
                <span className="tech-kind">
                  {lang === 'fr' ? 'Framework' : 'Framework'}
                </span>
              </div>
            </div>
          </div>
          <div className="orbit-node" style={{ "--angle": "90deg" }}>
            <div className="orbit-counter">
              <div className="tech-card">
                <span className="tech-mark mark-node">
                  N
                </span>
                <span className="tech-name">
                  Node.js
                </span>
                <span className="tech-kind">
                  {lang === 'fr' ? 'Environnement technique' : 'Runtime'}
                </span>
              </div>
            </div>
          </div>
          <div className="orbit-node" style={{ "--angle": "135deg" }}>
            <div className="orbit-counter">
              <div className="tech-card">
                <span className="tech-mark mark-laravel">
                  L
                </span>
                <span className="tech-name">
                  Laravel
                </span>
                <span className="tech-kind">
                  {lang === 'fr' ? 'Framework' : 'Framework'}
                </span>
              </div>
            </div>
          </div>
          <div className="orbit-node" style={{ "--angle": "180deg" }}>
            <div className="orbit-counter">
              <div className="tech-card">
                <span className="tech-mark mark-github">
                  GH
                </span>
                <span className="tech-name">
                  GitHub
                </span>
                <span className="tech-kind">
                  {lang === 'fr' ? 'Collaboration' : 'Collaboration'}
                </span>
              </div>
            </div>
          </div>
          <div className="orbit-node" style={{ "--angle": "225deg" }}>
            <div className="orbit-counter">
              <div className="tech-card">
                <span className="tech-mark mark-figma">
                  F
                </span>
                <span className="tech-name">
                  Figma
                </span>
                <span className="tech-kind">
                  {lang === 'fr' ? 'UI / UX' : 'UI / UX'}
                </span>
              </div>
            </div>
          </div>
          <div className="orbit-node" style={{ "--angle": "270deg" }}>
            <div className="orbit-counter">
              <div className="tech-card">
                <span className="tech-mark mark-openai">
                  <Sparkles size={24} aria-hidden="true" />
                </span>
                <span className="tech-name">
                  OpenAI
                </span>
                <span className="tech-kind">
                  {lang === 'fr' ? 'Agent IA' : 'AI Agent'}
                </span>
              </div>
            </div>
          </div>
          <div className="orbit-node" style={{ "--angle": "315deg" }}>
            <div className="orbit-counter">
              <div className="tech-card">
                <span className="tech-mark mark-claude">
                  <Sparkles size={18} aria-hidden="true" />
                </span>
                <span className="tech-name">
                  Claude
                </span>
                <span className="tech-kind">
                  {lang === 'fr' ? 'Agent IA' : 'AI Agent'}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="orbit-track orbit-inner" aria-hidden="true">
          <div className="orbit-node" style={{ "--angle": "22.5deg" }}>
            <div className="orbit-counter">
              <div className="tech-card">
                <span className="tech-mark mark-html">
                  5
                </span>
                <span className="tech-name">
                  HTML5
                </span>
                <span className="tech-kind">
                  {lang === 'fr' ? 'Balisage' : 'Markup'}
                </span>
              </div>
            </div>
          </div>
          <div className="orbit-node" style={{ "--angle": "67.5deg" }}>
            <div className="orbit-counter">
              <div className="tech-card">
                <span className="tech-mark mark-css">
                  3
                </span>
                <span className="tech-name">
                  CSS3
                </span>
                <span className="tech-kind">
                  {lang === 'fr' ? 'Styles' : 'Styling'}
                </span>
              </div>
            </div>
          </div>
          <div className="orbit-node" style={{ "--angle": "112.5deg" }}>
            <div className="orbit-counter">
              <div className="tech-card">
                <span className="tech-mark mark-js">
                  JS
                </span>
                <span className="tech-name">
                  JavaScript
                </span>
                <span className="tech-kind">
                  {lang === 'fr' ? 'Langue' : 'Language'}
                </span>
              </div>
            </div>
          </div>
          <div className="orbit-node" style={{ "--angle": "157.5deg" }}>
            <div className="orbit-counter">
              <div className="tech-card">
                <span className="tech-mark mark-ts">
                  TS
                </span>
                <span className="tech-name">
                  TypeScript
                </span>
                <span className="tech-kind">
                  {lang === 'fr' ? 'Langue' : 'Language'}
                </span>
              </div>
            </div>
          </div>
          <div className="orbit-node" style={{ "--angle": "202.5deg" }}>
            <div className="orbit-counter">
              <div className="tech-card">
                <span className="tech-mark mark-vue">
                  V
                </span>
                <span className="tech-name">
                  Vue.js
                </span>
                <span className="tech-kind">
                  {lang === 'fr' ? 'Framework' : 'Framework'}
                </span>
              </div>
            </div>
          </div>
          <div className="orbit-node" style={{ "--angle": "247.5deg" }}>
            <div className="orbit-counter">
              <div className="tech-card">
                <span className="tech-mark mark-vscode">
                  &lt;/&gt;
                </span>
                <span className="tech-name">
                  VS Code
                </span>
                <span className="tech-kind">
                  {lang === 'fr' ? 'Éditeur' : 'Editor'}
                </span>
              </div>
            </div>
          </div>
          <div className="orbit-node" style={{ "--angle": "292.5deg" }}>
            <div className="orbit-counter">
              <div className="tech-card">
                <span className="tech-mark mark-docker">
                  <InfinityIcon size={24} aria-hidden="true" />
                </span>
                <span className="tech-name">
                  Docker
                </span>
                <span className="tech-kind">
                  {lang === 'fr' ? 'DevOps' : 'DevOps'}
                </span>
              </div>
            </div>
          </div>
          <div className="orbit-node" style={{ "--angle": "337.5deg" }}>
            <div className="orbit-counter">
              <div className="tech-card">
                <span className="tech-mark mark-gemini">
                  <Sparkles size={18} aria-hidden="true" />
                </span>
                <span className="tech-name">
                  Gemini
                </span>
                <span className="tech-kind">
                  {lang === 'fr' ? 'Agent IA' : 'AI Agent'}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="ai-core" aria-hidden="true">
          <span className="ai-core-symbol">
            &lt;/&gt;
          </span>
          <strong>
            ZAYER ACADEMY
          </strong>
            <small>
              {lang === 'fr' ? 'Apprendre · Construire · Grandir' : 'Learn · Build · Grow'}
            </small>
        </div>
      </div>
    </div>
  </section>
  <section className="courses" id="courses">
    <div className="container">
      <div className="section-head">
        <div>
          <p className="eyebrow" data-i18n="sectionEyebrow">
            <LocalizedText page="formation" id="sectionEyebrow">OUR TRAINING PROGRAMMES</LocalizedText>
          </p>
          <h2 data-i18n="sectionTitle">
            <LocalizedText page="formation" id="sectionTitle">Choose the skill.
              <br />
              <span>
                Build what’s next.
              </span></LocalizedText>
          </h2>
        </div>
        <p className="section-intro" data-i18n="sectionIntro">
          <LocalizedText page="formation" id="sectionIntro">Three focused programmes designed around practical skills. Choose your path and contact us for details about sessions and registration.</LocalizedText>
        </p>
      </div>
      <div className="course-grid">
        <article className="course-card">
          <div className="course-image">
            <img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=85" alt="Laptop and digital workspace for web development" loading="lazy" />
            <span className="course-number">
              01
            </span>
            <span className="course-tag" data-i18n="tagWeb">
              <LocalizedText page="formation" id="tagWeb">Web Development</LocalizedText>
            </span>
          </div>
          <div className="course-content">
            <h3>
              HTML, CSS &amp; JavaScript
            </h3>
            <p data-i18n="descWeb">
              <LocalizedText page="formation" id="descWeb">Learn to build modern, responsive websites from the ground up: HTML structure, CSS design and interactive JavaScript, with a practical project to apply your skills.</LocalizedText>
            </p>
            <div className="price-row">
              <div>
                <span className="price-label" data-i18n="priceLabel">
                  <LocalizedText page="formation" id="priceLabel">Indicative price</LocalizedText>
                </span>
                <div className="price">
                  450 
                  <small>
                    TND
                  </small>
                </div>
              </div>
            </div>
            <Link className="course-cta" to="/contact?subject=HTML%2C%20CSS%20%26%20JavaScript">
              <span data-i18n="cta">
                <LocalizedText page="formation" id="cta">Ask for details</LocalizedText>
              </span>
              <span aria-hidden="true">
                <ArrowUpRight size={16} aria-hidden="true" />
              </span>
            </Link>
          </div>
        </article>
        <article className="course-card">
          <div className="course-image">
            <img className="course-poster" src="/formation-ia-marwan.jpg" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=85'; }} alt={lang === 'fr' ? "Affiche de la formation de création de contenu par l'Intelligence Artificielle animée par Marwan Slimani" : "Poster for Marwan Slimani's AI-powered content creation training"} loading="lazy" />
            <span className="course-number">
              02
            </span>
            <span className="course-tag">
              {lang === 'fr' ? 'FORMATION PROFESSIONNELLE · IA' : 'PROFESSIONAL TRAINING · AI'}
            </span>
          </div>
          <div className="course-content">
            <h3>{lang === 'fr' ? "Création de contenu par l'Intelligence Artificielle" : 'AI-Powered Content Creation'}</h3>
            <p>{lang === 'fr' ? "Textes, visuels et vidéos : maîtrisez les outils d'IA pour produire un contenu professionnel, plus vite." : 'Text, visuals, and video: master AI tools to produce professional content faster.'}</p>
            <dl className="course-details">
              <div><dt>Dates</dt><dd>{lang === 'fr' ? '30 Oct – 1 Nov 2026 (3 jours)' : 'Oct 30 – Nov 1, 2026 (3 days)'}</dd></div>
              <div><dt>{lang === 'fr' ? 'Lieu' : 'Location'}</dt><dd>{lang === 'fr' ? 'Siège ZAYER — 28 Av. Kheireddine Pacha, Tunis 1073, Tunisie' : 'ZAYER HQ — 28 Av. Kheireddine Pacha, Tunis 1073, Tunisia'}</dd></div>
              <div><dt>{lang === 'fr' ? 'Animée par' : 'Led by'}</dt><dd>{lang === 'fr' ? 'Marwan Slimani (Formateur en création de contenu IA)' : 'Marwan Slimani (AI Content Creation Trainer)'}</dd></div>
              <div><dt>{lang === 'fr' ? 'Contact / Réservation' : 'Contact / Booking'}</dt><dd><a href="tel:+21648131038">+216 48 131 038</a></dd></div>
            </dl>
            <span className="course-seat-badge">{lang === 'fr' ? 'Places limitées' : 'Limited seats'}</span>
            <div className="price-row">
              <div>
                <span className="price-label">{lang === 'fr' ? 'Par personne' : 'Per person'}</span>
                <div className="price">450 <small>TND</small></div>
              </div>
            </div>
            <a className="course-cta" href="tel:+21692150888">
              <span>{lang === 'fr' ? 'Réserver par téléphone' : 'Book by phone'}</span>
              <span aria-hidden="true"><ArrowUpRight size={16} aria-hidden="true" /></span>
            </a>
          </div>
        </article>
        <article className="course-card">
          <div className="course-image">
            <img src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=85" alt="Laptop with code for full-stack MERN development" loading="lazy" />
            <span className="course-number">
              03
            </span>
            <span className="course-tag" data-i18n="tagMern">
              <LocalizedText page="formation" id="tagMern">Full-Stack Development</LocalizedText>
            </span>
          </div>
          <div className="course-content">
            <h3>
              MERN Stack
            </h3>
            <p data-i18n="descMern">
              <LocalizedText page="formation" id="descMern">Build full-stack web applications using MongoDB, Express.js, React and Node.js. Learn how the frontend, backend, APIs and database work together.</LocalizedText>
            </p>
            <div className="price-row">
              <div>
                <span className="price-label" data-i18n="priceLabel">
                  <LocalizedText page="formation" id="priceLabel">Indicative price</LocalizedText>
                </span>
                <div className="price">
                  900 
                  <small>
                    TND
                  </small>
                </div>
              </div>
            </div>
            <Link className="course-cta" to="/contact?subject=MERN%20Stack">
              <span data-i18n="cta">
                <LocalizedText page="formation" id="cta">Ask for details</LocalizedText>
              </span>
              <span aria-hidden="true">
                <ArrowUpRight size={16} aria-hidden="true" />
              </span>
            </Link>
          </div>
        </article>
      </div>
      <p className="price-note" data-i18n="priceNote">
        {lang === 'fr' ? 'La formation IA coûte 450 TND par personne. Contactez-nous pour connaître les tarifs des autres programmes.' : 'The AI training costs 450 TND per person. Contact us for pricing on the other programmes.'}
      </p>
    </div>
  </section>
  <section className="bottom-cta">
    <div className="container">
      <div className="cta-panel">
        <div>
          <h2 data-i18n="ctaTitle">
            <LocalizedText page="formation" id="ctaTitle">Ready to start learning?</LocalizedText>
          </h2>
          <p data-i18n="ctaCopy">
            <LocalizedText page="formation" id="ctaCopy">Tell us what you want to learn and our team will help you find the right programme.</LocalizedText>
          </p>
        </div>
        <Link data-i18n="contactUs" to="/contact">
          <LocalizedText page="formation" id="contactUs">Contact us</LocalizedText><ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </div>
  </section>
</main>

<CMSComponents page="formation" placement="bottom" />
</>;
}
