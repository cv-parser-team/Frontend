import { Clock, Pencil, X } from 'lucide-react';
import { cx } from '../../../utils/helpers';

export default function SkillChip({ skill: s, editing, onReview, onEdit, onRemove }) {
  const asBtn = s.low && !editing;
  const C = asBtn ? 'button' : 'span';
  return (
    <C className={cx('chip', s.low && 'warn')} title={s.level} onClick={asBtn ? onReview : undefined}>
      {s.name}
      {s.low && <em className="mini"><Clock size={12} /> Needs Review</em>}
      {editing && <>
        <button className="chip-edit" aria-label={`Edit ${s.name}`} onClick={(event) => { event.stopPropagation(); onEdit(); }}><Pencil size={13} /></button>
        <button className="chip-x" aria-label={`Remove ${s.name}`} onClick={(event) => { event.stopPropagation(); onRemove(); }}><X size={14} /></button>
      </>}
    </C>
  );
}
