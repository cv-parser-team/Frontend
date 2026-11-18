import { Clock } from 'lucide-react';
import { cx } from '../../../utils/helpers';

export default function SkillChip({ skill: s, onReview, onEdit }) {
  const handleClick = s.low ? onReview : onEdit;
  return (
    <button
      type="button"
      className={cx('chip', s.low && 'warn')}
      title={s.level || s.name}
      onClick={handleClick}
    >
      <span className="chip-label">{s.name}</span>
      {s.low && (
        <em className="mini">
          <Clock size={11} /> Needs Review
        </em>
      )}
    </button>
  );
}
