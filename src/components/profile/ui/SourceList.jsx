import { File as FileIcon } from 'lucide-react';
import { SOURCES } from '../../../data/profileData';
import InIcon from './InIcon';

export default function SourceList({ ids }) {
  return (
    <span className="src">
      {ids.map((id) => <span key={id}>{id === 'linkedin' ? <InIcon /> : <FileIcon size={13} />}{SOURCES[id]?.label ?? 'Source document'}</span>)}
    </span>
  );
}
