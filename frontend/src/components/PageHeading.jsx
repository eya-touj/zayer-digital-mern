export default function PageHeading({ eyebrow, title, text, compact = false }) {
  return <div className={`page-heading ${compact ? 'compact' : ''}`}><span className="eyebrow"><i />{eyebrow}</span><h1>{title}</h1>{text && <p>{text}</p>}</div>;
}
