import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaFacebookF, FaInstagram, FaLinkedinIn } from 'react-icons/fa';
import { LocalizedText, useLang } from '../context/LangContext';
import CMSComponents from '../components/CMSComponents';
import pageStyles from '../styles/original-about.css?inline';
import responsiveStyles from '../styles/responsive.css?inline';
import { useSiteContent } from '../context/SiteContentContext';
import { api } from '../lib/api';

export default function About() {
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
  return <><style>{pageStyles}{responsiveStyles}</style><CMSComponents page="about" placement="top" />
<main>
  <section className="page-hero">
    <div className="breadcrumb">
      <Link id="bread1" to="/">
        <LocalizedText page="about" id="bread1">Home</LocalizedText>
      </Link>
      <span>
        /
      </span>
      <span id="bread2">
        <LocalizedText page="about" id="bread2">About</LocalizedText>
      </span>
    </div>
    <h1 id="hero1">
      <LocalizedText page="about" id="hero1">The Agency Behind
        <br />
        <em>
          Your Growth
        </em></LocalizedText>
    </h1>
    <p className="page-hero-sub" id="hero2">
      <LocalizedText page="about" id="hero2">We are a team of strategists, creatives, and performance marketers united by one goal — delivering real, measurable growth for the brands we work with.</LocalizedText>
    </p>
  </section>
  <section className="mission">
    <div>
      <div className="mission-box">
        <p className="mission-quote" id="quote">
          <LocalizedText page="about" id="quote">We believe every business deserves a digital presence that works as hard as they do.</LocalizedText>
        </p>
        <div className="mission-author">
          — Zayer Digital, Founded 2020
        </div>
      </div>
      <div className="mission-stats">
        <div className="mstat">
          <span className="mstat-num">
            200+
          </span>
          <span className="mstat-label" id="stat1">
            <LocalizedText page="about" id="stat1">Clients</LocalizedText>
          </span>
        </div>
        <div className="mstat">
          <span className="mstat-num">
            8×
          </span>
          <span className="mstat-label" id="stat2">
            <LocalizedText page="about" id="stat2">Avg. ROI</LocalizedText>
          </span>
        </div>
        <div className="mstat">
          <span className="mstat-num">
            5 Yrs
          </span>
          <span className="mstat-label" id="stat3">
            <LocalizedText page="about" id="stat3">Experience</LocalizedText>
          </span>
        </div>
        <div className="mstat">
          <span className="mstat-num">
            12
          </span>
          <span className="mstat-label" id="stat4">
            <LocalizedText page="about" id="stat4">Team Members</LocalizedText>
          </span>
        </div>
      </div>
    </div>
    <div>
      <div className="section-eyebrow" id="mission1">
        <LocalizedText page="about" id="mission1">Our Mission</LocalizedText>
      </div>
      <h2 className="section-title" id="mission2">
        <LocalizedText page="about" id="mission2">Built to Grow Brands That Matter</LocalizedText>
      </h2>
      <p className="section-desc" id="mission3">
        <LocalizedText page="about" id="mission3">ZAYER Digital was founded with a simple belief: that great digital marketing shouldn't be reserved for enterprise budgets. We bring big-agency thinking with the agility, transparency, and personal investment of a boutique team.</LocalizedText>
      </p>
      <p className="section-desc" id="mission4">
        <LocalizedText page="about" id="mission4">We work with ambitious brands across e-commerce, hospitality, retail, and professional services — building tailored strategies that create lasting competitive advantage.</LocalizedText>
      </p>
    </div>
  </section>
  <section className="values">
    <div className="values-heading">
      <div className="section-eyebrow" id="values1">
        <LocalizedText page="about" id="values1">What Drives Us</LocalizedText>
      </div>
      <h2 className="section-title" id="values2">
        <LocalizedText page="about" id="values2">Our Core Values</LocalizedText>
      </h2>
    </div>
    <div className="values-grid">
      <div className="value-card">
        <div className="value-name" id="val1">
          <LocalizedText page="about" id="val1">Performance First</LocalizedText>
        </div>
        <p className="value-desc" id="val1d">
          <LocalizedText page="about" id="val1d">Every decision we make is tied to measurable outcomes. Vanity metrics don't move businesses forward — results do.</LocalizedText>
        </p>
      </div>
      <div className="value-card">
        <div className="value-name" id="val2">
          <LocalizedText page="about" id="val2">Radical Transparency</LocalizedText>
        </div>
        <p className="value-desc" id="val2d">
          <LocalizedText page="about" id="val2d">We tell you exactly what's working and what isn't. No spin, no jargon — just honest reporting.</LocalizedText>
        </p>
      </div>
      <div className="value-card">
        <div className="value-name" id="val3">
          <LocalizedText page="about" id="val3">Creative Excellence</LocalizedText>
        </div>
        <p className="value-desc" id="val3d">
          <LocalizedText page="about" id="val3d">Great strategy needs great creative. We invest in work that stands out — campaigns your audience will remember.</LocalizedText>
        </p>
      </div>
      <div className="value-card">
        <div className="value-name" id="val4">
          <LocalizedText page="about" id="val4">True Partnership</LocalizedText>
        </div>
        <p className="value-desc" id="val4d">
          <LocalizedText page="about" id="val4d">We act as an extension of your team, not a vendor. Your success is our success — we're invested in the long game.</LocalizedText>
        </p>
      </div>
    </div>
  </section>
  <section className="team">
    <div>
      <div className="section-eyebrow" id="team1">
        <LocalizedText page="about" id="team1">The People</LocalizedText>
      </div>
      <h2 className="section-title" id="team2">
        <LocalizedText page="about" id="team2">Meet the Team</LocalizedText>
      </h2>
    </div>
    <div className="team-grid">
      <div className="team-card">
        <div className="team-photo">
          MD
        </div>
        <div className="team-overlay">
          <div className="team-name">
            Mohamed Ali Dridi
          </div>
          <div className="team-role">
            Founder &amp; CEO
          </div>
          <p className="team-bio">
            Visionary leader with a passion for digital innovation. Founded ZAYER Digital to help brands achieve measurable growth online.
          </p>
        </div>
      </div>
      <div className="team-card">
        <div className="team-photo">
          AG
        </div>
        <div className="team-overlay">
          <div className="team-name">
            Ahmed Guirat
          </div>
          <div className="team-role">
            Head of SEO
          </div>
          <p className="team-bio">
            SEO expert specializing in organic growth, keyword strategy, and technical optimization to drive sustainable traffic.
          </p>
        </div>
      </div>
      <div className="team-card">
        <div className="team-photo">
          MB
        </div>
        <div className="team-overlay">
          <div className="team-name">
            Mouna Bel Hedi
          </div>
          <div className="team-role">
            Head of Paid Media
          </div>
          <p className="team-bio">
            Performance marketing specialist managing Google &amp; Meta campaigns to maximize ROI for clients.
          </p>
        </div>
      </div>
      <div className="team-card">
        <div className="team-photo">
          NA
        </div>
        <div className="team-overlay">
          <div className="team-name">
            Nadia Ahmed
          </div>
          <div className="team-role">
            Creative Director
          </div>
          <p className="team-bio">
            Creative leader with an eye for branding, visual identity, and design that makes brands stand out.
          </p>
        </div>
      </div>
    </div>
  </section>
  <section className="timeline">
    <div className="section-eyebrow" id="timeline1">
      <LocalizedText page="about" id="timeline1">Our Journey</LocalizedText>
    </div>
    <h2 className="section-title" style={{ color: "var(--white)" }} id="timeline2">
      <LocalizedText page="about" id="timeline2">How We Got Here</LocalizedText>
    </h2>
    <div className="timeline-track">
      <div className="timeline-item">
        <div className="timeline-year">
          2020
        </div>
        <div className="timeline-event" id="t1">
          <LocalizedText page="about" id="t1">Founded</LocalizedText>
        </div>
        <p className="timeline-desc" id="t1d">
          <LocalizedText page="about" id="t1d">Launched with 3 clients and a clear mission.</LocalizedText>
        </p>
      </div>
      <div className="timeline-item">
        <div className="timeline-year">
          2021
        </div>
        <div className="timeline-event" id="t2">
          <LocalizedText page="about" id="t2">50 Clients</LocalizedText>
        </div>
        <p className="timeline-desc" id="t2d">
          <LocalizedText page="about" id="t2d">Expanded into paid media and social media management.</LocalizedText>
        </p>
      </div>
      <div className="timeline-item">
        <div className="timeline-year">
          2022
        </div>
        <div className="timeline-event" id="t3">
          <LocalizedText page="about" id="t3">Web Division</LocalizedText>
        </div>
        <p className="timeline-desc" id="t3d">
          <LocalizedText page="about" id="t3d">Launched Shopify and WordPress web design services.</LocalizedText>
        </p>
      </div>
      <div className="timeline-item">
        <div className="timeline-year">
          2023
        </div>
        <div className="timeline-event" id="t4">
          <LocalizedText page="about" id="t4">100+ Clients</LocalizedText>
        </div>
        <p className="timeline-desc" id="t4d">
          <LocalizedText page="about" id="t4d">Doubled the team and added Branding &amp; Creative department.</LocalizedText>
        </p>
      </div>
      <div className="timeline-item">
        <div className="timeline-year">
          2025
        </div>
        <div className="timeline-event" id="t5">
          <LocalizedText page="about" id="t5">200+ &amp; Growing</LocalizedText>
        </div>
        <p className="timeline-desc" id="t5d">
          <LocalizedText page="about" id="t5d">Over 200 clients served. Expanding internationally.</LocalizedText>
        </p>
      </div>
    </div>
  </section>
  <section className="about-cta">
    <h2 id="cta1">
      <LocalizedText page="about" id="cta1">Want to Be Part of the ZAYER Story?</LocalizedText>
    </h2>
    <Link className="btn-navy" id="cta2" to="/contact">
      <LocalizedText page="about" id="cta2">Start a Conversation</LocalizedText>
    </Link>
  </section>
</main>

<CMSComponents page="about" placement="bottom" />
</>;
}
