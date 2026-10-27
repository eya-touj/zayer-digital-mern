import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Monitor, ShieldCheck, UsersRound } from 'lucide-react';
import { FaFacebookF, FaInstagram, FaLinkedinIn } from 'react-icons/fa';
import { LocalizedText, useLang } from '../context/LangContext';
import CMSComponents from '../components/CMSComponents';
import pageStyles from '../styles/original-home.css?inline';
import responsiveStyles from '../styles/responsive.css?inline';
import { useSiteContent } from '../context/SiteContentContext';
import { api } from '../lib/api';

export default function Home() {
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
  return <><style>{pageStyles}{responsiveStyles}</style><CMSComponents page="home" placement="top" />
<section className="hero">
  <video className="hero-video" autoPlay muted loop playsInline preload="metadata" aria-hidden="true">
    <source src="/hero-1.mp4" type="video/mp4" />
  </video>
  <div className="hero-video-overlay"></div>
  <div className="hero-bg-pattern"></div>
  <div className="hero-accent"></div>
  <div className="hero-content">
    <div className="hero-eyebrow" id="hero1">
      <LocalizedText page="home" id="hero1">Digital Marketing Agency</LocalizedText>
    </div>
    <h1 id="hero2">
      <LocalizedText page="home" id="hero2">We Build Brands
        <br />
        That{' '}
        <em>
          Dominate
        </em>
        <br />
        Digitally</LocalizedText>
    </h1>
    <p className="hero-sub" id="hero3">
      <LocalizedText page="home" id="hero3">From SEO and paid media to social and branding — ZAYER Digital delivers measurable growth for ambitious businesses ready to lead their market.</LocalizedText>
    </p>
    <div className="hero-actions">
      <Link className="btn-primary" id="hero4" to="/contact">
        <LocalizedText page="home" id="hero4">Start Your Growth</LocalizedText>
      </Link>
      <Link className="btn-ghost" id="hero5" to="/about">
        <LocalizedText page="home" id="hero5">Our Story</LocalizedText>
      </Link>
    </div>
  </div>
  <div className="hero-stats">
    <div className="stat-box">
      <span className="stat-num">
        200+
      </span>
      <span className="stat-label" id="stat1">
        <LocalizedText page="home" id="stat1">Clients Served</LocalizedText>
      </span>
    </div>
    <div className="stat-box">
      <span className="stat-num">
        8×
      </span>
      <span className="stat-label" id="stat2">
        <LocalizedText page="home" id="stat2">Avg. ROI</LocalizedText>
      </span>
    </div>
    <div className="stat-box">
      <span className="stat-num">
        5 Yrs
      </span>
      <span className="stat-label" id="stat3">
        <LocalizedText page="home" id="stat3">Experience</LocalizedText>
      </span>
    </div>
  </div>
</section>
<section className="why-us">
  <div className="why-text reveal">
    <div className="section-eyebrow" id="why1">
      <LocalizedText page="home" id="why1">Why ZAYER Digital</LocalizedText>
    </div>
    <h2 className="section-title" id="why2">
      <LocalizedText page="home" id="why2">Performance You
        <br />
        Can Measure</LocalizedText>
    </h2>
    <p className="why-desc" id="why3">
      <LocalizedText page="home" id="why3">We're not just another agency. Every campaign we run is tied to real KPIs, transparent reporting, and a relentless focus on your bottom line.</LocalizedText>
    </p>
    <Link className="btn-primary" id="why4" to="/about">
      <LocalizedText page="home" id="why4">Meet The Team</LocalizedText>
    </Link>
  </div>
  <div className="features-list reveal" style={{ transitionDelay: "0.2s" }}>
    <div className="feature-item">
      <div className="feature-icon-wrap">
        <Activity size={20} strokeWidth={1.8} aria-hidden="true" />
      </div>
      <div>
        <div className="feature-title" id="f1">
          <LocalizedText page="home" id="f1">Data-Driven Decisions</LocalizedText>
        </div>
        <div className="feature-desc" id="f1d">
          <LocalizedText page="home" id="f1d">Every move we make is backed by analytics, not guesswork. We let data lead strategy.</LocalizedText>
        </div>
      </div>
    </div>
    <div className="feature-item">
      <div className="feature-icon-wrap">
        <UsersRound size={20} strokeWidth={1.8} aria-hidden="true" />
      </div>
      <div>
        <div className="feature-title" id="f2">
          <LocalizedText page="home" id="f2">Dedicated Account Team</LocalizedText>
        </div>
        <div className="feature-desc" id="f2d">
          <LocalizedText page="home" id="f2d">Your dedicated team is always on — responsive, proactive, and fully invested in your success.</LocalizedText>
        </div>
      </div>
    </div>
    <div className="feature-item">
      <div className="feature-icon-wrap">
        <Monitor size={20} strokeWidth={1.8} aria-hidden="true" />
      </div>
      <div>
        <div className="feature-title" id="f3">
          <LocalizedText page="home" id="f3">Full Transparency</LocalizedText>
        </div>
        <div className="feature-desc" id="f3d">
          <LocalizedText page="home" id="f3d">Monthly reports with real numbers. No vanity metrics — only what matters to your business.</LocalizedText>
        </div>
      </div>
    </div>
    <div className="feature-item">
      <div className="feature-icon-wrap">
        <ShieldCheck size={20} strokeWidth={1.8} aria-hidden="true" />
      </div>
      <div>
        <div className="feature-title" id="f4">
          <LocalizedText page="home" id="f4">Proven Track Record</LocalizedText>
        </div>
        <div className="feature-desc" id="f4d">
          <LocalizedText page="home" id="f4d">200+ clients, across industries — e-commerce, hospitality, B2B, retail, and more.</LocalizedText>
        </div>
      </div>
    </div>
  </div>
</section>
<section className="process">
  <div className="section-header">
    <div>
      <div className="section-eyebrow" id="p1">
        <LocalizedText page="home" id="p1">How We Work</LocalizedText>
      </div>
      <h2 className="section-title" id="p2">
        <LocalizedText page="home" id="p2">Our 4-Step Process</LocalizedText>
      </h2>
    </div>
  </div>
  <div className="process-steps">
    <div className="process-step reveal">
      <div className="step-num">
        1
      </div>
      <div className="step-title" id="step1">
        <LocalizedText page="home" id="step1">Discovery &amp; Audit</LocalizedText>
      </div>
      <p className="step-desc" id="step1d">
        <LocalizedText page="home" id="step1d">We deep-dive into your business, audience, and competitors to understand exactly where you stand and where the opportunity lies.</LocalizedText>
      </p>
    </div>
    <div className="process-step reveal" style={{ transitionDelay: "0.15s" }}>
      <div className="step-num">
        2
      </div>
      <div className="step-title" id="step2">
        <LocalizedText page="home" id="step2">Strategy &amp; Planning</LocalizedText>
      </div>
      <p className="step-desc" id="step2d">
        <LocalizedText page="home" id="step2d">We build a custom roadmap with clear milestones, channels, and KPIs — designed for your specific goals and budget.</LocalizedText>
      </p>
    </div>
    <div className="process-step reveal" style={{ transitionDelay: "0.3s" }}>
      <div className="step-num">
        3
      </div>
      <div className="step-title" id="step3">
        <LocalizedText page="home" id="step3">Execute &amp; Optimise</LocalizedText>
      </div>
      <p className="step-desc" id="step3d">
        <LocalizedText page="home" id="step3d">Our team launches campaigns and continuously tests and refines — maximising performance at every step.</LocalizedText>
      </p>
    </div>
    <div className="process-step reveal" style={{ transitionDelay: "0.45s" }}>
      <div className="step-num">
        4
      </div>
      <div className="step-title" id="step4">
        <LocalizedText page="home" id="step4">Report &amp; Scale</LocalizedText>
      </div>
      <p className="step-desc" id="step4d">
        <LocalizedText page="home" id="step4d">Transparent monthly reporting followed by scaling what works — turning wins into sustained, compounding growth.</LocalizedText>
      </p>
    </div>
  </div>
</section>
<section className="cta-banner">
  <h2 id="cta1">
    <LocalizedText page="home" id="cta1">Ready to Grow Your Business Digitally?</LocalizedText>
  </h2>
  <Link className="btn-navy" id="cta2" to="/contact">
    <LocalizedText page="home" id="cta2">Get a Free Strategy Call</LocalizedText>
  </Link>
</section>

<CMSComponents page="home" placement="bottom" />
</>;
}
