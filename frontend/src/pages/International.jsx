import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowRight, ArrowUpRight, CircleDot, Command, Diamond, Link2, Sparkles } from 'lucide-react';
import { useLang } from '../context/LangContext';
import CMSComponents from '../components/CMSComponents';
import pageStyles from '../styles/original-international.css?inline';
import responsiveStyles from '../styles/responsive.css?inline';

const content = {
  en: {
    home: 'Home', page: 'Partnerships', eyebrow: 'COLLABORATION · SHARED GROWTH', title: <>Stronger together.<br /><em>Built for what’s next.</em></>,
    intro: 'The right partnership brings the right people, ideas and capabilities into one direction. ZAYER Digital works with teams and businesses to turn complementary strengths into thoughtful digital experiences and measurable progress.',
    primary: 'Discuss a partnership', secondary: 'Explore collaboration models', proof: ['Clear shared goals', 'Complementary strengths', 'Progress you can track'], artLabel: 'Partnership ecosystem connecting strategy, creative, technology, delivery and growth',
    hub: 'PARTNERSHIPS', hubSub: 'ALIGN · BUILD · GROW', orbit: [['Strategy', 'Shared direction'], ['Creative', 'Better ideas'], ['Technology', 'Connected delivery'], ['Performance', 'Purposeful growth'], ['People', 'Stronger together']],
    principlesLabel: 'Our partnership principles', principles: ['Aligned objectives', 'Open communication', 'Practical execution', 'Continuous improvement'],
    modelsKicker: 'Ways to work together', modelsTitle: <>A good fit starts with<br /><em>shared ambition.</em></>,
    modelsIntro: 'Every collaboration has a different shape. Tell us what you’re building, where you need support, and what success should look like. We’ll explore a model that makes sense for both sides.',
    models: [
      ['Agency & white-label collaboration', 'Extend your delivery capacity with complementary creative, web and digital marketing support, scoped around your workflow and client needs.'],
      ['Technology & implementation', 'Work together on websites, e-commerce experiences, campaign assets and connected digital journeys where strategy meets execution.'],
      ['Referral & growth networks', 'Connect businesses with trusted complementary expertise through clear expectations, transparent communication and mutual value.'],
      ['Education & talent development', 'Explore practical workshops, learning initiatives and project-based collaboration around digital skills through ZAYER Academy.'],
    ], explore: 'Explore this model',
    approachKicker: 'A simple working model', approachTitle: <>Built on clarity.<br /><em>Driven by action.</em></>,
    approachIntro: 'Strong partnerships don’t need unnecessary complexity. They need a shared destination, clear roles and a practical way to learn as the work evolves.',
    note: 'We discuss scope, responsibilities, timing and success measures before proposing a way forward.',
    steps: [
      ['Listen & align', 'We learn about your team, audience, goals and the opportunity you see for collaboration.'],
      ['Define the scope', 'We clarify responsibilities, deliverables, communication and the practical constraints around the work.'],
      ['Build & deliver', 'We coordinate the right skills and keep the work moving with agreed checkpoints and transparent updates.'],
      ['Review & improve', 'We look at outcomes together, share learnings and identify the next useful opportunity.'],
    ],
    ctaKicker: 'Let’s start a conversation', ctaTitle: 'Have a partnership idea?',
    ctaCopy: 'Tell us about your organisation, the opportunity you see and the kind of collaboration you have in mind. We’ll take it from there.',
    ctaButton: 'Talk to our team',
  },
  fr: {
    home: 'Accueil', page: 'Partenariats', eyebrow: 'COLLABORATION · CROISSANCE PARTAGÉE', title: <>Ensemble, plus forts.<br /><em>Construisons la suite.</em></>,
    intro: 'Un partenariat réussi réunit les bonnes personnes, les bonnes idées et les bonnes compétences. ZAYER Digital accompagne les équipes et les entreprises pour transformer leurs forces complémentaires en expériences digitales utiles et en progrès mesurables.',
    primary: 'Parlons partenariat', secondary: 'Découvrir nos modèles de collaboration', proof: ['Des objectifs partagés', 'Des expertises complémentaires', 'Des progrès mesurables'], artLabel: 'Écosystème de partenariat reliant stratégie, création, technologie, réalisation et croissance',
    hub: 'PARTENARIATS', hubSub: 'ALIGNER · CONSTRUIRE · GRANDIR', orbit: [['Stratégie', 'Une direction commune'], ['Création', 'De meilleures idées'], ['Technologie', 'Une réalisation intégrée'], ['Performance', 'Une croissance utile'], ['Équipes', 'Ensemble, plus forts']],
    principlesLabel: 'Nos principes de partenariat', principles: ['Des objectifs alignés', 'Une communication ouverte', 'Une réalisation concrète', 'Une amélioration continue'],
    modelsKicker: 'Nos façons de collaborer', modelsTitle: <>Une bonne collaboration naît<br /><em>d’une ambition commune.</em></>,
    modelsIntro: 'Chaque collaboration est différente. Parlez-nous de votre projet, de vos besoins et de votre définition de la réussite. Nous définirons ensemble un modèle pertinent pour les deux équipes.',
    models: [
      ['Agence et marque blanche', 'Renforcez votre capacité de réalisation avec un appui complémentaire en création, web et marketing digital, adapté à vos méthodes et à vos clients.'],
      ['Technologie et mise en œuvre', 'Concevons ensemble des sites, des expériences e-commerce, des campagnes et des parcours digitaux qui relient stratégie et réalisation.'],
      ['Réseaux de recommandation et de croissance', 'Mettez les entreprises en relation avec des expertises complémentaires, dans un cadre clair, transparent et mutuellement bénéfique.'],
      ['Formation et développement des talents', 'Imaginons des ateliers pratiques et des projets collaboratifs autour des compétences digitales avec ZAYER Academy.'],
    ], explore: 'Découvrir ce modèle',
    approachKicker: 'Un modèle de travail simple', approachTitle: <>La clarté comme base.<br /><em>L’action comme moteur.</em></>,
    approachIntro: 'Un partenariat solide n’a pas besoin de complexité inutile. Il repose sur un objectif commun, des rôles clairs et une méthode concrète pour apprendre au fil du projet.',
    note: 'Avant de proposer une méthode, nous échangeons sur le périmètre, les responsabilités, le calendrier et les indicateurs de réussite.',
    steps: [
      ['Écouter et s’aligner', 'Nous découvrons votre équipe, votre public, vos objectifs et les possibilités de collaboration.'],
      ['Définir le périmètre', 'Nous clarifions les responsabilités, les livrables, la communication et les contraintes du projet.'],
      ['Construire et réaliser', 'Nous réunissons les bonnes compétences et faisons avancer le travail avec des étapes convenues et des points réguliers.'],
      ['Évaluer et progresser', 'Nous analysons les résultats ensemble, partageons les apprentissages et identifions la prochaine opportunité.'],
    ],
    ctaKicker: 'Commençons la conversation', ctaTitle: 'Vous avez une idée de partenariat ?',
    ctaCopy: 'Parlez-nous de votre organisation, de l’opportunité que vous avez identifiée et de la collaboration que vous imaginez. Nous construirons la suite ensemble.',
    ctaButton: 'Échanger avec notre équipe',
  },
};

const modelIcons = [ArrowUpRight, Command, CircleDot, Sparkles];
const proofIcons = [Sparkles, ArrowUpRight, CircleDot];
const principleIcons = [Sparkles, Diamond, ArrowUpRight, CircleDot];
const orbitIcons = [Link2, Sparkles, Command, ArrowUpRight, CircleDot];

export default function International() {
  const { lang } = useLang();
  const text = content[lang] || content.en;

  useEffect(() => {
    const navbar = document.getElementById('navbar');
    const onScroll = () => navbar?.classList.toggle('scrolled', window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    const revealItems = [...document.querySelectorAll('.international-page .reveal')];
    const observer = 'IntersectionObserver' in window ? new IntersectionObserver((entries, instance) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          instance.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 }) : null;
    revealItems.forEach((node) => { node.classList.add('visible'); observer?.observe(node); });
    return () => { window.removeEventListener('scroll', onScroll); observer?.disconnect(); };
  }, []);

  return <>
    <style>{pageStyles}{responsiveStyles}</style>
    <CMSComponents page="international" placement="top" />
    <main className="international-page">
      <section className="hero">
        <div className="hero-grid">
          <div className="hero-content">
            <div className="breadcrumb"><Link to="/">{text.home}</Link><span>/</span><span>{text.page}</span></div>
            <p className="eyebrow">{text.eyebrow}</p>
            <h1>{text.title}</h1>
            <p className="hero-copy">{text.intro}</p>
            <div className="hero-actions">
              <Link className="btn btn-primary" to="/contact?subject=Partnership%20enquiry">{text.primary}<span aria-hidden="true"><ArrowUpRight size={16} aria-hidden="true" /></span></Link>
              <a className="btn btn-ghost" href="#models">{text.secondary}<span aria-hidden="true"><ArrowDown size={16} aria-hidden="true" /></span></a>
            </div>
            <div className="hero-proof">{text.proof.map((item, index) => { const Icon = proofIcons[index]; return <span key={item}><b><Icon size={18} aria-hidden="true" /></b>{item}</span>; })}</div>
          </div>
          <div className="partner-art" aria-label={text.artLabel}>
            <div className="ring r3"></div><div className="ring"></div><div className="ring r2"></div>
            <span className="orbit-dot dot-a"></span><span className="orbit-dot dot-b"></span><span className="orbit-dot dot-c"></span>
            <div className="hub"><div className="hub-mark">Z.</div><strong>{text.hub}</strong><small>{text.hubSub}</small></div>
            {text.orbit.map(([title, detail], index) => { const Icon = orbitIcons[index]; return <div className={`orbit-card c${index + 1}`} key={title}><span className="symbol"><Icon size={18} aria-hidden="true" /></span><span><strong>{title}</strong><small>{detail}</small></span></div>; })}
          </div>
        </div>
      </section>
      <section className="trust-strip" aria-label={text.principlesLabel}>
        <div className="trust-inner">{text.principles.map((item, index) => { const Icon = principleIcons[index]; return <div className="trust-item" key={item}><span className="mini"><Icon size={18} aria-hidden="true" /></span><span>{item}</span></div>; })}</div>
      </section>
      <section className="section models" id="models">
        <div className="section-inner">
          <div className="section-heading reveal"><p className="section-kicker">{text.modelsKicker}</p><h2 className="section-title">{text.modelsTitle}</h2><p className="section-intro">{text.modelsIntro}</p></div>
          <div className="model-grid">{text.models.map(([title, description], index) => { const Icon = modelIcons[index]; return <article className="model-card reveal" key={title}><span className="model-index">0{index + 1}</span><div className="model-icon"><Icon size={18} aria-hidden="true" /></div><h3>{title}</h3><p>{description}</p><Link className="model-link" to={`/contact?subject=${encodeURIComponent(title)}`}>{text.explore}<span><ArrowRight size={16} aria-hidden="true" /></span></Link></article>; })}</div>
        </div>
      </section>
      <section className="section approach">
        <div className="section-inner approach-layout">
          <div className="approach-intro reveal"><p className="section-kicker">{text.approachKicker}</p><h2 className="section-title">{text.approachTitle}</h2><p className="section-intro">{text.approachIntro}</p><div className="outline-note">{text.note}</div></div>
          <div className="steps">{text.steps.map(([title, description], index) => <article className="step reveal" key={title}><div className="step-no">0{index + 1}</div><div><h3>{title}</h3><p>{description}</p></div></article>)}</div>
        </div>
      </section>
      <section className="cta-section">
        <div className="cta-panel"><div className="cta-copy"><p className="section-kicker">{text.ctaKicker}</p><h2>{text.ctaTitle}</h2><p>{text.ctaCopy}</p></div><Link className="btn btn-primary" to="/contact?subject=Partnership%20enquiry">{text.ctaButton}<span aria-hidden="true"><ArrowUpRight size={16} aria-hidden="true" /></span></Link></div>
      </section>
    </main>
    <CMSComponents page="international" placement="bottom" />
  </>;
}
