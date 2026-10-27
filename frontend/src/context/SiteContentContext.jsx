import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';

const fallbackContactBoxes = [
  { id: 'email', label_en: 'Email', label_fr: 'E-mail', label: 'Email', value: 'contact@zayerdigital.tn', icon: 'mail', visible: true },
  { id: 'phone-one', label_en: 'Phone', label_fr: 'Téléphone', label: 'Phone', value: '48 134 666', icon: 'phone', visible: true },
  { id: 'phone-two', label_en: 'Phone', label_fr: 'Téléphone', label: 'Phone', value: '48 138 020', icon: 'phone', visible: true },
  { id: 'location', label_en: 'Location', label_fr: 'Adresse', label: 'Location', value_en: '28 Av. Kheireddine Pacha, Tunis 1073, Tunisia', value_fr: '28 Av. Kheireddine Pacha, Tunis 1073, Tunisie', value: '28 Av. Kheireddine Pacha, Tunis 1073, Tunisia', icon: 'pin', visible: true },
];
const emptyContent = { items: [], blocks: [], components: [], settings: [], jobs: [], contactBoxes: fallbackContactBoxes, socialItems: [], portfolioItems: [], serviceItems: [] };
const SiteContentContext = createContext(emptyContent);

export function SiteContentProvider({ children }) {
  const [content, setContent] = useState(emptyContent);

  const refresh = useCallback(async () => {
    const [publicResult, portfolioResult] = await Promise.allSettled([api.get('/api/public/content'), api.get('/api/portfolio')]);
    setContent((current) => ({
      ...current,
      ...(publicResult.status === 'fulfilled' ? {
        items: publicResult.value.items || [], blocks: publicResult.value.blocks || [], components: publicResult.value.components || [],
        settings: publicResult.value.settings || [], jobs: publicResult.value.jobs || [],
      } : {}),
      ...(portfolioResult.status === 'fulfilled' ? {
        contactBoxes: portfolioResult.value.contactBoxes?.length ? portfolioResult.value.contactBoxes : fallbackContactBoxes, socialItems: portfolioResult.value.socialItems || [],
        portfolioItems: portfolioResult.value.items || [], serviceItems: portfolioResult.value.services || [],
      } : {}),
    }));
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener('site-content-updated', refresh);
    return () => window.removeEventListener('site-content-updated', refresh);
  }, [refresh]);

  const value = useMemo(() => ({ ...content, refresh }), [content, refresh]);
  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>;
}

export function useSiteContent() {
  return useContext(SiteContentContext);
}

export function localizedItem(item, field, language, fallback = '') {
  const localized = language === 'fr' ? item?.[`${field}_fr`] : item?.[`${field}_en`];
  return localized || fallback;
}

export function internalContentLink(value, fallback) {
  return /^\/(?!\/)[a-z0-9/_-]*$/i.test(String(value || '')) ? value : fallback;
}
