import { Plus } from 'lucide-react';
import IconButton from '../ui/IconButton';
import Section from './Section';
import Row from './Row';
import EmptySectionCard from './EmptySectionCard';
import { ROW } from './rowMappers';
import { infoText } from '../../../utils/helpers';

export default function CollectionSection({ type, label, items, total, open, onToggle, onAdd, onOpenItem }) {
  return (
    <Section id={type} count={total} open={open} onToggle={onToggle}
      actions={<IconButton label={`Add ${label}`} onClick={onAdd}><Plus size={16} /></IconButton>}>
      {items.length ? (
        items.map((x) => <Row key={x.id} {...ROW[type](x)} info={infoText(x)} sources={x.sources} onClick={() => onOpenItem(x.id)} />)
      ) : total ? (
        <p className="empty">Nothing matches your search.</p>
      ) : (
        <EmptySectionCard type={type} label={label} onAdd={onAdd} />
      )}
    </Section>
  );
}
