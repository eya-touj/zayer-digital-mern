import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Award, Briefcase, MapPin, X } from 'lucide-react';
import { FaFacebookF, FaInstagram, FaLinkedinIn } from 'react-icons/fa';
import { LocalizedText, useLang } from '../context/LangContext';
import CMSComponents from '../components/CMSComponents';
import pageStyles from '../styles/original-careers.css?inline';
import modalStyles from '../styles/careers-modal.css?inline';
import responsiveStyles from '../styles/responsive.css?inline';
import { localizedItem, useSiteContent } from '../context/SiteContentContext';
import { api } from '../lib/api';

const fallbackJobs = [
  { id: 'seo-specialist', dept: 'Marketing', dept_fr: 'Marketing', title_en: 'SEO Specialist', title_fr: 'Spécialiste SEO', location_en: 'Remote / Tunis', location_fr: 'À distance / Tunis', experience: '2+ Years', description_en: 'Develop organic search strategies and help ambitious brands grow through search.', description_fr: 'Développez des stratégies de référencement naturel et accompagnez la croissance des marques.' },
  { id: 'social-media-manager', dept: 'Marketing', dept_fr: 'Marketing', title_en: 'Social Media Manager', title_fr: 'Responsable des réseaux sociaux', location_en: 'Tunis', location_fr: 'Tunis', experience: '1-3 Years', description_en: 'Manage social media content and communities for our clients.', description_fr: 'Gérez les contenus et les communautés de nos clients sur les réseaux sociaux.' },
  { id: 'paid-media', dept: 'Marketing', dept_fr: 'Marketing', title_en: 'Paid Media Manager', title_fr: 'Responsable publicité digitale', location_en: 'Remote', location_fr: 'À distance', experience: '3+ Years', description_en: 'Plan and optimize paid campaigns across Google and Meta.', description_fr: 'Planifiez et optimisez les campagnes payantes sur Google et Meta.' },
  { id: 'graphic-designer', dept: 'Design', dept_fr: 'Design', title_en: 'Graphic Designer', title_fr: 'Designer graphique', location_en: 'Remote / Tunis', location_fr: 'À distance / Tunis', experience: '2+ Years', description_en: 'Create visual identities and digital campaign assets.', description_fr: 'Créez des identités visuelles et des supports de campagnes digitales.' },
  { id: 'wordpress-developer', dept: 'Tech', dept_fr: 'Tech', title_en: 'WordPress Developer', title_fr: 'Développeur WordPress', location_en: 'Remote', location_fr: 'À distance', experience: '2+ Years', description_en: 'Build and maintain fast, accessible WordPress experiences.', description_fr: 'Créez et entretenez des expériences WordPress rapides et accessibles.' },
  { id: 'account-manager', dept: 'Strategy', dept_fr: 'Stratégie', title_en: 'Account Manager', title_fr: 'Responsable de compte', location_en: 'Tunis', location_fr: 'Tunis', experience: '2-4 Years', description_en: 'Coordinate client projects and connect strategy with delivery.', description_fr: 'Coordonnez les projets clients et reliez la stratégie à la réalisation.' },
];

const roleDetails = {
  'seo-specialist': ['Marketing', '2+ years', 'Technical SEO audits', 'Keyword research and content planning', 'On-page optimization and search performance reporting', 'Collaborate with content and web teams', '2+ years SEO experience', 'Comfort with Google Search Console and analytics tools', 'Strong analytical and writing skills'],
  'social-media-manager': ['Marketing', '1–3 years', 'Plan monthly social calendars', 'Create and publish platform-native content', 'Manage community conversations', 'Track reach, engagement, and campaign performance', '1–3 years managing social channels', 'Excellent writing and visual judgment', 'Experience with Instagram, TikTok, Facebook, and LinkedIn'],
  'paid-media': ['Marketing', '3+ years', 'Build and optimize Google and Meta campaigns', 'Manage budgets, audiences, and testing plans', 'Report on spend, leads, and return on investment', 'Share actionable recommendations with clients', '3+ years in paid media', 'Hands-on Google Ads and Meta Ads experience', 'Confident with analytics and campaign reporting'],
  'graphic-designer': ['Design', '2+ years', 'Design digital campaign assets and brand materials', 'Develop visual concepts from creative briefs', 'Prepare production-ready files for web and social', 'Present and refine work from feedback', '2+ years of graphic design experience', 'Strong portfolio and command of Adobe or Figma tools', 'Care for typography, layout, and detail'],
  'wordpress-developer': ['Tech', '2+ years', 'Develop responsive WordPress themes and pages', 'Maintain plugins, performance, and security', 'Integrate websites with analytics and marketing tools', 'Troubleshoot and document technical solutions', '2+ years working with WordPress', 'Strong HTML, CSS, JavaScript, and PHP fundamentals', 'Experience with responsive design and accessibility'],
  'account-manager': ['Strategy', '2–4 years', 'Manage day-to-day client communication', 'Turn client goals into briefs and project plans', 'Coordinate creative, media, and web delivery', 'Present progress and identify next opportunities', '2–4 years in account or project management', 'Strong organization and client communication', 'Comfort managing multiple projects and priorities'],
};

const roleCopy = {
  'seo-specialist': ['Help ambitious brands grow through search. Shape practical SEO strategies, find opportunities in data, and turn technical and content insights into measurable organic growth.', 'Accompagnez la croissance des marques gr\u00e2ce au r\u00e9f\u00e9rencement naturel. Construisez des strat\u00e9gies SEO concr\u00e8tes et transformez les donn\u00e9es en croissance organique mesurable.'],
  'social-media-manager': ['Build engaged communities and memorable social content for a varied portfolio of brands.', 'D\u00e9veloppez des communaut\u00e9s engag\u00e9es et des contenus sociaux m\u00e9morables pour des marques vari\u00e9es.'],
  'paid-media': ['Plan, launch, and optimize paid media campaigns that connect clear business goals with efficient acquisition.', 'Concevez, lancez et optimisez des campagnes payantes align\u00e9es sur des objectifs commerciaux clairs.'],
  'graphic-designer': ['Create thoughtful visual identities and digital campaign assets that make each brand distinctive.', 'Cr\u00e9ez des identit\u00e9s visuelles coh\u00e9rentes et des supports de campagne qui rendent chaque marque distinctive.'],
  'wordpress-developer': ['Build and maintain fast, accessible WordPress websites, working closely with design and strategy teams.', 'Cr\u00e9ez et entretenez des sites WordPress rapides et accessibles en lien avec les \u00e9quipes design et strat\u00e9gie.'],
  'account-manager': ['Coordinate client relationships and connect business goals with clear briefs, strong collaboration, and reliable delivery.', 'Coordonnez les relations clients et reliez leurs objectifs \u00e0 des briefs clairs et\u00e0 une ex\u00e9cution fiable.'],
};

const roleFrenchLists = {
  'seo-specialist': [['Audits SEO techniques', 'Recherche de mots-cl\u00e9s et planification \u00e9ditoriale', 'Optimisation des pages et suivi des performances', 'Collaboration avec les \u00e9quipes contenu et web'], ['2 ans ou plus d\u2019exp\u00e9rience en SEO', 'Ma\u00eetrise de Google Search Console et des outils analytics', 'Bonnes capacit\u00e9s d\u2019analyse et de r\u00e9daction']],
  'social-media-manager': [['Planifier les calendriers \u00e9ditoriaux', 'Cr\u00e9er et publier des contenus adapt\u00e9s aux plateformes', 'Animer les communaut\u00e9s', 'Suivre la port\u00e9e, l\u2019engagement et les campagnes'], ['1 \u00e0 3 ans de gestion de r\u00e9seaux sociaux', 'Excellentes qualit\u00e9s \u00e9ditoriales et visuelles', 'Exp\u00e9rience sur Instagram, TikTok, Facebook et LinkedIn']],
  'paid-media': [['Cr\u00e9er et optimiser des campagnes Google et Meta', 'G\u00e9rer les budgets, audiences et plans de test', 'Suivre les d\u00e9penses, prospects et retours', 'Pr\u00e9senter des recommandations concr\u00e8tes aux clients'], ['3 ans ou plus en publicit\u00e9 digitale', 'Exp\u00e9rience pratique avec Google Ads et Meta Ads', 'Ma\u00eetrise de l\u2019analyse et du reporting de campagnes']],
  'graphic-designer': [['Concevoir des supports de campagne et de marque', 'D\u00e9velopper des concepts\u00e0 partir de briefs cr\u00e9atifs', 'Pr\u00e9parer des fichiers pour le web et les r\u00e9seaux sociaux', 'Pr\u00e9senter et affiner les cr\u00e9ations selon les retours'], ['2 ans ou plus d\u2019exp\u00e9rience en design graphique', 'Portfolio solide et ma\u00eetrise d\u2019Adobe ou Figma', 'Sens du d\u00e9tail, de la typographie et de la mise en page']],
  'wordpress-developer': [['D\u00e9velopper des th\u00e8mes et pages WordPress adaptatifs', 'Maintenir les extensions, performances et s\u00e9curit\u00e9', 'Connecter les sites aux outils analytics et marketing', 'R\u00e9soudre les probl\u00e8mes et documenter les solutions'], ['2 ans ou plus sur WordPress', 'Bonnes bases en HTML, CSS, JavaScript et PHP', 'Exp\u00e9rience en conception adaptative et accessibilit\u00e9']],
  'account-manager': [['G\u00e9rer les \u00e9changes quotidiens avec les clients', 'Transformer les objectifs en briefs et plans de projet', 'Coordonner les\u00e9quipes cr\u00e9ation, m\u00e9dia et web', 'Pr\u00e9senter l\u2019avancement et identifier les opportunit\u00e9s'], ['2 \u00e0 4 ans en gestion de comptes ou de projets', 'Sens de l\u2019organisation et aisance relationnelle', 'Capacit\u00e9 \u00e0 g\u00e9rer plusieurs projets et priorit\u00e9s']],
};

export default function Careers() {
  const { lang, setLanguage } = useLang();
  const { jobs } = useSiteContent();
  const [menuOpen, setMenuOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [formStatus, setFormStatus] = useState('');
  const [cvBusy, setCvBusy] = useState(false);
  const [cvStatus, setCvStatus] = useState('');
  const [activeJob, setActiveJob] = useState(null);
  const [application, setApplication] = useState({ name: '', email: '', reason: '', file_url: '', website: '' });
  const [applicationStatus, setApplicationStatus] = useState('');
  const [applicationBusy, setApplicationBusy] = useState(false);
  const [applicationFileBusy, setApplicationFileBusy] = useState(false);
  const [applicationFileStatus, setApplicationFileStatus] = useState('');
  const [jobFilter, setJobFilter] = useState('all');
  const toggleMenu = () => setMenuOpen((open) => !open);
  const closeJobModal = () => setActiveJob(null);
  const openJob = (job) => { setActiveJob(job); setApplication({ name: '', email: '', reason: '', file_url: '', website: '' }); setApplicationStatus(''); setApplicationFileStatus(''); };
  const filterJobs = (key) => setJobFilter(key);
  const availableJobs = (jobs.length ? jobs : fallbackJobs).filter((job) => job.visible !== false);
  const visibleJobs = jobFilter === 'all' ? availableJobs : availableJobs.filter((job) => String(job.dept || '').toLowerCase() === jobFilter.toLowerCase());
  const localizedJob = (job, field) => localizedItem(job, field, lang, job?.[`${field}_en`] || '');
  const localizedDepartment = (job) => localizedJob(job, 'dept') || ({ Marketing: 'Marketing', Design: 'Design', Tech: 'Tech', Strategy: lang === 'fr' ? 'Stratégie' : 'Strategy' })[job?.dept] || (lang === 'fr' ? 'Recrutement' : 'Careers');
  const localizedExperience = (job) => localizedJob(job, 'experience') || (lang === 'fr' ? String(job?.experience || '').replace(/\s*Years?/i, ' ans').replace(/\s*year/i, ' an') : job?.experience || '');
  const handleFormChange = (event) => { const { name, id, value, type, checked } = event.target; setFormData((current) => ({ ...current, [name || id]: type === 'checkbox' ? checked : value })); };
  const handleCvUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setCvBusy(true); setCvStatus(lang === 'fr' ? 'Import du CV…' : 'Uploading CV…');
    try { const result = await api.upload('/api/public/upload', file); setFormData((current) => ({ ...current, file_url: result.url })); setCvStatus(lang === 'fr' ? 'CV prêt à être envoyé.' : 'CV is ready to submit.'); }
    catch (uploadError) { setCvStatus(uploadError.message); event.target.value = ''; }
    finally { setCvBusy(false); }
  };
  const handleFormSubmit = async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (data.get('website')) return;
    const raw = Object.fromEntries(data.entries());
    const payload = { name: raw.name || raw.openName, email: raw.email || raw.openEmail, phone: raw.phone, subject: raw.job_title || 'Job application', body: raw.message || raw.openMessage || raw.body || 'Application submitted through the careers page.', kind: 'application', file_url: raw.file_url || '', website: raw.website || '' };
    setFormStatus('sending');
    try { await api.post('/api/public/message', payload); setFormStatus('sent'); setFormData({}); }
    catch { setFormStatus('error'); }
  };
  const handleApplicationFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setApplicationFileBusy(true);
    setApplicationFileStatus(lang === 'fr' ? 'Import du CV...' : 'Uploading CV...');
    try {
      const result = await api.upload('/api/public/upload', file);
      setApplication((current) => ({ ...current, file_url: result.url }));
      setApplicationFileStatus(lang === 'fr' ? 'CV pret a etre envoye.' : 'CV is ready to submit.');
    } catch (error) {
      setApplicationFileStatus(error.message || (lang === 'fr' ? 'Echec de l’import.' : 'Upload failed.'));
      event.target.value = '';
    } finally { setApplicationFileBusy(false); }
  };
  const submitApplication = async (event) => {
    event.preventDefault();
    if (application.website) return;
    setApplicationBusy(true);
    setApplicationStatus('sending');
    const title = localizedJob(activeJob, 'title');
    try {
      await api.post('/api/public/message', {
        name: application.name,
        email: application.email,
        subject: title,
        job_title: title,
        body: application.reason.trim() || (lang === 'fr' ? `Candidature pour le poste ${title}.` : `Application for the ${title} role.`),
        kind: 'application',
        file_url: application.file_url,
        website: application.website,
      });
      setApplicationStatus('sent');
    } catch { setApplicationStatus('error'); }
    finally { setApplicationBusy(false); }
  };
  useEffect(() => {
    const navbar = document.getElementById('navbar');
    const onScroll = () => navbar?.classList.toggle('scrolled', window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
    const observer = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } }), { threshold: 0.12 }) : null;
    document.querySelectorAll('.reveal').forEach((node) => { node.classList.add('visible'); observer?.observe(node); });
    return () => { window.removeEventListener('scroll', onScroll); observer?.disconnect(); };
  }, []);
  return <><style>{pageStyles}{modalStyles}{responsiveStyles}</style><CMSComponents page="careers" placement="top" />
<section className="page-hero">
  <div className="breadcrumb">
    <Link id="bread1" to="/">
      <LocalizedText page="careers" id="bread1">Home</LocalizedText>
    </Link>
    <span>
      /
    </span>
    <span id="bread2">
      <LocalizedText page="careers" id="bread2">Careers</LocalizedText>
    </span>
  </div>
  <h1 id="hero1">
    <LocalizedText page="careers" id="hero1">Grow Your Career
      <br />
      at{' '}
      <em>
        ZAYER Digital
      </em></LocalizedText>
  </h1>
  <p className="page-hero-sub" id="hero2">
    <LocalizedText page="careers" id="hero2">We're a team of curious, ambitious, and creative people who love what they do. If that sounds like you, we'd love to work together.</LocalizedText>
  </p>
</section>
<section className="culture">
  <div className="culture-grid">
    <div>
      <div className="section-eyebrow" id="culture1">
        <LocalizedText page="careers" id="culture1">Life at ZAYER</LocalizedText>
      </div>
      <h2 className="section-title" id="culture2">
        <LocalizedText page="careers" id="culture2">Where Talent Comes to Thrive</LocalizedText>
      </h2>
      <p className="section-desc" style={{ color: "var(--grey)", margin: "20px 0", lineHeight: "1.7" }} id="culture3">
        <LocalizedText page="careers" id="culture3">We believe the best work comes from people who feel trusted, valued, and inspired. That's why we've built a culture where initiative is rewarded, ideas are heard, and careers are genuinely developed.</LocalizedText>
      </p>
      <div className="perks-grid">
        <div className="perk-item">
          <div>
            <div className="perk-name" id="perk1">
              <LocalizedText page="careers" id="perk1">Remote Flexible</LocalizedText>
            </div>
            <div className="perk-desc" id="perk1d">
              <LocalizedText page="careers" id="perk1d">Work from anywhere with flexible hours.</LocalizedText>
            </div>
          </div>
        </div>
        <div className="perk-item">
          <div>
            <div className="perk-name" id="perk2">
              <LocalizedText page="careers" id="perk2">Learning Budget</LocalizedText>
            </div>
            <div className="perk-desc" id="perk2d">
              <LocalizedText page="careers" id="perk2d">$1,500/year for courses and events.</LocalizedText>
            </div>
          </div>
        </div>
        <div className="perk-item">
          <div>
            <div className="perk-name" id="perk3">
              <LocalizedText page="careers" id="perk3">Performance Bonuses</LocalizedText>
            </div>
            <div className="perk-desc" id="perk3d">
              <LocalizedText page="careers" id="perk3d">Great work is always recognised.</LocalizedText>
            </div>
          </div>
        </div>
        <div className="perk-item">
          <div>
            <div className="perk-name" id="perk4">
              <LocalizedText page="careers" id="perk4">Collaborative Culture</LocalizedText>
            </div>
            <div className="perk-desc" id="perk4d">
              <LocalizedText page="careers" id="perk4d">A close-knit team where everyone's voice matters.</LocalizedText>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div>
      <div style={{ background: "var(--gold)", padding: "40px", textAlign: "center" }}>
        <p style={{ fontSize: "1.2rem", fontFamily: "Playfair Display", color: "var(--navy)" }} id="quote">
          <LocalizedText page="careers" id="quote">"The best place I've ever worked — truly."</LocalizedText>
        </p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "10px" }}>
        <div style={{ background: "var(--navy)", padding: "30px", textAlign: "center" }}>
          <span style={{ fontSize: "2rem", color: "var(--gold)" }}>
            4.9
          </span>
          <p style={{ color: "white" }} id="stat1">
            <LocalizedText page="careers" id="stat1">Employee Satisfaction</LocalizedText>
          </p>
        </div>
        <div style={{ background: "var(--navy)", padding: "30px", textAlign: "center" }}>
          <span style={{ fontSize: "2rem", color: "var(--gold)" }}>
            92%
          </span>
          <p style={{ color: "white" }} id="stat2">
            <LocalizedText page="careers" id="stat2">Staff Retention</LocalizedText>
          </p>
        </div>
      </div>
    </div>
  </div>
</section>
<section className="jobs-section">
  <div className="jobs-header">
    <div>
      <div className="section-eyebrow" id="jobs1">
        <LocalizedText page="careers" id="jobs1">Open Positions</LocalizedText>
      </div>
      <h2 className="section-title" id="jobs2">
        <LocalizedText page="careers" id="jobs2">Join Our Team</LocalizedText>
      </h2>
    </div>
    <span style={{ color: "var(--grey)" }} id="roleCount">
      <LocalizedText page="careers" id="roleCount">6 open roles</LocalizedText>
    </span>
  </div>
  <div className="filter-row dept-filters" role="group" aria-label={lang === 'fr' ? 'Filtrer les postes par département' : 'Filter jobs by department'}>
    <button type="button" className={jobFilter === "all" ? "filter-btn active" : "filter-btn"} aria-pressed={jobFilter === "all"} id="filterAll" onClick={() => filterJobs("all")}>
      <LocalizedText page="careers" id="filterAll">All</LocalizedText>
    </button>
    <button type="button" className={jobFilter === "Marketing" ? "filter-btn active" : "filter-btn"} aria-pressed={jobFilter === "Marketing"} id="filterMarketing" onClick={() => filterJobs("Marketing")}>
      <LocalizedText page="careers" id="filterMarketing">Marketing</LocalizedText>
    </button>
    <button type="button" className={jobFilter === "Design" ? "filter-btn active" : "filter-btn"} aria-pressed={jobFilter === "Design"} id="filterDesign" onClick={() => filterJobs("Design")}>
      <LocalizedText page="careers" id="filterDesign">Design</LocalizedText>
    </button>
    <button type="button" className={jobFilter === "Tech" ? "filter-btn active" : "filter-btn"} aria-pressed={jobFilter === "Tech"} id="filterTech" onClick={() => filterJobs("Tech")}>
      <LocalizedText page="careers" id="filterTech">Tech</LocalizedText>
    </button>
    <button type="button" className={jobFilter === "Strategy" ? "filter-btn active" : "filter-btn"} aria-pressed={jobFilter === "Strategy"} id="filterStrategy" onClick={() => filterJobs("Strategy")}>
      <LocalizedText page="careers" id="filterStrategy">Strategy</LocalizedText>
    </button>
  </div>
  <div className="jobs-list">
    {visibleJobs.map((job) => {
      const title = localizedJob(job, 'title');
      return <div className="job-card" key={job.id || job._id || title} role="button" tabIndex="0" aria-label={title} onClick={() => openJob(job)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') openJob(job); }}>
        <div><div className="job-title">{title}</div><div className="job-meta"><span><MapPin size={14} aria-hidden="true" /> {localizedJob(job, 'location') || (lang === 'fr' ? 'Tunis, Tunisie' : 'Tunis, Tunisia')}</span><span>{localizedExperience(job)}</span></div></div>
        <span className="job-apply">{lang === 'fr' ? 'Postuler' : 'Apply'} <ArrowRight size={15} aria-hidden="true" /></span>
      </div>;
    })}
    {!visibleJobs.length && <p className="section-desc">{lang === 'fr' ? 'Aucune offre ne correspond à ce filtre.' : 'No roles match this filter.'}</p>}
  </div>
</section>
<section className="cv-upload-section">
  <div className="cv-upload-inner">
    <h2 className="cv-upload-title" id="cvTitle">
      <LocalizedText page="careers" id="cvTitle">Don't See the Right Role?</LocalizedText>
    </h2>
    <p className="cv-upload-desc" id="cvDesc">
      <LocalizedText page="careers" id="cvDesc">Send us your CV and tell us what you bring to the table. We're always looking for exceptional talent.</LocalizedText>
    </p>
    <form id="openApplicationForm" onSubmit={handleFormSubmit}>
      <input type="hidden" name="_subject" defaultValue="Open Application - CV Submission" />
      <input type="hidden" name="application_type" defaultValue="open_application" />
      <div style={{ marginBottom: "20px", textAlign: "left" }}>
        <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", textTransform: "uppercase", color: "var(--gold)", marginBottom: "8px" }}>
          {lang === 'fr' ? 'Nom complet *' : 'Full Name *'}
        </label>
        <input type="text" name="name" id="openName" required style={{ width: "100%", padding: "12px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(200,169,110,0.3)", color: "var(--white)", borderRadius: "8px" }} value={formData["name"] || ''} onChange={handleFormChange} />
      </div>
      <div style={{ marginBottom: "20px", textAlign: "left" }}>
        <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", textTransform: "uppercase", color: "var(--gold)", marginBottom: "8px" }}>
          {lang === 'fr' ? 'E-mail *' : 'Email *'}
        </label>
        <input type="email" name="email" id="openEmail" required style={{ width: "100%", padding: "12px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(200,169,110,0.3)", color: "var(--white)", borderRadius: "8px" }} value={formData["email"] || ''} onChange={handleFormChange} />
      </div>
      <div style={{ marginBottom: "20px", textAlign: "left" }}>
        <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", textTransform: "uppercase", color: "var(--gold)", marginBottom: "8px" }}>
          {lang === 'fr' ? 'Pourquoi rejoindre ZAYER ?' : 'Why join ZAYER?'}
        </label>
        <textarea name="message" id="openMessage" rows="3" value={formData.message || ''} onChange={handleFormChange} style={{ width: "100%", padding: "12px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(200,169,110,0.3)", color: "var(--white)", borderRadius: "8px" }}></textarea>
      </div>
      <div style={{ marginBottom: "20px", textAlign: "left" }}>
        <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", textTransform: "uppercase", color: "var(--gold)", marginBottom: "8px" }}>
          {lang === 'fr' ? 'CV (facultatif)' : 'Upload CV (optional)'}
        </label>
        <input type="file" name="cv_file" id="openCvFile" accept="application/pdf,.pdf" onChange={handleCvUpload} disabled={cvBusy} required />
        <input type="hidden" name="file_url" value={formData.file_url || ''} readOnly />
        <p className="upload-status info" role="status">{cvStatus}</p>
      </div>
      <input type="text" name="website" tabIndex="-1" autoComplete="off" aria-hidden="true" style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 }} />
      <div id="openFormStatus" className={`upload-status ${formStatus === 'sent' ? 'success' : formStatus === 'sending' ? 'info' : 'error'}`} role="status" aria-live="polite">{formStatus === 'sent' ? (lang === 'fr' ? 'Votre candidature a été envoyée.' : 'Your application has been submitted.') : formStatus === 'error' ? (lang === 'fr' ? 'Échec de l’envoi. Réessayez.' : 'The application could not be sent. Please try again.') : formStatus === 'sending' ? (lang === 'fr' ? 'Envoi en cours…' : 'Submitting…') : ''}</div>
      <button type="submit" className="cv-submit-btn" disabled={cvBusy || formStatus === 'sending'}>
        {lang === 'fr' ? 'Envoyer ma candidature' : 'Submit Application'} <ArrowRight size={16} aria-hidden="true" />
      </button>
    </form>
  </div>
</section>

{activeJob && (() => {
  const rawKey = String(activeJob.id || activeJob.title_en || activeJob.title || activeJob._id || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const roleKey = rawKey.includes('social') ? 'social-media-manager' : rawKey.includes('paid') ? 'paid-media' : rawKey.includes('graphic') ? 'graphic-designer' : rawKey.includes('wordpress') ? 'wordpress-developer' : rawKey.includes('account') ? 'account-manager' : rawKey;
  const details = roleDetails[roleKey];
  const copy = roleCopy[roleKey];
  const title = localizedJob(activeJob, 'title');
  const responsibilities = details ? (lang === 'fr' ? roleFrenchLists[roleKey]?.[0] || details.slice(2, 6) : details.slice(2, 6)) : [];
  const requirements = details ? (lang === 'fr' ? roleFrenchLists[roleKey]?.[1] || details.slice(6) : details.slice(6)) : [];
  return <div className="modal-overlay open career-modal-overlay" id="modalOverlay" onClick={(event) => { if (event.target === event.currentTarget) closeJobModal(); }}>
    <section className="modal career-application-modal" id="jobModal" role="dialog" aria-modal="true" aria-labelledby="job-modal-title">
      <button className="modal-close" type="button" aria-label={lang === 'fr' ? 'Fermer les détails du poste' : 'Close job details'} onClick={closeJobModal}><X size={20} /></button>
      <p className="career-department">{localizedDepartment(activeJob).toUpperCase()}</p>
      <h2 className="career-modal-title" id="job-modal-title">{title}</h2>
      <div className="career-modal-meta">
        <span><MapPin size={16} aria-hidden="true" />{localizedJob(activeJob, 'location') || (lang === 'fr' ? 'Tunis, Tunisie' : 'Tunis, Tunisia')}</span>
        <span><Briefcase size={16} aria-hidden="true" />{lang === 'fr' ? 'Temps plein' : 'Full-Time'}</span>
        <span><Award size={16} aria-hidden="true" />{localizedExperience(activeJob) || details?.[1] || ''}</span>
      </div>
      <div className="career-modal-section"><h3>{lang === 'fr' ? 'À propos du poste' : 'About the Role'}</h3><p>{localizedJob(activeJob, 'description') || copy?.[lang === 'fr' ? 1 : 0] || ''}</p></div>
      <div className="career-modal-section"><h3>{lang === 'fr' ? 'Responsabilités' : 'Responsibilities'}</h3><ul>{responsibilities.map((item) => <li key={item}><ArrowRight size={15} aria-hidden="true" />{item}</li>)}</ul></div>
      <div className="career-modal-section"><h3>{lang === 'fr' ? 'Profil recherché' : 'Requirements'}</h3><ul>{requirements.map((item) => <li key={item}><ArrowRight size={15} aria-hidden="true" />{item}</li>)}</ul></div>
      <form className="career-modal-form" onSubmit={submitApplication}>
        <h3>{lang === 'fr' ? 'Postuler à cette offre' : 'Apply for This Role'}</h3>
        <div className="career-form-grid">
          <label>{lang === 'fr' ? 'NOM COMPLET *' : 'FULL NAME *'}<input required value={application.name} onChange={(event) => setApplication((current) => ({ ...current, name: event.target.value }))} /></label>
          <label>{lang === 'fr' ? 'E-MAIL *' : 'EMAIL *'}<input type="email" required value={application.email} onChange={(event) => setApplication((current) => ({ ...current, email: event.target.value }))} /></label>
        </div>
        <label>{lang === 'fr' ? 'POURQUOI REJOINDRE ZAYER ?' : 'WHY JOIN ZAYER?'}<textarea rows="4" value={application.reason} onChange={(event) => setApplication((current) => ({ ...current, reason: event.target.value }))} /></label>
          <label className="career-file-label">{lang === 'fr' ? 'CV (PDF, facultatif)' : 'Upload CV (optional)'}<input type="file" accept="application/pdf,.pdf" onChange={handleApplicationFile} disabled={applicationFileBusy} /><span>{applicationFileStatus || (lang === 'fr' ? 'PDF facultatif' : 'Optional PDF')}</span></label>
        <input className="career-honeypot" aria-hidden="true" tabIndex="-1" autoComplete="off" value={application.website} onChange={(event) => setApplication((current) => ({ ...current, website: event.target.value }))} />
        <p className={'career-application-status ' + applicationStatus} role="status" aria-live="polite">{applicationStatus === 'sent' ? (lang === 'fr' ? 'Votre candidature a \u00e9t\u00e9 envoy\u00e9e.' : 'Your application has been submitted.') : applicationStatus === 'error' ? (lang === 'fr' ? '\u00c9chec de l\u2019envoi. R\u00e9essayez.' : 'The application could not be sent. Please try again.') : applicationStatus === 'sending' ? (lang === 'fr' ? 'Envoi en cours\u2026' : 'Submitting?') : ''}</p>
        <button className="career-apply-submit" type="submit" disabled={applicationBusy || applicationFileBusy}>{lang === 'fr' ? 'Envoyer ma candidature' : 'Submit Application'} <ArrowRight size={17} aria-hidden="true" /></button>
      </form>
    </section>
  </div>;
})()}
</>;
}
