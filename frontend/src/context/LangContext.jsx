import { createContext, createElement, Fragment, useContext, useEffect, useMemo, useState } from 'react';
import pageTranslations from './originalTranslations.json';
import { useSiteContent } from './SiteContentContext';

const LangContext = createContext(null);
const interfaceText = {
  navMain: { en: 'Main navigation', fr: 'Navigation principale' },
  navChooseLanguage: { en: 'Choose language', fr: 'Choisir la langue' },
  navOpenMenu: { en: 'Open navigation menu', fr: 'Ouvrir le menu de navigation' },
  navCloseMenu: { en: 'Close navigation menu', fr: 'Fermer le menu de navigation' },
  navHome: { en: 'Home', fr: 'Accueil' },
  navServices: { en: 'Services', fr: 'Services' },
  navPortfolio: { en: 'Portfolio', fr: 'Portfolio' },
  navAbout: { en: 'About', fr: '\u00c0 propos' },
  navTraining: { en: 'Training', fr: 'Formation' },
  navInternational: { en: 'International', fr: 'International' },
  navPartnerships: { en: 'Partnerships', fr: 'Partenariats' },
  navCareers: { en: 'Careers', fr: 'Carri\u00e8res' },
  navContact: { en: 'Contact', fr: 'Contact' },
  navCta: { en: 'Get In Touch', fr: 'Nous contacter' },
  navLogin: { en: 'Login', fr: 'Connexion' },
  navQuote: { en: 'Request a quote', fr: 'Demander un devis' },
  admin: { en: 'Admin', fr: 'Administration' },
};

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem('zayer-language') === 'fr' ? 'fr' : 'en'; }
    catch { return 'en'; }
  });
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  const value = useMemo(() => ({
    lang,
    t(key) { return interfaceText[key]?.[lang] || key; },
    setLanguage(next) {
      const safe = next === 'fr' ? 'fr' : 'en';
      try { localStorage.setItem('zayer-language', safe); } catch { /* Storage can be disabled by the browser. */ }
      setLang(safe);
    },
    toggleLanguage() {
      const safe = lang === 'en' ? 'fr' : 'en';
      try { localStorage.setItem('zayer-language', safe); } catch { /* Storage can be disabled by the browser. */ }
      setLang(safe);
    },
  }), [lang]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const context = useContext(LangContext);
  if (!context) throw new Error('useLang must be used inside LangProvider');
  return context;
}

const allowedTags = new Set(['a', 'b', 'br', 'div', 'em', 'h2', 'h3', 'h4', 'i', 'li', 'ol', 'p', 'small', 'span', 'strong', 'u', 'ul']);
const voidTags = new Set(['br']);
const entityMap = { amp: '&', apos: "'", gt: '>', lt: '<', nbsp: '\u00a0', quot: '"' };

function decodeText(value) {
  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (match, code) => {
    if (code[0] === '#') {
      const hex = code[1]?.toLowerCase() === 'x';
      const value = Number.parseInt(code.slice(hex ? 2 : 1), hex ? 16 : 10);
      return Number.isFinite(value) ? String.fromCodePoint(value) : match;
    }
    return entityMap[code.toLowerCase()] ?? match;
  });
}

function parseInlineMarkup(markup) {
  const root = { tag: Fragment, props: {}, children: [] };
  const stack = [root];
  const tokens = String(markup).match(/<\/?[a-z][^>]*>|[^<]+|</gi) || [];
  tokens.forEach((token) => {
    if (!token.startsWith('<') || token === '<') {
      stack[stack.length - 1].children.push(decodeText(token));
      return;
    }
    const closing = /^<\//.test(token);
    const tagName = (token.match(/^<\/?\s*([a-z0-9]+)/i) || [])[1]?.toLowerCase();
    if (!tagName) return;
    if (closing) {
      for (let index = stack.length - 1; index > 0; index -= 1) {
        if (stack[index].name === tagName) { stack.length = index; break; }
      }
      return;
    }
    if (!allowedTags.has(tagName)) return;
    const props = {};
    const className = token.match(/\bclass\s*=\s*(["'])(.*?)\1/i)?.[2];
    if (className) props.className = className;
    if (tagName === 'a') {
      const href = token.match(/\bhref\s*=\s*(["'])(.*?)\1/i)?.[2] || '';
      if (/^(https?:|mailto:|tel:|\/|#)/i.test(href)) props.href = href;
      props.rel = 'noopener noreferrer';
    }
    const entry = { tag: tagName, name: tagName, props, children: [] };
    stack[stack.length - 1].children.push(entry);
    if (!voidTags.has(tagName) && !/\/\s*>$/.test(token)) stack.push(entry);
  });

  const render = (node, key) => {
    if (typeof node === 'string') return node;
    if (voidTags.has(node.tag)) return createElement(node.tag, { ...node.props, key });
    return createElement(node.tag, { ...node.props, key }, node.children.map((child, index) => render(child, `${key}-${index}`)));
  };
  return root.children.map((child, index) => render(child, `fragment-${index}`));
}

export function RichText({ value }) {
  return <>{parseInlineMarkup(value || '')}</>;
}

export function LocalizedText({ page, id, children }) {
  const { lang } = useLang();
  const { blocks, items, settings } = useSiteContent();
  const block = blocks.find((entry) => entry.bkey === id && (!entry.page || entry.page === page) && entry.visible !== false);
  const blockValue = block?.[lang === 'fr' ? 'value_fr' : 'value_en'];
  const setting = settings.find((entry) => entry.skey === `${page}.${id}` || entry.skey === id);
  const settingValue = setting?.[lang === 'fr' ? 'value_fr' : 'value_en'];
  const item = items.find((entry) => entry.page === page && (entry.id === id || entry.section === id) && entry.visible !== false);
  const itemValue = item && (item[lang === 'fr' ? 'text_fr' : 'text_en'] || item[lang === 'fr' ? 'title_fr' : 'title_en'] || item[lang === 'fr' ? 'sub_fr' : 'sub_en']);
  const originalValue = pageTranslations[page]?.[lang]?.[id];
  const value = blockValue || settingValue || itemValue || originalValue;
  return value ? parseInlineMarkup(value) : children;
}

export function localizedText(page, id, lang, fallback = '') {
  return pageTranslations[page]?.[lang]?.[id] || fallback;
}
