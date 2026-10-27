import { FaFacebookF, FaInstagram, FaLinkedinIn } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import footerStyles from '../styles/footer.css?inline';

const socialLinks = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/zayer-digital/', Icon: FaLinkedinIn },
  { label: 'Instagram', href: 'https://www.instagram.com/zayer.digital', Icon: FaInstagram },
  { label: 'Facebook', href: 'https://www.facebook.com/share/14cvdqFj14f/', Icon: FaFacebookF },
];

export default function Footer() {
  const { lang } = useLang();
  const fr = lang === 'fr';
  return <>
    <style>{footerStyles}</style>
    <footer className="zayer-footer">
      <div className="footer-top">
        <div className="footer-brand">
          <Link to="/" className="logo" aria-label="ZAYER Digital">ZAYER<span>.</span>Digital</Link>
          <p>{fr
            ? 'Une agence de marketing digital axée sur les résultats, qui accompagne les marques grâce à la stratégie, la créativité et la performance.'
            : 'A results-driven digital marketing agency helping brands grow through strategy, creativity, and performance.'}</p>
        </div>
        <div className="footer-col">
          <h4>{fr ? 'Entreprise' : 'Company'}</h4>
          <Link to="/about">{fr ? 'À propos' : 'About Us'}</Link>
          <Link to="/portfolio">Portfolio</Link>
          <Link to="/careers">{fr ? 'Carrières' : 'Careers'}</Link>
          <Link to="/contact">Contact</Link>
        </div>
        <div className="footer-col">
          <h4>{fr ? 'Services' : 'Services'}</h4>
          <Link to="/services">{fr ? 'SEO & Contenu' : 'SEO & Content'}</Link>
          <Link to="/services">{fr ? 'Réseaux Sociaux' : 'Social Media'}</Link>
          <Link to="/services">{fr ? 'Publicité Payante' : 'Paid Ads'}</Link>
          <Link to="/services">{fr ? 'Branding & Création' : 'Branding & Creative'}</Link>
          <Link to="/services">{fr ? 'Création Web' : 'Web Design'}</Link>
        </div>
        <div className="footer-col footer-contact">
          <h4>{fr ? 'Contact' : 'Contact'}</h4>
          <a href="mailto:contact@zayerdigital.tn">contact@zayerdigital.tn</a>
          <div className="footer-phones">
            <a href="tel:+21648134666">+216 48 134 666</a>
            <a href="tel:+21648138020">+216 48 138 020</a>
            <a href="tel:+21648131021">+216 48 131 021</a>
            <a href="tel:+21648131026">+216 48 131 026</a>
            <a href="tel:+21648103042">+216 48 103 042</a>
          </div>
          <span>{fr
            ? '28 Av. Kheireddine Pacha, Tunis 1073, Tunisie'
            : '28 Av. Kheireddine Pacha, Tunis 1073, Tunisia'}</span>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} ZAYER Digital. {fr ? 'Tous droits réservés.' : 'All rights reserved.'}</span>
        <div className="footer-socials" aria-label={fr ? 'Réseaux sociaux' : 'Social media'}>
          {socialLinks.map(({ label, href, Icon }) => <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label}><Icon size={16} aria-hidden="true" /></a>)}
        </div>
      </div>
    </footer>
  </>;
}
