import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaFacebookF, FaInstagram, FaLinkedinIn } from 'react-icons/fa';
import { LocalizedText, useLang } from '../context/LangContext';
import CMSComponents from '../components/CMSComponents';
import pageStyles from '../styles/original-services.css?inline';
import responsiveStyles from '../styles/responsive.css?inline';
import { useSiteContent } from '../context/SiteContentContext';
import { api } from '../lib/api';

export default function Services() {
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
  return <><style>{pageStyles}{responsiveStyles}</style><CMSComponents page="services" placement="top" />
<section className="page-hero">
  <video className="page-hero-video" autoPlay muted loop playsInline preload="metadata" aria-hidden="true">
    <source src="/hero-2.mp4" type="video/mp4" />
  </video>
  <div className="page-hero-overlay"></div>
  <div className="page-hero-content">
    <div className="section-eyebrow" id="services1">
      <LocalizedText page="services" id="services1">What We Do</LocalizedText>
    </div>
    <h1 id="services2">
      <LocalizedText page="services" id="services2">Services Built for
        <br />
        Real Results</LocalizedText>
    </h1>
  </div>
</section>
<section className="services" id="services">
  <div className="services-grid">
    <div className="service-card reveal">
      <div className="service-num">
        01
      </div>
      <div className="service-name" id="s1">
        <LocalizedText page="services" id="s1">SEO &amp; Content Marketing</LocalizedText>
      </div>
      <p className="service-desc" id="s1d">
        <LocalizedText page="services" id="s1d">Rank higher, attract the right audience, and build authority that compounds over time. We craft strategies that drive sustainable organic growth.</LocalizedText>
      </p>
    </div>
    <div className="service-card reveal" style={{ transitionDelay: "0.1s" }}>
      <div className="service-num">
        02
      </div>
      <div className="service-name" id="s2">
        <LocalizedText page="services" id="s2">Social Media Management</LocalizedText>
      </div>
      <p className="service-desc" id="s2d">
        <LocalizedText page="services" id="s2d">We manage your presence across all major platforms — creating scroll-stopping content that builds community, trust, and brand loyalty.</LocalizedText>
      </p>
    </div>
    <div className="service-card reveal" style={{ transitionDelay: "0.2s" }}>
      <div className="service-num">
        03
      </div>
      <div className="service-name" id="s3">
        <LocalizedText page="services" id="s3">Paid Ads — Google &amp; Meta</LocalizedText>
      </div>
      <p className="service-desc" id="s3d">
        <LocalizedText page="services" id="s3d">High-converting campaigns engineered for maximum ROI. From strategy and creative to bidding and optimization — we handle everything.</LocalizedText>
      </p>
    </div>
    <div className="service-card reveal" style={{ transitionDelay: "0.3s" }}>
      <div className="service-num">
        04
      </div>
      <div className="service-name" id="s4">
        <LocalizedText page="services" id="s4">Branding &amp; Creative</LocalizedText>
      </div>
      <p className="service-desc" id="s4d">
        <LocalizedText page="services" id="s4d">Your brand is your promise. We build cohesive visual identities — logos, style guides, and assets — that set you apart from day one.</LocalizedText>
      </p>
    </div>
    <div className="service-card reveal" style={{ transitionDelay: "0.4s" }}>
      <div className="service-num">
        05
      </div>
      <div className="service-name" id="s5">
        <LocalizedText page="services" id="s5">Shopify &amp; WordPress Websites</LocalizedText>
      </div>
      <p className="service-desc" id="s5d">
        <LocalizedText page="services" id="s5d">Fast, beautiful, conversion-optimised websites built on the platforms that power millions of businesses. From launch to long-term growth.</LocalizedText>
      </p>
    </div>
    <div className="service-card reveal" style={{ transitionDelay: "0.5s" }}>
      <div className="service-num">
        06
      </div>
      <div className="service-name" id="s6">
        <LocalizedText page="services" id="s6">Digital Strategy</LocalizedText>
      </div>
      <p className="service-desc" id="s6d">
        <LocalizedText page="services" id="s6d">Before tactics, comes strategy. We audit your digital footprint, analyse competitors, and build a roadmap aligned to your business goals.</LocalizedText>
      </p>
    </div>
  </div>
</section>
<section className="cta-banner">
  <h2 id="cta1">
    <LocalizedText page="services" id="cta1">Ready to Grow Your Business Digitally?</LocalizedText>
  </h2>
  <Link className="btn-navy" id="cta2" to="/contact">
    <LocalizedText page="services" id="cta2">Get a Free Strategy Call</LocalizedText>
  </Link>
</section>

<CMSComponents page="services" placement="bottom" />
</>;
}
