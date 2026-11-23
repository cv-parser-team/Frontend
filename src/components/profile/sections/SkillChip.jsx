import { Clock, TriangleAlert } from 'lucide-react';
import { cx } from '../../../utils/helpers';
import NormalizedNote from '../ui/NormalizedNote';

export default function SkillChip({ skill: s, onReview, onEdit }) {
  const handleClick = s.low ? onReview : onEdit;
  return (
    <span className="skill-chip-wrap">
      <button
        type="button"
        className={cx('chip', s.low && 'warn')}
        title={s.level || s.name}
        onClick={handleClick}
      >
        <span className="chip-label">{s.name}</span>
        {/* The chip itself opens the edit panel, which explains the change. */}
        <NormalizedNote original={s.normalizedFrom?.name} />
        {s.low && (
          <em className="mini">
            <Clock size={11} /> Needs Review
          </em>
        )}
        {s.mergeNotices?.length > 0 && <TriangleAlert size={13} aria-label="Automatic merge needs acknowledgment" />}
      </button>
    </span>
  );
}
