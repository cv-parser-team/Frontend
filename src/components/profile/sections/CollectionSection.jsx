import { Plus } from 'lucide-react';
import IconButton from '../ui/IconButton';
import Section from './Section';
import Row from './Row';
import EmptySectionCard from './EmptySectionCard';
import { ROW } from './rowMappers';
import { infoText } from '../../../utils/helpers';

// An entry standing for copies the candidate has not merged yet opens their
// comparison instead of its own edit panel.
function rowProps(type, x, onOpenItem, onOpenDuplicates) {
  const row = ROW[type](x);
  if (!x.duplicates) {
    return { ...row, onClick: () => onOpenItem(x.id) };
  }
  return {
    ...row,
    badge: <span className="bd amber">{x.duplicates.count} sources · Possible duplicate</span>,
    onClick: () => onOpenDuplicates(x.duplicates.group),
  };
}

export default function CollectionSection({ type, label, items, total, open, onToggle, onAdd, onOpenItem, onOpenDuplicates }) {
  return (
    <Section id={type} count={total} open={open} onToggle={onToggle}
      actions={<IconButton label={`Add ${label}`} onClick={onAdd}><Plus size={16} /></IconButton>}>
      {items.length ? (
        items.map((x) => <Row key={x.id} {...rowProps(type, x, onOpenItem, onOpenDuplicates)} info={infoText(x)} />)
      ) : total ? (
        <p className="empty">Nothing matches your search.</p>
      ) : (
        <EmptySectionCard type={type} label={label} onAdd={onAdd} />
      )}
    </Section>
  );
}
