import { CircleAlert } from 'lucide-react';
import Callout from './Callout';

// An exclamation mark on a value the system shows by its standard name. The
// full explanation is in the entry's edit panel, which the mark opens.
export default function NormalizedNote({ original, onOpen }) {
  if (!original) return null;
  const text = `Changed from "${original}"`;
  const mark = <CircleAlert size={13} />;
  return onOpen ? (
    <button type="button" className="norm-note" title={text} aria-label={text}
      onClick={(event) => { event.stopPropagation(); onOpen(); }}>
      {mark}
    </button>
  ) : (
    <em className="norm-note" title={text} aria-label={text}>{mark}</em>
  );
}

// The explanation shown in the edit panel of a standardized value.
export function NormalizedCallout({ original, shown }) {
  if (!original) return null;
  return (
    <Callout tone="blue">
      Changed from “{original}” to “{shown}”.
    </Callout>
  );
}
