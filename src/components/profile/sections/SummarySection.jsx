import { Pencil } from 'lucide-react';
import Badge from '../ui/Badge';
import IconButton from '../ui/IconButton';
import SourceList from '../ui/SourceList';
import Section from './Section';
import EmptySectionCard from './EmptySectionCard';

export default function SummarySection({ summary, open, onToggle, onEdit }) {
  const hasText = summary?.text?.trim();
  return (
    <Section id="summary" open={open} onToggle={onToggle}
      actions={<IconButton label="Edit summary" onClick={onEdit}><Pencil size={16} /></IconButton>}>
      {hasText ? (
        <div className="sum" role="button" tabIndex={0} onClick={onEdit} onKeyDown={(e) => e.key === 'Enter' && onEdit()}>
          <p>{summary.text}</p>
          <div className="sum-m"><SourceList ids={summary.sources} />{summary.cut && <Badge>Needs review</Badge>}</div>
        </div>
      ) : (
        <EmptySectionCard type="summary" label="summary" onAdd={onEdit} />
      )}
    </Section>
  );
}
