import { Plus } from 'lucide-react';
import IconButton from '../ui/IconButton';
import Section from './Section';
import SkillChip from './SkillChip';
import EmptySectionCard from './EmptySectionCard';

export default function SkillsSection({ items, total, open, onToggle, onAdd, onReview, onEdit }) {
  return (
    <Section id="skills" count={total} open={open} onToggle={onToggle}
      actions={<IconButton label="Add skill" onClick={onAdd}><Plus size={16} /></IconButton>}>
      {items.length ? (
        <div className="chips">
          {items.map((s) => (
            <SkillChip key={s.id} skill={s} onReview={() => onReview(s.id)}
              onEdit={() => onEdit(s.id)} />
          ))}
        </div>
      ) : total ? (
        <p className="empty">Nothing matches your search.</p>
      ) : (
        <EmptySectionCard type="skills" label="skill" onAdd={onAdd} />
      )}
    </Section>
  );
}
