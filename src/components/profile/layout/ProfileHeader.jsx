import { Check, Clock, Mail, MapPin, Pencil, Phone } from 'lucide-react';
import Badge from '../ui/Badge';
import InIcon from '../ui/InIcon';
import CompletionCard from './CompletionCard';

export default function ProfileHeader({ profile: pr, hasIssues, comp, onEdit, onAct }) {
  const initials = pr.fullName.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const liHref = /^https?:\/\//i.test(pr.linkedin) ? pr.linkedin : `https://${pr.linkedin}`;

  return (
    <header className="card hdr">
      <button className="ib edit" aria-label="Edit profile" title="Edit profile" onClick={onEdit}><Pencil size={18} /></button>
      <div className="avatar" aria-hidden="true">{initials}</div>
      <div>
        <div className="nm">
          <h1>{pr.fullName}</h1>
          {hasIssues
            ? <Badge icon={<Clock size={14} />}>Needs Review</Badge>
            : <Badge tone="green" icon={<Check size={14} />}>Reviewed</Badge>}
        </div>
        <p className="role">{pr.title}</p>
        <div className="contact">
          {pr.email && (
            <a href={`mailto:${pr.email}`} className="contact-link">
              <Mail size={16} />
              <span>{pr.email}</span>
            </a>
          )}
          {pr.location && (
            <span>
              <MapPin size={16} />
              <span>{pr.location}</span>
            </span>
          )}
          {pr.phone && (
            <a href={`tel:${pr.phone.replace(/\s+/g, '')}`} className="contact-link">
              <Phone size={16} />
              <span>{pr.phone}</span>
            </a>
          )}
        </div>
        {pr.linkedin && <a className="li" href={liHref} target="_blank" rel="noopener noreferrer"><InIcon />{pr.linkedin}</a>}
        <div className="tags">{[pr.employment, ...(pr.tags || [])].filter(Boolean).map((t) => <span key={t}>{t}</span>)}</div>
      </div>
      <CompletionCard comp={comp} onAct={onAct} />
    </header>
  );
}
