import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useLang } from '../context/LangContext';

const links = [
  ['/', 'navHome', true],
  ['/services', 'navServices'],
  ['/portfolio', 'navPortfolio'],
  ['/about', 'navAbout'],
  ['/formation', 'navTraining'],
  ['/international', 'navPartnerships'],
  ['/careers', 'navCareers'],
];

export default function Navbar() {
  const { lang, setLanguage, t } = useLang();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const closeMenu = () => setOpen(false);

  useEffect(() => {
    closeMenu();
  }, [location.pathname, location.search, location.hash]);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event) => { if (event.key === 'Escape') closeMenu(); };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  useEffect(() => {
    const updateShadow = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', updateShadow, { passive: true });
    updateShadow();
    return () => window.removeEventListener('scroll', updateShadow);
  }, []);

  const languageSwitcher = <div className="nav-language-switch" role="group" aria-label={t('navChooseLanguage')}>
    <button type="button" className={lang === 'en' ? 'selected' : ''} aria-pressed={lang === 'en'} onClick={() => setLanguage('en')}>EN</button>
    <span aria-hidden="true">|</span>
    <button type="button" className={lang === 'fr' ? 'selected' : ''} aria-pressed={lang === 'fr'} onClick={() => setLanguage('fr')}>FR</button>
  </div>;

  return <nav id="navbar" className={`zayer-navbar${open ? ' menu-open' : ''}${scrolled ? ' scrolled' : ''}`} aria-label={t('navMain')}>
    <Link className="logo" to="/" aria-label={`ZAYER Digital - ${t('navHome')}`} onClick={closeMenu}>
      ZAYER<span>.</span>Digital
    </Link>
    <div className={`nav-content${open ? ' open' : ''}`} id="siteNavMenu">
      <ul className="nav-links" id="siteNavLinks">
        {links.map(([to, labelKey, exact]) => <li key={to}>
          <NavLink className="nav-link" to={to} end={Boolean(exact)} onClick={closeMenu}>{t(labelKey)}</NavLink>
        </li>)}
      </ul>
      <div className="nav-actions">
        <div className="nav-language-item">{languageSwitcher}</div>
        <NavLink className="nav-cta" to="/contact" onClick={closeMenu}>{t('navCta')}</NavLink>
      </div>
    </div>
    <div className="nav-mobile-controls">
      {languageSwitcher}
      <button className="hamburger" type="button" aria-label={open ? t('navCloseMenu') : t('navOpenMenu')} aria-controls="siteNavMenu" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
      </button>
    </div>
  </nav>;
}
