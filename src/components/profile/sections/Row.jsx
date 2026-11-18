import { ChevronRight, Info, Link2 } from 'lucide-react';
import { cx } from '../../../utils/helpers';
import { isBadLink } from '../../../data/profileData';

// Text on the left, and ONE right-aligned column (status badge + ⓘ) so every list lines up.
export default function Row({ title, meta, desc, link, tags = [], badge, info, onClick }) {
  const bad = isBadLink(link);
  return (
    <div className="row" role="button" tabIndex={0} onClick={onClick} onKeyDown={(e) => e.key === 'Enter' && onClick()}>
      <div>
        <h3>{title}</h3>
        {meta && <p className="meta">{meta}</p>}
        {desc && <p>{desc}</p>}
        {link && (
          bad ? (
            <span className="lnk bad">
              <Link2 size={14} />
              {link} · invalid link
            </span>
          ) : (
            <a
              href={/^https?:\/\//i.test(link) ? link : `https://${link}`}
              target="_blank"
              rel="noopener noreferrer"
              className="lnk"
              onClick={(e) => e.stopPropagation()}
            >
              <Link2 size={14} />
              <span>{link}</span>
            </a>
          )
        )}
        {!!tags.length && <div className="tags sm">{tags.map((t) => <span key={t}>{t}</span>)}</div>}
      </div>
      <div className="row-side">
        <div className="row-top">
          {badge}
          {info && (
            <button className="ib sm" title={info} aria-label={`Details: ${info}`} onClick={(e) => e.stopPropagation()}>
              <Info size={15} />
            </button>
          )}
        </div>
      </div>
      <ChevronRight className="chev" size={16} />
    </div>
  );
}
