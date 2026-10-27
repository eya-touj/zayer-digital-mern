import { RichText, useLang } from '../context/LangContext';
import { useSiteContent } from '../context/SiteContentContext';

export default function CMSComponents({ page, placement }) {
  const { lang } = useLang();
  const { components } = useSiteContent();
  const visible = components.filter((item) => item.page === page && item.placement === placement && item.visible !== false);

  return visible.map((item) => <section className="cms-component wrap" key={item.id || item._id}>
    {item.css && <style>{item.css}</style>}
    {item.title && <h2>{item.title}</h2>}
    <div className="zcms-component" data-component-id={String(item.id || item._id).replace(/[^a-z0-9_-]/gi, '')}>
      <RichText value={lang === 'fr' ? item.html_fr : item.html_en} />
    </div>
  </section>);
}
