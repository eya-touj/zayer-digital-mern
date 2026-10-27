import { lazy, Suspense, useLayoutEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ZayaWidget from './components/ZayaWidget';
import { NotFoundPage } from './components/ui/404-page-not-found';
import { useLang } from './context/LangContext';
import { useSiteContent } from './context/SiteContentContext';

const Home = lazy(() => import('./pages/Home'));
const Services = lazy(() => import('./pages/Services'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Careers = lazy(() => import('./pages/Careers'));
const Formation = lazy(() => import('./pages/Formation'));
const International = lazy(() => import('./pages/International'));
const Devis = lazy(() => import('./pages/Devis'));
const Portfolio = lazy(() => import('./pages/Portfolio'));
const Admin = lazy(() => import('./pages/Admin'));

function ScrollToTop() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    window.history.scrollRestoration = 'manual';
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}

function AppRoutes() {
  const location = useLocation();
  const portfolioAdmin = location.pathname.startsWith('/portfolio') && new URLSearchParams(location.search).has('admin');
  const isStandaloneRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/devis');
  const showPublicChrome = !isStandaloneRoute && !portfolioAdmin;
  const showAssistant = showPublicChrome;
  const { lang } = useLang();
  const { settings } = useSiteContent();

  const routeTitles = {
    '/': ['Home', 'Accueil'],
    '/index.html': ['Home', 'Accueil'],
    '/services': ['Services', 'Services'],
    '/services.html': ['Services', 'Services'],
    '/portfolio': ['Portfolio', 'Portfolio'],
    '/portfolio.html': ['Portfolio', 'Portfolio'],
    '/portfolio/index.php': ['Portfolio', 'Portfolio'],
    '/about': ['About', 'À propos'],
    '/about.html': ['About', 'À propos'],
    '/contact': ['Contact', 'Contact'],
    '/contact.html': ['Contact', 'Contact'],
    '/careers': ['Careers', 'Carrières'],
    '/careers.html': ['Careers', 'Carrières'],
    '/formation': ['Training', 'Formation'],
    '/formation.html': ['Training', 'Formation'],
    '/international': ['Partnerships', 'Partenariats'],
    '/international.html': ['Partnerships', 'Partenariats'],
    '/partnerships.html': ['Partnerships', 'Partenariats'],
    '/devis': ['Quote', 'Devis'],
    '/devis/index.html': ['Quote', 'Devis'],
    '/admin': ['Admin', 'Administration'],
    '/admin/': ['Admin', 'Administration'],
    '/admin/index.html': ['Admin', 'Administration'],
  };
  const normalizedPath = location.pathname.replace(/\/$/, '') || '/';
  const pageTitle = portfolioAdmin
    ? (lang === 'fr' ? 'Administration' : 'Admin')
    : routeTitles[location.pathname]?.[lang === 'fr' ? 1 : 0]
      || routeTitles[normalizedPath]?.[lang === 'fr' ? 1 : 0]
      || (lang === 'fr' ? 'Page introuvable' : 'Page not found');

  useLayoutEffect(() => {
    const suffixKey = lang === 'fr' ? 'value_fr' : 'value_en';
    const seoTitle = settings.find((setting) => setting.skey === 'seo_title')?.[suffixKey];
    const seoDescription = settings.find((setting) => setting.skey === 'seo_description')?.[suffixKey];
    document.title = `${pageTitle} | ${seoTitle || 'ZAYER Digital'}`;
    let description = document.querySelector('meta[name="description"]');
    if (!description) {
      description = document.createElement('meta');
      description.name = 'description';
      document.head.appendChild(description);
    }
    description.content = seoDescription || '';
  }, [pageTitle, settings, lang]);
  return <>{showPublicChrome && <Navbar />}<Suspense fallback={<div aria-live="polite" style={{ minHeight: '100vh' }}>{lang === 'fr' ? 'Chargement…' : 'Loading…'}</div>}><Routes>
    <Route path="/" element={<Home />} />
    <Route path="/index.html" element={<Home />} />
    <Route path="/about" element={<About />} />
    <Route path="/about.html" element={<About />} />
    <Route path="/services" element={<Services />} />
    <Route path="/services.html" element={<Services />} />
    <Route path="/contact" element={<Contact />} />
    <Route path="/contact.html" element={<Contact />} />
    <Route path="/careers" element={<Careers />} />
    <Route path="/careers.html" element={<Careers />} />
    <Route path="/formation" element={<Formation />} />
    <Route path="/formation.html" element={<Formation />} />
    <Route path="/international" element={<International />} />
    <Route path="/international.html" element={<International />} />
    <Route path="/partnerships.html" element={<International />} />
    <Route path="/portfolio" element={<Portfolio />} />
    <Route path="/portfolio/" element={<Portfolio />} />
    <Route path="/portfolio.html" element={<Portfolio />} />
    <Route path="/portfolio/index.php" element={<Portfolio />} />
    <Route path="/admin/*" element={<Admin />} />
    <Route path="/devis" element={<Devis />} />
    <Route path="/devis/index.html" element={<Devis />} />
    <Route path="*" element={<NotFoundPage />} />
  </Routes></Suspense>{showPublicChrome && <Footer />}{showAssistant && <ZayaWidget />}</>;
}

export default function App() {
  return <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><ScrollToTop /><AppRoutes /></BrowserRouter>;
}
